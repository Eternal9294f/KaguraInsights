'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Mail,
  ShieldCheck,
  Search,
  Upload,
  RefreshCw,
  ExternalLink,
  Lock,
  Check,
  XCircle,
  TrendingDown,
  Layers,
  ChevronRight,
  Sliders,
  AlertCircle
} from 'lucide-react';

import {
  RawReview,
  ClassifiedReview,
  FrictionTheme,
  ProductRecommendation,
  WeeklyProductPulse,
  ApprovalRecord,
  DownstreamDispatchResult,
  PipelineExecutionResult
} from '@/types';

import defaultReviewsData from '../../data/reviews.json';

export default function KaguraMinimalApp() {
  // Stepper: 1: Ingestion & Explorer, 2: 5-Categories, 3: Themes & Evidence, 4: Weekly Pulse, 5: HITL Gate & MCP
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Core Data
  const [reviews, setReviews] = useState<RawReview[]>(defaultReviewsData as RawReview[]);
  const [classifiedReviews, setClassifiedReviews] = useState<ClassifiedReview[]>([]);
  const [themes, setThemes] = useState<FrictionTheme[]>([]);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [pulse, setPulse] = useState<WeeklyProductPulse | null>(null);
  const [approvalRecord, setApprovalRecord] = useState<ApprovalRecord | null>(null);
  const [dispatchResult, setDispatchResult] = useState<DownstreamDispatchResult | null>(null);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editedPulseText, setEditedPulseText] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('aditya.pm@groww.in');

  // Execution Mode
  const [executionMode, setExecutionMode] = useState<'LOCAL_ENGINE' | 'N8N_CLOUD_WEBHOOK'>('LOCAL_ENGINE');
  const [n8nPipelineUrl, setN8nPipelineUrl] = useState<string>('https://n8n.cloud/webhook/review-intelligence-pipeline');
  const [n8nDispatchUrl, setN8nDispatchUrl] = useState<string>('https://n8n.cloud/webhook/dispatch-approved-pulse');
  const [showConfig, setShowConfig] = useState<boolean>(false);

  useEffect(() => {
    runPipeline(reviews);
  }, []);

  async function runPipeline(data: RawReview[]) {
    setLoading(true);
    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: data,
          workspace: 'Groww Mutual Funds & Stocks',
          execution_mode: executionMode,
          n8n_webhook_url: executionMode === 'N8N_CLOUD_WEBHOOK' ? n8nPipelineUrl : undefined
        })
      });

      const result: PipelineExecutionResult = await res.json();
      if (result) {
        setClassifiedReviews((result as any).classified_reviews || []);
        setThemes(result.themes || []);
        setRecommendations(result.recommendations || []);
        setPulse(result.weekly_pulse || null);
        setApprovalRecord(result.approval_record || null);
        setEditedPulseText(result.weekly_pulse?.markdown_full || '');
        setDispatchResult(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setReviews(parsed);
            runPipeline(parsed);
          }
        } else {
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          const parsed: RawReview[] = [];
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (parts.length >= 2) {
              parsed.push({
                review_id: parts[0]?.replace(/"/g, '').trim() || `REV-${i}`,
                review_text: parts[1]?.replace(/"/g, '').trim() || '',
                rating: Number(parts[2]?.replace(/"/g, '').trim()) || 1,
                review_date: parts[3]?.replace(/"/g, '').trim() || '2026-09-01',
                app_version: parts[4]?.replace(/"/g, '').trim() || 'v8.15.0',
                platform: parts[5]?.replace(/"/g, '').trim() || 'Google Play',
                source_url: parts[6]?.replace(/"/g, '').trim() || 'https://groww.in'
              });
            }
          }
          if (parsed.length > 0) {
            setReviews(parsed);
            runPipeline(parsed);
          }
        }
      } catch (err) {
        alert('Invalid file format. Please upload CSV or JSON.');
      }
    };
    reader.readAsText(file);
  }

  async function handleApproveAndDispatch() {
    if (!approvalRecord) return;
    setDispatching(true);

    try {
      const updated: ApprovalRecord = {
        ...approvalRecord,
        status: 'APPROVED',
        reviewer_id: 'PM-Groww-Lead',
        reviewer_name: 'Lead Product Manager',
        timestamp: new Date().toISOString(),
        approved_pulse_content: editedPulseText,
        recipient_email: recipientEmail,
        authorized_actions: {
          create_google_doc: true,
          create_gmail_draft: true
        },
        signature_hash: `SIG-GW-${Date.now().toString(36).toUpperCase()}`
      };

      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_record: updated,
          execution_mode: executionMode,
          n8n_dispatch_webhook_url: executionMode === 'N8N_CLOUD_WEBHOOK' ? n8nDispatchUrl : undefined
        })
      });

      const resData: DownstreamDispatchResult = await res.json();
      setApprovalRecord(updated);
      setDispatchResult(resData);
    } catch (err) {
      alert('Error during downstream dispatch.');
    } finally {
      setDispatching(false);
    }
  }

  const filteredReviews = classifiedReviews.filter((r) => {
    const matchSearch =
      r.review_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.review_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || r.category_id === selectedCategory;
    return matchSearch && matchCat;
  });

  const wordCount = editedPulseText
    .replace(/[#*_`\-\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#eceef3] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Delicate Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Minimal Top Header */}
      <header className="border-b border-white/[0.06] bg-[#0c0e14]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-semibold text-emerald-400 text-sm">
              K
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm tracking-tight text-white">Kagura</span>
                <span className="text-[10px] text-white/50 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full">
                  Groww Intelligence
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-white/70 transition"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>{executionMode === 'LOCAL_ENGINE' ? 'Local Engine' : 'n8n Cloud'}</span>
            </button>

            <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-white/70 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload CSV</span>
              <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => runPipeline(defaultReviewsData as RawReview[])}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#090a0f] font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Processing...' : 'Run Pipeline'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Container */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* ========================================================= */}
        {/* CENTERED HERO EXPLANATION (Peaceful & Clean)              */}
        {/* ========================================================= */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
            <Sparkles className="w-3 h-3" /> Customer Feedback Intelligence Platform
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Turn public app reviews into actionable product decisions.
          </h1>

          <p className="text-sm text-white/60 leading-relaxed">
            Kagura normalizes raw reviews for <span className="text-white font-medium">Groww</span>, categorizes complaints into 5 core types, quantifies recurring friction, and crafts an executive Weekly Product Pulse gated by Human-in-the-Loop approval.
          </p>
        </div>

        {/* ========================================================= */}
        {/* MINIMALIST 5-STEP JOURNEY STEPPER                         */}
        {/* ========================================================= */}
        <div className="border border-white/[0.08] bg-[#0d0f16]/90 p-1.5 rounded-2xl flex items-center justify-between text-xs">
          {[
            { id: 1, label: '1. Reviews Ingestion' },
            { id: 2, label: '2. 5-Categories' },
            { id: 3, label: '3. Theme Friction' },
            { id: 4, label: '4. Weekly Pulse' },
            { id: 5, label: '5. Human Approval' }
          ].map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex-1 py-2 rounded-xl font-medium transition text-center ${
                currentStep === step.id
                  ? 'bg-white/[0.08] text-white shadow-sm border border-white/[0.06]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* STEP 1: REVIEWS INGESTION & EXPLORER                     */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search reviews or Review ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#11131a] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs text-white/50">
                <span>{filteredReviews.length} reviews loaded</span>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg transition"
                >
                  <span>Next: 5-Categories</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="border border-white/[0.08] bg-[#0c0e15] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              {filteredReviews.slice(0, 10).map((r) => (
                <div key={r.review_id} className="p-4 hover:bg-white/[0.02] transition space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 font-semibold">{r.review_id}</span>
                      <span className="text-white/30">&bull;</span>
                      <span className="text-white/50">{r.review_date}</span>
                      <span className="text-white/30">&bull;</span>
                      <span className="text-amber-400/90 font-medium">{r.rating} ★</span>
                    </div>
                    <span className="text-[11px] bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded text-white/60">
                      {r.category_name}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{r.review_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: 5-CATEGORY ISSUE TAXONOMY                         */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Canonical 5-Category Taxonomy</h3>
                <p className="text-xs text-white/50">Every review maps to one defined friction category without ambiguity.</p>
              </div>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg transition"
              >
                <span>Next: Themes & Ranks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  id: 'fees_and_charges',
                  name: 'Fees, Charges & Statutory Deductions',
                  count: classifiedReviews.filter((r) => r.category_id === 'fees_and_charges').length,
                  desc: 'Exit loads, AMC statutory deductions, GST/STT fee misconceptions.',
                  rule: 'Prioritized when perceived financial loss is the primary dispute.'
                },
                {
                  id: 'orders_and_redemptions',
                  name: 'Orders, Transactions & Redemptions',
                  count: classifiedReviews.filter((r) => r.category_id === 'orders_and_redemptions').length,
                  desc: 'NAV cut-off allotment lag, SIP processing delays, double payment debits.',
                  rule: 'Applies when transaction settlement timing fails.'
                },
                {
                  id: 'kyc_and_banking',
                  name: 'Account Onboarding, KYC & Banking',
                  count: classifiedReviews.filter((r) => r.category_id === 'kyc_and_banking').length,
                  desc: 'Penny-drop verification, Aadhaar OTP timeouts, bank mandate failures.',
                  rule: 'Applies to bank linking and KRA regulatory verification.'
                },
                {
                  id: 'app_performance_ui',
                  name: 'App Usability, UI & Performance',
                  count: classifiedReviews.filter((r) => r.category_id === 'app_performance_ui').length,
                  desc: 'App freezes at 9:15 AM market open, chart latency, biometric login loops.',
                  rule: 'Applies to client app latency and device crashes.'
                },
                {
                  id: 'support_and_disputes',
                  name: 'Customer Support & Dispute Escalations',
                  count: classifiedReviews.filter((r) => r.category_id === 'support_and_disputes').length,
                  desc: 'Chatbot looping, premature ticket closures, lack of phone helpline.',
                  rule: 'Applies when support unresponsiveness is the primary grievance.'
                }
              ].map((c) => (
                <div key={c.id} className="border border-white/[0.08] bg-[#0c0e15] p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">{c.name}</span>
                    <span className="text-xs bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded font-mono text-white/70">
                      {c.count} reviews
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{c.desc}</p>
                  <div className="text-[11px] text-white/40 pt-2 border-t border-white/[0.04]">
                    <span className="text-white/60 font-medium">Ambiguity Rule:</span> {c.rule}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: THEME INTELLIGENCE & EVIDENCE RANKING             */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Frequency-Ranked Friction Themes</h3>
                <p className="text-xs text-white/50">Transparent complaints ranking with zero double-counting across clusters.</p>
              </div>
              <button
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg transition"
              >
                <span>Next: Weekly Pulse</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {themes.slice(0, 3).map((t, idx) => (
                <div key={t.theme_id} className="border border-white/[0.08] bg-[#0c0e15] p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-white">{t.theme_name}</span>
                    </div>
                    <div className="text-xs text-white/60 font-mono">
                      <strong className="text-white">{t.review_count}</strong> complaints ({t.percentage_of_corpus}%)
                    </div>
                  </div>

                  <p className="text-xs text-white/60 leading-relaxed">
                    <span className="text-white/80 font-medium">Root Cause:</span> {t.underlying_cause}
                  </p>

                  <div className="bg-[#11131a] p-3 rounded-xl border border-white/[0.04] text-xs italic text-white/70">
                    "{t.quotations[0]?.quote}"
                    <div className="mt-1.5 text-[11px] not-italic font-mono text-emerald-400 flex items-center justify-between">
                      <span>Source: {t.quotations[0]?.review_id}</span>
                      <span className="text-white/40">{t.quotations[0]?.review_date}</span>
                    </div>
                  </div>

                  <div className="text-xs text-emerald-400/90 font-medium pt-1">
                    Proposed Fix: {t.recommended_action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: WEEKLY PRODUCT PULSE                              */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Weekly Product Pulse</h3>
                <p className="text-xs text-white/50">Executive-ready report with strict length constraint of ≤ 250 words.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 ${
                  wordCount <= 250
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {wordCount <= 250 ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{wordCount} / 250 words</span>
                </span>

                <button
                  onClick={() => setCurrentStep(5)}
                  className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#090a0f] font-semibold rounded-lg transition"
                >
                  <span>Proceed to Approval</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="border border-white/[0.08] bg-[#0c0e15] p-6 rounded-2xl space-y-6 text-xs sm:text-sm">
              <div>
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">A. Executive Summary</div>
                <p className="text-white/80 leading-relaxed">{pulse?.sections.executive_summary}</p>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">B. Top Three Friction Themes</div>
                <div className="text-white/80 leading-relaxed whitespace-pre-line space-y-1">{pulse?.sections.top_three_friction_themes}</div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">C. Actionable Recommendations</div>
                <div className="text-white/80 leading-relaxed whitespace-pre-line space-y-1">{pulse?.sections.actionable_recommendations}</div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">D. Source-Linked Explainer</div>
                <p className="text-white/60 leading-relaxed pt-2 border-t border-white/[0.06]">{pulse?.sections.source_linked_explainer}</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: HUMAN-IN-THE-LOOP APPROVAL & MCP DISPATCH         */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Human-in-the-Loop Approval Gate</span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  External tools (Google Docs & Gmail Draft) are strictly locked until you inspect and approve this output.
                </p>
              </div>

              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                approvalRecord?.status === 'APPROVED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                Status: {approvalRecord?.status || 'PENDING'}
              </span>
            </div>

            {/* Email Recipient Input */}
            <div className="border border-white/[0.08] bg-[#0c0e15] p-4 rounded-2xl space-y-2">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Stakeholder Email Recipient (for staged Gmail draft):</span>
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="your.email@groww.in"
                className="w-full bg-[#11131a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
              <p className="text-[11px] text-white/40">
                The MCP tool will stage the draft addressed to this email. Auto-send is permanently disabled by protocol guardrails.
              </p>
            </div>

            {/* Inline Editor */}
            <div className="border border-white/[0.08] bg-[#0c0e15] p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Review & Edit Pulse Content:</span>
                <span className={`font-mono ${wordCount <= 250 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {wordCount} / 250 words
                </span>
              </div>

              <textarea
                rows={11}
                value={editedPulseText}
                onChange={(e) => setEditedPulseText(e.target.value)}
                className="w-full bg-[#11131a] border border-white/[0.08] rounded-xl p-3.5 text-xs font-mono text-white/80 focus:outline-none focus:border-emerald-500/50 leading-relaxed"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-white/40 font-mono">
                  Signer: <strong>PM-Groww-Lead</strong>
                  {approvalRecord?.signature_hash && (
                    <span className="text-emerald-400 ml-2 font-bold">[{approvalRecord.signature_hash}]</span>
                  )}
                </div>

                <button
                  onClick={handleApproveAndDispatch}
                  disabled={dispatching || wordCount > 250}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#090a0f] font-semibold text-xs rounded-xl transition shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                >
                  {dispatching ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching via MCP...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Dispatch Downstream</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Card (Appears after clicking Approve) */}
            {dispatchResult && (
              <div className="border border-emerald-500/30 bg-emerald-500/[0.03] p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-semibold text-white">Dispatched via Model Context Protocol (MCP)</span>
                  </div>
                  <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                    SUCCESS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Google Doc Card */}
                  <div className="p-4 rounded-xl bg-[#0c0e15] border border-white/[0.08] space-y-2">
                    <span className="text-white/60 font-medium block">Google Docs Documentation:</span>
                    <a
                      href={dispatchResult.google_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline font-semibold"
                    >
                      <span>Open Approved Google Doc</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Gmail Draft Card */}
                  <div className="p-4 rounded-xl bg-[#0c0e15] border border-white/[0.08] space-y-2">
                    <span className="text-white/60 font-medium block">Gmail Stakeholder Draft:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{dispatchResult.gmail_draft_id}</span>
                    <div className="text-[11px] text-white/40">Staged to: {recipientEmail} (Zero auto-send)</div>
                  </div>
                </div>

                {/* Audit Trail */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-white/50 mb-1.5">Execution Audit Trail:</div>
                  <div className="bg-[#090a0f] p-3 rounded-xl border border-white/[0.04] font-mono text-[11px] text-emerald-400 space-y-1">
                    {dispatchResult.audit_trail.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configuration Modal */}
        {showConfig && (
          <div className="border border-white/[0.08] bg-[#0c0e15] p-5 rounded-2xl space-y-3 text-xs">
            <h4 className="font-semibold text-white">Execution Mode Settings</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExecutionMode('LOCAL_ENGINE')}
                className={`p-3 rounded-xl border text-left transition ${
                  executionMode === 'LOCAL_ENGINE'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                    : 'border-white/[0.08] text-white/50'
                }`}
              >
                <div className="font-semibold text-white">Local Engine</div>
                <div className="text-[11px] text-white/40 mt-0.5">Runs on device with zero external dependencies.</div>
              </button>

              <button
                onClick={() => setExecutionMode('N8N_CLOUD_WEBHOOK')}
                className={`p-3 rounded-xl border text-left transition ${
                  executionMode === 'N8N_CLOUD_WEBHOOK'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                    : 'border-white/[0.08] text-white/50'
                }`}
              >
                <div className="font-semibold text-white">n8n Cloud Webhook</div>
                <div className="text-[11px] text-white/40 mt-0.5">Dispatches to live n8n workflow URLs.</div>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
