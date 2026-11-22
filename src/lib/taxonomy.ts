import { CategoryDefinition, CategoryId, ClassifiedReview, RawReview } from '../types';

export const FIVE_CATEGORIES: Record<CategoryId, CategoryDefinition> = {
  fees_and_charges: {
    id: 'fees_and_charges',
    name: 'Fees, Charges & Statutory Deductions',
    description: 'Misconceptions or complaints regarding exit loads, brokerage, STT, stamp duty, or deductions during withdrawal.',
    keywords: [
      'exit load', 'brokerage', 'deducted', 'deduction', 'hidden charges',
      'commission', 'fraud', 'cut', 'fee', 'stole', 'charges', 'cheated',
      'statutory', 'amc fee', 'zero commission', 'tax'
    ],
    exampleFriction: 'Users claiming Groww secretly cut 1% fee on mutual fund redemption when it is AMC statutory exit load.',
    ruleForAmbiguity: 'If a review mentions both support unresponsiveness and fee deductions, prioritize fees_and_charges if financial loss is the primary trigger.'
  },
  orders_and_redemptions: {
    id: 'orders_and_redemptions',
    name: 'Orders, Transactions & Redemptions',
    description: 'Delays in mutual fund NAV allocation, SIP processing failures, double debit on order, or delayed redemption payouts.',
    keywords: [
      'sip', 'nav', 'allotment', 'cut-off', 'redemption', 'withdrew',
      'payout', 'settlement', 'debit', 'double payment', 'lumpsum', 'installment',
      'cancelled', 'order failed'
    ],
    exampleFriction: 'SIP debited from bank but unit allotment pending for 3 days, causing user to miss NAV cut-off.',
    ruleForAmbiguity: 'If the primary issue is transaction failure or timing rather than account verification, classify under orders_and_redemptions.'
  },
  kyc_and_banking: {
    id: 'kyc_and_banking',
    name: 'Account Onboarding, KYC & Banking',
    description: 'Friction in bank account addition, penny drop verification, CAMS verification, Aadhaar OTP, or re-KYC lockouts.',
    keywords: [
      'kyc', 're-kyc', 'aadhaar', 'pan card', 'bank account', 'penny drop',
      'cams', 'mandate', 'autopay', 'nominee', 'verification', 'bank verification',
      'onboarding', 'signature'
    ],
    exampleFriction: 'Aadhaar OTP verification timing out or penny drop verification stuck for days.',
    ruleForAmbiguity: 'If mandate failure prevents an order, classify under kyc_and_banking if mandate authorization was the root block.'
  },
  app_performance_ui: {
    id: 'app_performance_ui',
    name: 'App Usability, UI & Performance',
    description: 'App freezes at market open, candlestick chart latency, biometric login failures, watchlist issues, or navigation glitches.',
    keywords: [
      'crash', 'freeze', 'slow', 'lag', '9:15', 'chart', 'biometric',
      'fingerprint', 'pin', 'watchlist', 'ui', 'sync', 'zero balance',
      'android 14', 'logout', 'forced logout'
    ],
    exampleFriction: 'App crashing at 9:15 AM market open, preventing stop-loss or intraday order execution.',
    ruleForAmbiguity: 'If an app crash causes an order to be missed, classify under app_performance_ui if client instability was the root cause.'
  },
  support_and_disputes: {
    id: 'support_and_disputes',
    name: 'Customer Support & Dispute Escalations',
    description: 'Inability to reach a human agent, looping chatbots, premature ticket closure, or unhelpful generic answers.',
    keywords: [
      'customer care', 'customer support', 'support', 'ticket', 'helpdesk',
      'bot', 'chatbot', 'human agent', 'no response', 'closed ticket',
      'phone number', 'executive', 'unhelpful'
    ],
    exampleFriction: 'Chatbot looping endlessly and closing dispute tickets without resolution.',
    ruleForAmbiguity: 'Classify here when the primary complaint is dissatisfaction with support service itself.'
  }
};

export function classifyReview(review: RawReview): ClassifiedReview {
  const textLower = review.review_text.toLowerCase();
  
  // Calculate keyword matches per category
  const scores: Record<CategoryId, number> = {
    fees_and_charges: 0,
    orders_and_redemptions: 0,
    kyc_and_banking: 0,
    app_performance_ui: 0,
    support_and_disputes: 0
  };

  const matchedKeywords: Record<CategoryId, string[]> = {
    fees_and_charges: [],
    orders_and_redemptions: [],
    kyc_and_banking: [],
    app_performance_ui: [],
    support_and_disputes: []
  };

  for (const [catId, def] of Object.entries(FIVE_CATEGORIES) as [CategoryId, CategoryDefinition][]) {
    for (const kw of def.keywords) {
      if (textLower.includes(kw)) {
        // Boost critical domain terms
        let weight = 1;
        if (['exit load', '1% cut', 'hidden charges', 'zero commission'].includes(kw)) weight = 2.5;
        if (['crashed', 'crash', 'freeze', '9:15'].includes(kw)) weight = 2;
        if (['re-kyc', 'penny drop', 'aadhaar'].includes(kw)) weight = 2;
        if (['chatbot', 'ticket #', 'helpdesk'].includes(kw)) weight = 2;
        
        scores[catId] += weight;
        matchedKeywords[catId].push(kw);
      }
    }
  }

  // Determine top category
  let topCategory: CategoryId = 'fees_and_charges';
  let maxScore = -1;

  for (const [catId, score] of Object.entries(scores) as [CategoryId, number][]) {
    if (score > maxScore) {
      maxScore = score;
      topCategory = catId;
    }
  }

  // Fallback heuristic if no keywords hit
  if (maxScore <= 0) {
    if (review.rating <= 2) {
      topCategory = 'support_and_disputes';
      maxScore = 0.5;
    } else {
      topCategory = 'app_performance_ui';
      maxScore = 0.5;
    }
  }

  // Confidence calculation
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidenceScore = totalScore > 0 ? Math.min(1.0, Number((maxScore / (totalScore + 0.1)).toFixed(2))) : 0.5;

  // Extract evidence span
  const primaryKw = matchedKeywords[topCategory][0] || 'feedback';
  const kwIndex = textLower.indexOf(primaryKw);
  let evidenceSpan = review.review_text;
  if (kwIndex !== -1) {
    const start = Math.max(0, kwIndex - 25);
    const end = Math.min(review.review_text.length, kwIndex + primaryKw.length + 45);
    evidenceSpan = (start > 0 ? '...' : '') + review.review_text.substring(start, end).trim() + (end < review.review_text.length ? '...' : '');
  }

  const categoryDef = FIVE_CATEGORIES[topCategory];

  return {
    ...review,
    category_id: topCategory,
    category_name: categoryDef.name,
    identified_issue: `Friction regarding ${categoryDef.name.toLowerCase()}`,
    explanation: `Classified based on signals: [${matchedKeywords[topCategory].slice(0, 3).join(', ')}] matching category taxonomy.`,
    evidence_span: evidenceSpan,
    confidence_score: confidenceScore,
    processing_status: confidenceScore >= 0.65 ? 'CONFIRMED' : 'FLAGGED_FOR_HUMAN_REVIEW'
  };
}

export function classifyAllReviews(reviews: RawReview[]): ClassifiedReview[] {
  return reviews.map(classifyReview);
}
