'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  Mail,
  ShieldCheck,
  Search,
  Upload,
  RefreshCw,
  ExternalLink,
  Check,
  XCircle,
  TrendingDown,
  Layers,
  Sliders
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

export default function KaguraOutpostApp() {
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
    <div className="min-h-screen bg-gradient-to-b from-[#F2F5F8] via-[#F7F9FB] to-[#EDF2F7] text-slate-800 font-sans antialiased selection:bg-teal-100 selection:text-teal-900 pb-20">
      {/* Delicate Atmospheric Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[340px] bg-gradient-to-b from-teal-200/25 via-emerald-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Minimalist Header */}
      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-40 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-tight text-slate-700">Groww Workspace</span>
            <span className="text-[11px] text-slate-400 font-normal">&bull; Mutual Funds & Direct Stocks</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80 shadow-sm transition font-medium"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span>{executionMode === 'LOCAL_ENGINE' ? 'Local Engine' : 'n8n Cloud'}</span>
            </button>

            <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80 shadow-sm cursor-pointer transition font-medium">
              <Upload className="w-3.5 h-3.5 text-teal-600" />
              <span>Upload CSV</span>
              <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => runPipeline(defaultReviewsData as RawReview[])}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Processing...' : 'Run Pipeline'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Container */}
      <main className="max-w-3xl mx-auto px-6 pt-14 space-y-12">
        {/* ========================================================= */}
        {/* CENTERED HERO SECTION: LOGO + BIG TITLE + TWO LINES       */}
        {/* ========================================================= */}
        <div className="text-center space-y-5">
          {/* Centered Distinctive Logo Mark */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold text-2xl shadow-lg shadow-teal-500/20 ring-4 ring-white/80">
            K
          </div>

          {/* VERY BIG CENTER TITLE */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
              Kagura Insights
            </h1>
            
            {/* EXACTLY TWO LINES DESCRIBING WHAT IT IS */}
            <div className="text-slate-500 text-sm sm:text-base leading-relaxed space-y-1 max-w-xl mx-auto font-normal">
              <p>An AI-powered customer feedback intelligence platform demonstrated on <strong>Groww</strong>.</p>
              <p>Transforms public app reviews into structured friction insights and an executive Weekly Product Pulse gated by Human-in-the-Loop approval.</p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SERENE 5-STEP GUIDED STEPPER                              */}
        {/* ========================================================= */}
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex items-center justify-between text-xs">
          {[
            { id: 1, label: '1. Review Corpus' },
            { id: 2, label: '2. 5-Categories' },
            { id: 3, label: '3. Theme Friction' },
            { id: 4, label: '4. Weekly Pulse' },
            { id: 5, label: '5. Human Approval' }
          ].map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex-1 py-2 rounded-full font-medium transition text-center ${
                currentStep === step.id
                  ? 'bg-slate-900 text-white shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* STEP 1: REVIEW CORPUS & EXPLORER                          */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search reviews or Review ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/90 border border-slate-200/90 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs text-slate-500">
                <span>{filteredReviews.length} reviews loaded</span>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-medium transition shadow-sm"
                >
                  <span>Next: 5-Categories</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl overflow-hidden divide-y divide-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
              {filteredReviews.slice(0, 10).map((r) => (
                <div key={r.review_id} className="p-4 hover:bg-slate-50/60 transition space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-teal-700 font-semibold">{r.review_id}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-slate-400">{r.review_date}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-amber-500 font-semibold">{r.rating} ★</span>
                    </div>
                    <span className="text-[11px] bg-slate-100/80 text-slate-600 border border-slate-200/60 px-2.5 py-0.5 rounded-full font-medium">
                      {r.category_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.review_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: 5-CATEGORY ISSUE TAXONOMY                         */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Canonical 5-Category Taxonomy</h3>
                <p className="text-xs text-slate-400">Every review maps to one defined friction category without ambiguity.</p>
              </div>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-medium transition shadow-sm"
              >
                <span>Next: Theme Friction</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                <div key={c.id} className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-5 rounded-3xl space-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{c.name}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono font-medium">
                      {c.count} reviews
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
                  <div className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                    <span className="font-semibold text-slate-600">Ambiguity Rule:</span> {c.rule}
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Frequency-Ranked Friction Themes</h3>
                <p className="text-xs text-slate-400">Transparent complaints ranking with zero double-counting across clusters.</p>
              </div>
              <button
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-medium transition shadow-sm"
              >
                <span>Next: Weekly Pulse</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {themes.slice(0, 3).map((t, idx) => (
                <div key={t.theme_id} className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-5 rounded-3xl space-y-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{t.theme_name}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      <strong className="text-slate-800">{t.review_count}</strong> complaints ({t.percentage_of_corpus}%)
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    <span className="font-semibold text-slate-700">Root Cause:</span> {t.underlying_cause}
                  </p>

                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs italic text-slate-600">
                    "{t.quotations[0]?.quote}"
                    <div className="mt-1.5 text-[11px] not-italic font-mono text-teal-700 flex items-center justify-between">
                      <span>Source: {t.quotations[0]?.review_id}</span>
                      <span className="text-slate-400">{t.quotations[0]?.review_date}</span>
                    </div>
                  </div>

                  <div className="text-xs text-teal-800 bg-teal-50/80 border border-teal-100 px-3 py-1.5 rounded-xl font-medium">
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Weekly Product Pulse</h3>
                <p className="text-xs text-slate-400">Executive-ready report with strict length constraint of ≤ 250 words.</p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className={`text-xs px-3 py-1 rounded-full font-mono font-medium flex items-center gap-1.5 ${
                  wordCount <= 250
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {wordCount <= 250 ? <Check className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                  <span>{wordCount} / 250 words</span>
                </span>

                <button
                  onClick={() => setCurrentStep(5)}
                  className="flex items-center gap-1.5 text-xs px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full transition shadow-sm"
                >
                  <span>Proceed to Approval</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-7 rounded-3xl space-y-5 text-xs sm:text-sm shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
              <div>
                <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-1">A. Executive Summary</div>
                <p className="text-slate-600 leading-relaxed">{pulse?.sections.executive_summary}</p>
              </div>

              <div>
                <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-1">B. Top Three Friction Themes</div>
                <div className="text-slate-600 leading-relaxed whitespace-pre-line space-y-1">{pulse?.sections.top_three_friction_themes}</div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-1">C. Actionable Recommendations</div>
                <div className="text-slate-600 leading-relaxed whitespace-pre-line space-y-1">{pulse?.sections.actionable_recommendations}</div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-1">D. Source-Linked Explainer</div>
                <p className="text-slate-400 leading-relaxed pt-2.5 border-t border-slate-100">{pulse?.sections.source_linked_explainer}</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: HUMAN-IN-THE-LOOP APPROVAL & MCP DISPATCH         */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Human-in-the-Loop Approval Gate</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  External tools are locked until you inspect and approve this output.
                </p>
              </div>

              <span className={`text-xs px-3 py-0.5 rounded-full font-semibold ${
                approvalRecord?.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                Status: {approvalRecord?.status || 'PENDING'}
              </span>
            </div>

            {/* Email Recipient Input */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 rounded-3xl space-y-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span>Stakeholder Email Recipient:</span>
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="your.email@groww.in"
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Inline Editor */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-5 rounded-3xl space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Review & Edit Pulse Content:</span>
                <span className={`font-mono font-semibold ${wordCount <= 250 ? 'text-teal-700' : 'text-rose-600'}`}>
                  {wordCount} / 250 words
                </span>
              </div>

              <textarea
                rows={11}
                value={editedPulseText}
                onChange={(e) => setEditedPulseText(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-xs font-mono text-slate-700 focus:outline-none focus:border-slate-400 leading-relaxed"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-400 font-mono">
                  Signer: <strong className="text-slate-700">PM-Groww-Lead</strong>
                  {approvalRecord?.signature_hash && (
                    <span className="text-teal-700 ml-2 font-bold">[{approvalRecord.signature_hash}]</span>
                  )}
                </div>

                <button
                  onClick={handleApproveAndDispatch}
                  disabled={dispatching || wordCount > 250}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-full transition shadow-md disabled:opacity-50"
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

            {/* Results Card */}
            {dispatchResult && (
              <div className="border border-teal-200 bg-teal-50/50 p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-900">Dispatched via Model Context Protocol (MCP)</span>
                  </div>
                  <span className="text-[11px] font-mono bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold">
                    SUCCESS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-sm">
                    <span className="text-slate-400 font-medium block">Google Docs Documentation:</span>
                    <a
                      href={dispatchResult.google_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:underline font-bold"
                    >
                      <span>Open Approved Google Doc</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-sm">
                    <span className="text-slate-400 font-medium block">Gmail Stakeholder Draft:</span>
                    <span className="font-mono text-teal-800 font-bold">{dispatchResult.gmail_draft_id}</span>
                    <div className="text-[10px] text-slate-400">Staged to: {recipientEmail} (Zero auto-send)</div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">Execution Audit Trail:</div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/80 font-mono text-[10px] text-teal-800 space-y-0.5 shadow-sm">
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
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 rounded-3xl space-y-3 text-xs shadow-lg">
            <h4 className="font-bold text-slate-900">Execution Mode Settings</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExecutionMode('LOCAL_ENGINE')}
                className={`p-3 rounded-2xl border text-left transition ${
                  executionMode === 'LOCAL_ENGINE'
                    ? 'border-teal-500 bg-teal-50/50 text-slate-900 font-semibold'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                <div className="font-bold">Local Engine</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Runs on device with zero external dependencies.</div>
              </button>

              <button
                onClick={() => setExecutionMode('N8N_CLOUD_WEBHOOK')}
                className={`p-3 rounded-2xl border text-left transition ${
                  executionMode === 'N8N_CLOUD_WEBHOOK'
                    ? 'border-teal-500 bg-teal-50/50 text-slate-900 font-semibold'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                <div className="font-bold">n8n Cloud Webhook</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Dispatches to live n8n workflow URLs.</div>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
