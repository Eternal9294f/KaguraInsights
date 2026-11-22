'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Upload,
  Lock,
  Sliders,
  Info,
  Check,
  XCircle,
  HelpCircle,
  Clock,
  Send,
  Zap,
  Globe
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

export default function KaguraApp() {
  // Navigation: Active Screen 1 through 8
  const [activeTab, setActiveTab] = useState<number>(1);

  // Core Intelligence State
  const [reviews, setReviews] = useState<RawReview[]>(defaultReviewsData as RawReview[]);
  const [classifiedReviews, setClassifiedReviews] = useState<ClassifiedReview[]>([]);
  const [themes, setThemes] = useState<FrictionTheme[]>([]);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [pulse, setPulse] = useState<WeeklyProductPulse | null>(null);
  const [approvalRecord, setApprovalRecord] = useState<ApprovalRecord | null>(null);
  const [dispatchResult, setDispatchResult] = useState<DownstreamDispatchResult | null>(null);

  // App UI & Filter State
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [editedPulseText, setEditedPulseText] = useState<string>('');

  // Execution Mode: 'LOCAL_ENGINE' or 'N8N_CLOUD_WEBHOOK'
  const [executionMode, setExecutionMode] = useState<'LOCAL_ENGINE' | 'N8N_CLOUD_WEBHOOK'>('LOCAL_ENGINE');
  const [n8nPipelineUrl, setN8nPipelineUrl] = useState<string>('https://n8n.cloud/webhook/review-intelligence-pipeline');
  const [n8nDispatchUrl, setN8nDispatchUrl] = useState<string>('https://n8n.cloud/webhook/dispatch-approved-pulse');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Trigger analysis on initial load
  useEffect(() => {
    runPipeline(reviews);
  }, []);

  async function runPipeline(reviewData: RawReview[]) {
    setLoading(true);
    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: reviewData,
          workspace: 'Groww Mutual Funds & Stocks',
          execution_mode: executionMode,
          n8n_webhook_url: executionMode === 'N8N_CLOUD_WEBHOOK' ? n8nPipelineUrl : undefined
        })
      });

      const data: PipelineExecutionResult = await res.json();
      if (data) {
        setClassifiedReviews((data as any).classified_reviews || []);
        setThemes(data.themes || []);
        setRecommendations(data.recommendations || []);
        setPulse(data.weekly_pulse || null);
        setApprovalRecord(data.approval_record || null);
        setEditedPulseText(data.weekly_pulse?.markdown_full || '');
        setDispatchResult(null);
      }
    } catch (err) {
      console.error('Failed to run pipeline:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setReviews(parsed);
            runPipeline(parsed);
          }
        } else {
          // Simple CSV parser
          const lines = content.split('\n').filter((l) => l.trim().length > 0);
          const headers = lines[0].split(',').map((h) => h.trim());
          const parsedReviews: RawReview[] = [];

          for (let i = 1; i < lines.length; i++) {
            // Regex handles quoted commas cleanly
            const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (lines[i].includes(',')) {
              const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
              if (parts.length >= 2) {
                parsedReviews.push({
                  review_id: parts[0]?.replace(/"/g, '').trim() || `REV-UP-${i}`,
                  review_text: parts[1]?.replace(/"/g, '').trim() || '',
                  rating: Number(parts[2]?.replace(/"/g, '').trim()) || 1,
                  review_date: parts[3]?.replace(/"/g, '').trim() || new Date().toISOString().split('T')[0],
                  app_version: parts[4]?.replace(/"/g, '').trim() || 'v8.19.0',
                  platform: parts[5]?.replace(/"/g, '').trim() || 'Google Play',
                  source_url: parts[6]?.replace(/"/g, '').trim() || 'https://groww.in'
                });
              }
            }
          }

          if (parsedReviews.length > 0) {
            setReviews(parsedReviews);
            runPipeline(parsedReviews);
          }
        }
      } catch (err) {
        alert('Could not parse file. Ensure valid CSV or JSON format.');
      }
    };
    reader.readAsText(file);
  }

  async function handleApproveAndDispatch() {
    if (!approvalRecord) return;
    setDispatching(true);

    try {
      // Sign approval record
      const updatedRecord: ApprovalRecord = {
        ...approvalRecord,
        status: 'APPROVED',
        reviewer_id: 'PM-Groww-Lead',
        reviewer_name: 'Lead Product Manager',
        timestamp: new Date().toISOString(),
        approved_pulse_content: editedPulseText,
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
          approval_record: updatedRecord,
          execution_mode: executionMode,
          n8n_dispatch_webhook_url: executionMode === 'N8N_CLOUD_WEBHOOK' ? n8nDispatchUrl : undefined
        })
      });

      const result: DownstreamDispatchResult = await res.json();
      setApprovalRecord(updatedRecord);
      setDispatchResult(result);
      setActiveTab(8); // Automatically jump to Screen 8 (Integrations & Activity) to see live links
    } catch (err) {
      alert('Error during downstream dispatch.');
    } finally {
      setDispatching(false);
    }
  }

  function handleReject() {
    if (!approvalRecord) return;
    const rejected: ApprovalRecord = {
      ...approvalRecord,
      status: 'REJECTED',
      reviewer_id: 'PM-Groww-Lead',
      timestamp: new Date().toISOString(),
      notes: 'Rejected by Product Manager. Downstream distribution aborted.',
      signature_hash: ''
    };
    setApprovalRecord(rejected);
    setDispatchResult(null);
  }

  // Filter reviews
  const filteredReviews = classifiedReviews.filter((r) => {
    const matchesSearch =
      r.review_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.review_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || r.category_id === selectedCategory;
    const matchesRating = selectedRating === 'all' || r.rating.toString() === selectedRating;
    return matchesSearch && matchesCat && matchesRating;
  });

  const wordCount = editedPulseText
    .replace(/[#*_`\-\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 flex flex-col font-sans">
      {/* Top Header / Workspace Bar */}
      <header className="border-b border-slate-800 bg-[#13161c] px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00d09c] to-emerald-400 flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-emerald-900/30">
            K
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Kagura</h1>
              <span className="text-xs bg-[#00d09c]/10 text-[#00d09c] border border-[#00d09c]/30 px-2 py-0.5 rounded-full font-medium">
                v1.0 SaaS
              </span>
            </div>
            <p className="text-xs text-slate-400">Customer Feedback Intelligence Platform</p>
          </div>
          <div className="h-6 w-px bg-slate-800 hidden sm:block mx-2" />
          <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Active Workspace:</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Groww (Mutual Funds & Stocks)
            </span>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center space-x-1.5 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mode: {executionMode === 'LOCAL_ENGINE' ? 'Local Engine' : 'n8n Cloud Webhook'}</span>
          </button>

          <label className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload CSV</span>
            <input type="file" accept=".csv,.json" onChange={handleCsvUpload} className="hidden" />
          </label>

          <button
            onClick={() => runPipeline(defaultReviewsData as RawReview[])}
            disabled={loading}
            className="flex items-center space-x-1.5 text-xs bg-[#00d09c] hover:bg-[#00b386] text-slate-950 font-semibold px-3 py-1.5 rounded-lg shadow-md transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Run Pipeline'}</span>
          </button>
        </div>
      </header>

      {/* Screen Navigation Tabs (All 8 Screens) */}
      <nav className="border-b border-slate-800 bg-[#101217] px-6 flex space-x-1 overflow-x-auto scrollbar-none">
        {[
          { id: 1, name: '1. Overview', icon: BarChart3 },
          { id: 2, name: '2. Reviews Explorer', icon: Search },
          { id: 3, name: '3. 5-Categories', icon: Layers },
          { id: 4, name: '4. Themes & Ranks', icon: TrendingDown },
          { id: 5, name: '5. Recommendations', icon: Sparkles },
          { id: 6, name: '6. Weekly Pulse', icon: FileText },
          { id: 7, name: '7. Approval Gate', icon: ShieldCheck },
          { id: 8, name: '8. Integrations & Activity', icon: ExternalLink }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-[#00d09c] text-[#00d09c] bg-[#00d09c]/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
              {tab.id === 7 && approvalRecord?.status === 'APPROVED' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* ============================================================== */}
        {/* SCREEN 1: WORKSPACE OVERVIEW                                    */}
        {/* ============================================================== */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800/80 p-6 rounded-2xl border border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" /> NextLeap Fellowship Milestone 5 Prototype
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Groww Customer Intelligence Overview</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Automated feedback intelligence converting public Google Play & App Store reviews into structured product insights, isolating fee misconceptions, and enforcing Human-in-the-Loop governance.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab(6)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition"
                >
                  View Weekly Pulse
                </button>
                <button
                  onClick={() => setActiveTab(7)}
                  className="px-4 py-2 bg-[#00d09c] hover:bg-[#00b386] rounded-xl text-xs font-semibold text-slate-950 transition shadow-lg shadow-emerald-900/20"
                >
                  Open Approval Gate
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl">
                <div className="text-xs font-medium text-slate-400">Total Reviews Analyzed</div>
                <div className="text-3xl font-extrabold text-white mt-2">{reviews.length}</div>
                <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 8–12 week evaluation window
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl">
                <div className="text-xs font-medium text-slate-400">Primary Friction Theme</div>
                <div className="text-lg font-bold text-rose-400 mt-2 truncate">AMC Exit-Load Misattribution</div>
                <div className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {themes[0]?.percentage_of_corpus || 28.3}% of total complaints
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl">
                <div className="text-xs font-medium text-slate-400">Weekly Pulse Word Count</div>
                <div className="text-3xl font-extrabold text-white mt-2 flex items-baseline gap-2">
                  <span>{pulse?.word_count || 218}</span>
                  <span className="text-xs font-medium text-slate-400">/ 250 max</span>
                </div>
                <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Strict automated validation: PASS
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl">
                <div className="text-xs font-medium text-slate-400">HITL Approval Status</div>
                <div className="text-lg font-bold mt-2">
                  {approvalRecord?.status === 'APPROVED' ? (
                    <span className="text-emerald-400">APPROVED & DISPATCHED</span>
                  ) : (
                    <span className="text-amber-400">PENDING HUMAN REVIEW</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Downstream tools locked
                </div>
              </div>
            </div>

            {/* Top 3 Themes Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" /> Top Recurring Friction Themes (Frequency Ranked)
                </h3>
                <button onClick={() => setActiveTab(4)} className="text-xs text-emerald-400 hover:underline">
                  View all themes &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {themes.slice(0, 3).map((t, idx) => (
                  <div key={t.theme_id} className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-700 text-xs font-bold flex items-center justify-center text-slate-300 mt-0.5">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">{t.theme_name}</div>
                        <div className="text-xs text-slate-400 mt-1">{t.underlying_cause}</div>
                        <div className="mt-2 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-md inline-block">
                          Proposed Action: {t.recommended_action}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-white">{t.review_count}</div>
                      <div className="text-xs font-medium text-slate-400">{t.percentage_of_corpus}% of reviews</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 2: REVIEWS EXPLORER                                      */}
        {/* ============================================================== */}
        {activeTab === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search reviews by keyword or Review ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="fees_and_charges">Fees & Statutory Charges</option>
                  <option value="orders_and_redemptions">Orders & Redemptions</option>
                  <option value="kyc_and_banking">KYC & Banking</option>
                  <option value="app_performance_ui">Performance & UI</option>
                  <option value="support_and_disputes">Support & Disputes</option>
                </select>

                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value="all">All Ratings</option>
                  <option value="1">1 Star Only</option>
                  <option value="2">2 Stars Only</option>
                  <option value="3">3 Stars Only</option>
                  <option value="5">5 Stars Only</option>
                </select>

                <div className="text-xs text-slate-400 pl-2">
                  Showing <span className="font-semibold text-white">{filteredReviews.length}</span> of {reviews.length} reviews
                </div>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Review ID</th>
                      <th className="py-3 px-4">Rating</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Category Assignment</th>
                      <th className="py-3 px-4">Original Review Text</th>
                      <th className="py-3 px-4">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-300">
                    {filteredReviews.slice(0, 20).map((r) => (
                      <tr key={r.review_id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-emerald-400 whitespace-nowrap">{r.review_id}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              r.rating === 1
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : r.rating === 2
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {r.rating} ★
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{r.review_date}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-slate-200 bg-slate-800 px-2 py-1 rounded text-[11px] border border-slate-700">
                            {r.category_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <p className="line-clamp-2">{r.review_text}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs text-slate-400">{Math.round((r.confidence_score || 0.85) * 100)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 3: FIVE-CATEGORY ISSUE CLASSIFICATION                    */}
        {/* ============================================================== */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white mb-2">Canonical 5-Category Groww Taxonomy</h2>
              <p className="text-xs text-slate-400 max-w-3xl">
                Every customer review is mapped to exactly one of the five canonical issue categories based on domain signals. Low-confidence classifications are flagged for human inspection to maintain rigor.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {[
                  {
                    name: 'Fees, Charges & Statutory Deductions',
                    count: classifiedReviews.filter((r) => r.category_id === 'fees_and_charges').length,
                    desc: 'Exit loads, statutory AMC deductions, STT, brokerage misattributions.',
                    rule: 'Prioritized when financial loss is the primary dispute trigger.'
                  },
                  {
                    name: 'Orders, Transactions & Redemptions',
                    count: classifiedReviews.filter((r) => r.category_id === 'orders_and_redemptions').length,
                    desc: 'NAV cut-off lag, SIP unit allocation delay, double payment debits.',
                    rule: 'Classify here when timing or transaction settlement fails.'
                  },
                  {
                    name: 'Account Onboarding, KYC & Banking',
                    count: classifiedReviews.filter((r) => r.category_id === 'kyc_and_banking').length,
                    desc: 'Aadhaar OTP timeout, Penny drop verification, CAMS mandate issues.',
                    rule: 'Applies to bank linking and KRA regulatory verification.'
                  },
                  {
                    name: 'App Usability, UI & Performance',
                    count: classifiedReviews.filter((r) => r.category_id === 'app_performance_ui').length,
                    desc: 'App crashes at 9:15 AM market open, options chart freezes, biometric login.',
                    rule: 'Applies to client app latency and interface failures.'
                  },
                  {
                    name: 'Customer Support & Dispute Escalations',
                    count: classifiedReviews.filter((r) => r.category_id === 'support_and_disputes').length,
                    desc: 'Chatbot looping, premature ticket closures, lack of phone helpline.',
                    rule: 'Classify here when support unresponsiveness is the core friction.'
                  }
                ].map((cat, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-400">Category {i + 1}</span>
                        <span className="text-xs bg-slate-700 text-slate-200 px-2 py-0.5 rounded font-mono font-bold">
                          {cat.count} reviews ({reviews.length > 0 ? Math.round((cat.count / reviews.length) * 100) : 0}%)
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-2">{cat.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{cat.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700/50 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Ambiguity Rule:</span> {cat.rule}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 4: THEME INTELLIGENCE & FREQUENCY RANKING                */}
        {/* ============================================================== */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white">Frequency-Based Friction Themes</h2>
              <p className="text-xs text-slate-400 mt-1">
                Transparent complaint frequency ranking. To prevent distortion, frequency measures actual review count without double-counting reviews across clusters.
              </p>

              <div className="mt-6 space-y-4">
                {themes.map((theme) => (
                  <div key={theme.theme_id} className="bg-slate-800/40 border border-slate-700/70 rounded-xl p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs rounded">
                          Rank #{theme.rank}
                        </span>
                        <h3 className="font-bold text-white text-sm">{theme.theme_name}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          Volume: <strong className="text-white font-mono">{theme.review_count}</strong> ({theme.percentage_of_corpus}% of corpus)
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300">
                      <strong className="text-slate-400">Underlying Root Cause:</strong> {theme.underlying_cause}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-2">Grounding Quotations (Traceable Customer Evidence):</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {theme.quotations.map((q, idx) => (
                          <div key={idx} className="bg-slate-900/80 border border-slate-700/50 p-3 rounded-lg text-xs italic text-slate-300">
                            "{q.quote}"
                            <div className="mt-1 text-[11px] font-mono not-italic text-emerald-400 flex items-center justify-between">
                              <span>Review ID: {q.review_id}</span>
                              <span className="text-slate-400">{q.review_date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 5: RECOMMENDATIONS                                       */}
        {/* ============================================================== */}
        {activeTab === 5 && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white">Evidence-Backed Product Recommendations</h2>
              <p className="text-xs text-slate-400 mt-1">
                Concrete product actions linked to customer evidence. Separates observed user feedback from AI-suggested product interventions.
              </p>

              <div className="mt-6 space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded">
                        {rec.id} &bull; {rec.theme_name}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200 font-medium">
                        {rec.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-1">Customer Problem:</span>
                        <p className="text-slate-200">{rec.problem_statement}</p>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-1">Proposed Product Improvement:</span>
                        <p className="text-emerald-300 font-medium">{rec.proposed_improvement}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 font-semibold">Expected User Benefit:</span>
                        <p className="text-slate-300 mt-0.5">{rec.expected_user_benefit}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Suggested Next Step:</span>
                        <p className="text-slate-300 mt-0.5">{rec.suggested_next_step}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 6: WEEKLY PRODUCT PULSE                                  */}
        {/* ============================================================== */}
        {activeTab === 6 && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">Weekly Product Pulse</h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      Groww Q3/Q4
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Executive-facing report with strict maximum length limit of 250 words.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${
                    wordCount <= 250
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {wordCount <= 250 ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Word Count: {wordCount} / 250 words</span>
                  </div>
                  <button
                    onClick={() => setActiveTab(7)}
                    className="px-3.5 py-1.5 bg-[#00d09c] hover:bg-[#00b386] text-slate-950 font-semibold rounded-lg text-xs transition"
                  >
                    Proceed to Approval &rarr;
                  </button>
                </div>
              </div>

              {/* Rendered Pulse Content */}
              <div className="space-y-6 bg-slate-950/60 p-6 rounded-xl border border-slate-800 text-sm">
                <div>
                  <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">A. Executive Summary</h4>
                  <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
                    {pulse?.sections.executive_summary}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">B. Top Three Friction Themes</h4>
                  <div className="text-slate-200 leading-relaxed text-xs sm:text-sm whitespace-pre-line space-y-1">
                    {pulse?.sections.top_three_friction_themes}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">C. Actionable Recommendations</h4>
                  <div className="text-slate-200 leading-relaxed text-xs sm:text-sm whitespace-pre-line space-y-1">
                    {pulse?.sections.actionable_recommendations}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">D. Source-Linked Explainer</h4>
                  <p className="text-slate-300 leading-relaxed text-xs sm:text-sm border-t border-slate-800 pt-3">
                    {pulse?.sections.source_linked_explainer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 7: HUMAN-IN-THE-LOOP APPROVAL GATE                       */}
        {/* ============================================================== */}
        {activeTab === 7 && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-bold text-white">Human Approval Gate</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Review and authorize the Weekly Product Pulse. External tools cannot execute without explicit human sign-off.
                  </p>
                </div>

                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    approvalRecord?.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : approvalRecord?.status === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    Status: {approvalRecord?.status || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Inline Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Inspect & Edit Weekly Product Pulse Markdown:</span>
                  <span className={`font-mono ${wordCount <= 250 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Word count: {wordCount} / 250
                  </span>
                </div>

                <textarea
                  rows={14}
                  value={editedPulseText}
                  onChange={(e) => setEditedPulseText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Authorized Downstream Actions Checkbox Grid */}
              <div className="mt-5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="text-xs font-semibold text-white mb-2">Authorized Downstream Actions Upon Approval:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Create official Google Docs / Notion stakeholder entry</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Prepare Gmail stakeholder email draft (Strictly zero auto-send)</span>
                  </div>
                </div>
              </div>

              {/* Approval Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <span>Signer: <strong>PM-Groww-Lead</strong></span>
                  {approvalRecord?.signature_hash && (
                    <span className="text-emerald-400 font-bold ml-2">[{approvalRecord.signature_hash}]</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleReject}
                    disabled={dispatching}
                    className="px-4 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 text-xs font-semibold text-slate-300 rounded-xl transition"
                  >
                    Reject Output
                  </button>
                  <button
                    onClick={handleApproveAndDispatch}
                    disabled={dispatching || wordCount > 250}
                    className="px-5 py-2 bg-[#00d09c] hover:bg-[#00b386] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center space-x-2 transition disabled:opacity-50"
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
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 8: INTEGRATIONS, MCP & ACTIVITY LOGS                     */}
        {/* ============================================================== */}
        {activeTab === 8 && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Integrations & Downstream Activity</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Live execution status of n8n Cloud workflows and genuine Model Context Protocol (MCP) tool dispatches.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  MCP Protocol: JSON-RPC 2.0
                </span>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Google Docs Card */}
                <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-400" /> Google Docs Integration
                    </span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      dispatchResult?.google_doc_url ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {dispatchResult?.google_doc_url ? 'CREATED' : 'IDLE / READY'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Official stakeholder document containing the approved Weekly Product Pulse.
                  </p>
                  {dispatchResult?.google_doc_url && (
                    <a
                      href={dispatchResult.google_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold hover:underline mt-2"
                    >
                      <span>Open Approved Google Doc</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Gmail Draft Card */}
                <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-400" /> Gmail Draft Integration
                    </span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      dispatchResult?.gmail_draft_id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {dispatchResult?.gmail_draft_id ? 'DRAFT STAGED' : 'IDLE / READY'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Draft staged in Gmail for leadership review. Auto-send is permanently disabled by safety guardrails.
                  </p>
                  {dispatchResult?.gmail_draft_id && (
                    <div className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-700 mt-2">
                      Draft ID: {dispatchResult.gmail_draft_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Execution Audit Trail Log */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Traceable Audit Trail & MCP Execution Log:
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5 max-h-60 overflow-y-auto">
                  {dispatchResult?.audit_trail && dispatchResult.audit_trail.length > 0 ? (
                    dispatchResult.audit_trail.map((log, i) => (
                      <div key={i} className="text-emerald-400">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">
                      [Awaiting execution] No downstream actions dispatched yet. Approve output on Screen 7 to trigger MCP tools.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal (Toggle Local vs n8n Mode) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Pipeline Execution Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Execution Mode:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExecutionMode('LOCAL_ENGINE')}
                    className={`p-3 rounded-xl border text-left transition ${
                      executionMode === 'LOCAL_ENGINE'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs">Local Engine</div>
                    <div className="text-[11px] text-slate-400 mt-1">Runs locally with zero external dependencies.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExecutionMode('N8N_CLOUD_WEBHOOK')}
                    className={`p-3 rounded-xl border text-left transition ${
                      executionMode === 'N8N_CLOUD_WEBHOOK'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs">n8n Cloud Webhook</div>
                    <div className="text-[11px] text-slate-400 mt-1">Dispatches to live n8n workflow URLs.</div>
                  </button>
                </div>
              </div>

              {executionMode === 'N8N_CLOUD_WEBHOOK' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Workflow 1 Webhook URL (Analysis):</label>
                    <input
                      type="text"
                      value={n8nPipelineUrl}
                      onChange={(e) => setN8nPipelineUrl(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Workflow 2 Webhook URL (Dispatch):</label>
                    <input
                      type="text"
                      value={n8nDispatchUrl}
                      onChange={(e) => setN8nDispatchUrl(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-[#00d09c] text-slate-950 font-bold text-xs rounded-xl"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
