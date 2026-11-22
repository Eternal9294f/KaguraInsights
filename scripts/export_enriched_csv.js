const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '..', 'data', 'reviews.json');
const OUTPUT_CSV_PATH = path.join(__dirname, '..', 'data', 'kagura_enriched_intelligence.csv');

const rawReviews = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function classify(text) {
  const t = text.toLowerCase();
  
  // Check exit load first
  const isExitLoad = t.includes('exit load') || (t.includes('1%') && (t.includes('cut') || t.includes('deducted') || t.includes('brokerage') || t.includes('withdrew') || t.includes('redeem')));
  
  if (isExitLoad || t.includes('brokerage') || t.includes('hidden charges') || t.includes('commission') || t.includes('fraud') || t.includes('deducted')) {
    return {
      category_id: 'fees_and_charges',
      category_name: 'Fees, Charges & Statutory Deductions',
      theme_name: isExitLoad ? 'Statutory AMC Exit-Load Misattribution' : 'Hidden Brokerage & Commission Perception',
      is_exit_load: isExitLoad ? 'YES' : 'NO',
      sentiment: 'Negative',
      confidence: 0.94,
      priority: isExitLoad ? 'P0 - Immediate' : 'P1 - High'
    };
  }
  
  if (t.includes('sip') || t.includes('nav') || t.includes('allotment') || t.includes('double payment') || t.includes('lumpsum') || t.includes('cut-off')) {
    return {
      category_id: 'orders_and_redemptions',
      category_name: 'Orders, Transactions & Redemptions',
      theme_name: 'SIP Debit vs NAV Allotment Delay & Cut-off Discrepancy',
      is_exit_load: 'NO',
      sentiment: t.includes('best') || t.includes('smooth') ? 'Positive' : 'Negative',
      confidence: 0.91,
      priority: 'P1 - High'
    };
  }
  
  if (t.includes('kyc') || t.includes('re-kyc') || t.includes('aadhaar') || t.includes('pan card') || t.includes('penny drop') || t.includes('cams') || t.includes('mandate')) {
    return {
      category_id: 'kyc_and_banking',
      category_name: 'Account Onboarding, KYC & Banking',
      theme_name: 'Aadhaar Re-KYC Verification Loop & Penny Drop Timeout',
      is_exit_load: 'NO',
      sentiment: 'Negative',
      confidence: 0.89,
      priority: 'P2 - Medium'
    };
  }
  
  if (t.includes('crash') || t.includes('freeze') || t.includes('9:15') || t.includes('chart') || t.includes('biometric') || t.includes('fingerprint') || t.includes('lag') || t.includes('zero balance')) {
    return {
      category_id: 'app_performance_ui',
      category_name: 'App Usability, UI & Performance',
      theme_name: 'Market Open (9:15 AM) Concurrency Freeze & Chart Latency',
      is_exit_load: 'NO',
      sentiment: 'Negative',
      confidence: 0.92,
      priority: 'P1 - High'
    };
  }
  
  if (t.includes('customer care') || t.includes('support') || t.includes('ticket') || t.includes('bot') || t.includes('chatbot') || t.includes('closed ticket')) {
    return {
      category_id: 'support_and_disputes',
      category_name: 'Customer Support & Dispute Escalations',
      theme_name: 'Chatbot FAQ Dead-Ends & Premature Ticket Resolution',
      is_exit_load: 'NO',
      sentiment: 'Negative',
      confidence: 0.88,
      priority: 'P2 - Medium'
    };
  }

  return {
    category_id: 'app_performance_ui',
    category_name: 'App Usability, UI & Performance',
    theme_name: 'General User Experience & Interface Feedback',
    is_exit_load: 'NO',
    sentiment: text.includes('love') || text.includes('clean') ? 'Positive' : 'Neutral',
    confidence: 0.82,
    priority: 'P3 - Low'
  };
}

// Generate CSV
const headers = [
  'review_id',
  'rating',
  'review_date',
  'app_version',
  'platform',
  'category_id',
  'category_name',
  'friction_theme',
  'is_exit_load_misattribution',
  'sentiment',
  'confidence_score',
  'action_priority',
  'verbatim_quote_sample',
  'full_review_text'
];

const csvRows = [headers.join(',')];

rawReviews.forEach(r => {
  const meta = classify(r.review_text);
  const quote = `"${r.review_text.substring(0, 60).replace(/"/g, '""')}..."`;
  const fullText = `"${r.review_text.replace(/"/g, '""')}"`;
  
  const row = [
    r.review_id,
    r.rating,
    r.review_date,
    r.app_version,
    `"${r.platform}"`,
    meta.category_id,
    `"${meta.category_name}"`,
    `"${meta.theme_name}"`,
    meta.is_exit_load,
    meta.sentiment,
    meta.confidence,
    `"${meta.priority}"`,
    quote,
    fullText
  ];
  
  csvRows.push(row.join(','));
});

fs.writeFileSync(OUTPUT_CSV_PATH, csvRows.join('\n'), 'utf-8');
console.log(`Successfully exported ${rawReviews.length} enriched reviews to: ${OUTPUT_CSV_PATH}`);
