export type CategoryId =
  | 'fees_and_charges'
  | 'orders_and_redemptions'
  | 'kyc_and_banking'
  | 'app_performance_ui'
  | 'support_and_disputes';

export interface CategoryDefinition {
  id: CategoryId;
  name: string;
  description: string;
  keywords: string[];
  exampleFriction: string;
  ruleForAmbiguity: string;
}

export interface RawReview {
  review_id: string;
  review_text: string;
  rating: number;
  review_date: string;
  app_version?: string;
  platform?: string;
  source_url?: string;
}

export interface ClassifiedReview extends RawReview {
  category_id: CategoryId;
  category_name: string;
  identified_issue: string;
  explanation: string;
  evidence_span: string;
  confidence_score: number;
  processing_status: 'CONFIRMED' | 'FLAGGED_FOR_HUMAN_REVIEW';
}

export interface VerbatimQuotation {
  quote: string;
  review_id: string;
  rating: number;
  review_date: string;
  source_url?: string;
}

export interface FrictionTheme {
  theme_id: string;
  theme_name: string;
  category_id: CategoryId;
  category_name: string;
  review_count: number;
  percentage_of_corpus: number;
  quotations: VerbatimQuotation[];
  associated_review_ids: string[];
  underlying_cause: string;
  recommended_action: string;
  rank: number;
}

export interface ProductRecommendation {
  id: string;
  theme_id: string;
  theme_name: string;
  problem_statement: string;
  customer_evidence: string[];
  why_it_matters: string;
  proposed_improvement: string;
  expected_user_benefit: string;
  suggested_next_step: string;
  status: 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS';
}

export interface WeeklyProductPulse {
  report_id: string;
  workspace: string;
  generated_at: string;
  date_window: {
    start: string;
    end: string;
  };
  total_reviews_analyzed: number;
  word_count: number;
  is_valid_length: boolean; // strictly <= 250 words
  sections: {
    executive_summary: string;
    top_three_friction_themes: string;
    actionable_recommendations: string;
    source_linked_explainer: string;
  };
  markdown_full: string;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REGENERATION_REQUESTED';

export interface ApprovalRecord {
  approval_id: string;
  status: ApprovalStatus;
  reviewer_id: string;
  reviewer_name: string;
  timestamp: string;
  approved_version: number;
  approved_pulse_content: string;
  authorized_actions: {
    create_google_doc: boolean;
    create_gmail_draft: boolean;
  };
  recipient_email?: string;
  notes?: string;
  signature_hash: string;
}

export interface DownstreamDispatchResult {
  success: boolean;
  approval_id: string;
  google_doc_url?: string;
  google_doc_id?: string;
  gmail_draft_id?: string;
  execution_timestamp: string;
  audit_trail: string[];
  error?: string;
}

export interface PipelineExecutionResult {
  total_ingested: number;
  total_filtered: number;
  categories_summary: Record<CategoryId, number>;
  themes: FrictionTheme[];
  top_three_themes: FrictionTheme[];
  recommendations: ProductRecommendation[];
  weekly_pulse: WeeklyProductPulse;
  approval_record: ApprovalRecord;
  execution_mode: 'LOCAL_ENGINE' | 'N8N_CLOUD_WEBHOOK';
}
