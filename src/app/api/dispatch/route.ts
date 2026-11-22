import { NextRequest, NextResponse } from 'next/server';
import { executeDownstreamDispatch, verifyDownstreamDispatchEligibility } from '@/lib/hitl_gate';
import { KaguraMcpClient } from '@/mcp/client';
import { ApprovalRecord } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const record: ApprovalRecord = body.approval_record || body;
    const executionMode = body.execution_mode || 'LOCAL_ENGINE';
    const n8nWebhookUrl = body.n8n_dispatch_webhook_url;

    // Strict Gatekeeper Security Check
    const eligibility = verifyDownstreamDispatchEligibility(record);
    if (!eligibility.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason,
          audit_trail: [`[SECURITY GATE] ${eligibility.reason}`]
        },
        { status: 403 }
      );
    }

    // Mode A: Forward to live n8n Workflow 2 Webhook if configured
    if (executionMode === 'N8N_CLOUD_WEBHOOK' && n8nWebhookUrl) {
      try {
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
        if (n8nResponse.ok) {
          const n8nResult = await n8nResponse.json();
          return NextResponse.json(n8nResult);
        }
      } catch (webhookErr) {
        console.warn('n8n Dispatch Webhook failed, executing via Local MCP client:', webhookErr);
      }
    }

    // Mode B: Execute via genuine MCP Client
    const mcpClient = new KaguraMcpClient();
    const timestamp = new Date().toISOString();
    const auditTrail: string[] = [
      `[${timestamp}] HITL Gate verified approval record ${record.approval_id}`,
      `[${timestamp}] Authenticated reviewer: ${record.reviewer_id} (${record.reviewer_name})`,
      `[${timestamp}] Cryptographic signature verified: ${record.signature_hash}`
    ];

    let docUrl = '';
    let docId = '';
    let draftId = '';

    if (record.authorized_actions.create_google_doc) {
      const docRes = await mcpClient.createDocumentationEntry({
        approval_id: record.approval_id,
        workspace: 'Groww Mutual Funds & Stocks',
        title: `[Groww Product Pulse] Weekly Customer Feedback Intelligence`,
        content_markdown: record.approved_pulse_content
      });
      docId = docRes.document_id;
      docUrl = docRes.document_url;
      auditTrail.push(`[${timestamp}] MCP Tool: 'create_documentation_entry' -> Google Doc created: ${docUrl}`);
    }

    if (record.authorized_actions.create_gmail_draft) {
      const emailRes = await mcpClient.createStakeholderEmailDraft({
        approval_id: record.approval_id,
        subject: `[Groww Pulse] Weekly Customer Feedback Intelligence & Recommendations`,
        executive_summary: record.approved_pulse_content.substring(0, 300),
        documentation_url: docUrl || 'https://docs.google.com/document/d/default-groww-pulse/edit'
      });
      draftId = emailRes.draft_id;
      auditTrail.push(`[${timestamp}] MCP Tool: 'create_stakeholder_email_draft' -> Gmail Draft ID: ${draftId} (STRICTLY DRAFT - AUTO-SEND DISABLED)`);
    }

    auditTrail.push(`[${timestamp}] All authorized stakeholder actions dispatched successfully.`);

    return NextResponse.json({
      success: true,
      approval_id: record.approval_id,
      google_doc_url: docUrl,
      google_doc_id: docId,
      gmail_draft_id: draftId,
      execution_timestamp: timestamp,
      audit_trail: auditTrail
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Dispatch execution error' },
      { status: 500 }
    );
  }
}
