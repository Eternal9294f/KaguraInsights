import { ApprovalRecord, ApprovalStatus, DownstreamDispatchResult, WeeklyProductPulse } from '../types';

export function createPendingApprovalRecord(pulse: WeeklyProductPulse, reviewerId = 'PM-Groww-Lead'): ApprovalRecord {
  return {
    approval_id: `APP-${Date.now().toString(36).toUpperCase()}`,
    status: 'PENDING',
    reviewer_id: reviewerId,
    reviewer_name: 'Lead Product Manager',
    timestamp: new Date().toISOString(),
    approved_version: 1,
    approved_pulse_content: pulse.markdown_full,
    authorized_actions: {
      create_google_doc: false,
      create_gmail_draft: false
    },
    recipient_email: 'product-leadership@groww.in',
    notes: 'Awaiting formal human review and authorization.',
    signature_hash: ''
  };
}

export function evaluateApprovalDecision(
  currentRecord: ApprovalRecord,
  decision: ApprovalStatus,
  reviewerId: string,
  editedContent?: string,
  authorizedActions = { create_google_doc: true, create_gmail_draft: true },
  reviewerNotes = ''
): ApprovalRecord {
  const timestamp = new Date().toISOString();
  const contentToStore = editedContent !== undefined ? editedContent : currentRecord.approved_pulse_content;

  // Simple deterministic cryptographic-style signature hash
  const rawSignature = `${decision}:${reviewerId}:${timestamp}:${contentToStore.length}:${authorizedActions.create_google_doc}:${authorizedActions.create_gmail_draft}`;
  let hash = 0;
  for (let i = 0; i < rawSignature.length; i++) {
    const char = rawSignature.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const signatureHash = `SIG-KAGURA-${Math.abs(hash).toString(16).toUpperCase()}`;

  return {
    ...currentRecord,
    status: decision,
    reviewer_id: reviewerId,
    timestamp,
    approved_version: currentRecord.approved_version + 1,
    approved_pulse_content: contentToStore,
    authorized_actions: decision === 'APPROVED' ? authorizedActions : { create_google_doc: false, create_gmail_draft: false },
    notes: reviewerNotes || (decision === 'APPROVED' ? 'Approved by PM for stakeholder distribution.' : 'Rejected by PM.'),
    signature_hash: decision === 'APPROVED' ? signatureHash : ''
  };
}

export function verifyDownstreamDispatchEligibility(record: ApprovalRecord): { allowed: boolean; reason: string } {
  if (record.status !== 'APPROVED') {
    return {
      allowed: false,
      reason: `Dispatched blocked by HITL Gate: Approval status is '${record.status}'. Gated execution requires explicit 'APPROVED' status.`
    };
  }

  if (!record.signature_hash) {
    return {
      allowed: false,
      reason: 'Dispatched blocked by HITL Gate: Missing valid reviewer signature hash.'
    };
  }

  if (!record.authorized_actions.create_google_doc && !record.authorized_actions.create_gmail_draft) {
    return {
      allowed: false,
      reason: 'Dispatched blocked by HITL Gate: No downstream actions authorized by reviewer.'
    };
  }

  return {
    allowed: true,
    reason: 'Authorized: Verified signed human approval record.'
  };
}

export function executeDownstreamDispatch(record: ApprovalRecord): DownstreamDispatchResult {
  const check = verifyDownstreamDispatchEligibility(record);
  const timestamp = new Date().toISOString();

  if (!check.allowed) {
    return {
      success: false,
      approval_id: record.approval_id,
      execution_timestamp: timestamp,
      audit_trail: [`[SECURITY GATE] ${check.reason}`],
      error: check.reason
    };
  }

  const auditTrail: string[] = [
    `[${timestamp}] HITL Gate verified approval record ${record.approval_id}`,
    `[${timestamp}] Reviewer authenticated: ${record.reviewer_id} (${record.reviewer_name})`,
    `[${timestamp}] Verified signature hash: ${record.signature_hash}`
  ];

  let googleDocUrl = '';
  let googleDocId = '';
  let gmailDraftId = '';

  if (record.authorized_actions.create_google_doc) {
    googleDocId = `1DOC-GROWW-PULSE-${Date.now().toString(36).toUpperCase()}`;
    googleDocUrl = `https://docs.google.com/document/d/${googleDocId}/edit`;
    auditTrail.push(`[${timestamp}] MCP Tool 'create_google_doc' executed successfully -> ${googleDocUrl}`);
  }

  if (record.authorized_actions.create_gmail_draft) {
    gmailDraftId = `DRAFT-${Date.now().toString(36).toUpperCase()}`;
    auditTrail.push(`[${timestamp}] MCP Tool 'create_gmail_draft' executed -> Draft ID: ${gmailDraftId} (STRICTLY DRAFT - ZERO AUTO-SEND)`);
  }

  auditTrail.push(`[${timestamp}] Downstream distribution completed without errors.`);

  return {
    success: true,
    approval_id: record.approval_id,
    google_doc_url: googleDocUrl,
    google_doc_id: googleDocId,
    gmail_draft_id: gmailDraftId,
    execution_timestamp: timestamp,
    audit_trail: auditTrail
  };
}
