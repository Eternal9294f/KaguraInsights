import { NextRequest, NextResponse } from 'next/server';
import { RawReview } from '@/types';
import { classifyAllReviews } from '@/lib/taxonomy';
import { extractThemesAndRank, generateRecommendations } from '@/lib/theme_engine';
import { generateWeeklyProductPulse } from '@/lib/pulse_generator';
import { createPendingApprovalRecord } from '@/lib/hitl_gate';

// Fallback default Groww dataset if none provided in request body
import defaultReviews from '../../../../data/reviews.json';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const reviews: RawReview[] = Array.isArray(body.reviews) && body.reviews.length > 0 ? body.reviews : (defaultReviews as RawReview[]);
    const workspace = body.workspace || 'Groww Mutual Funds & Stocks';
    const executionMode = body.execution_mode || 'LOCAL_ENGINE';
    const n8nWebhookUrl = body.n8n_webhook_url;

    // Mode A: Delegate to live n8n Cloud Webhook if requested and URL provided
    if (executionMode === 'N8N_CLOUD_WEBHOOK' && n8nWebhookUrl) {
      try {
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace, reviews })
        });
        if (n8nResponse.ok) {
          const n8nResult = await n8nResponse.json();
          return NextResponse.json({
            ...n8nResult,
            execution_mode: 'N8N_CLOUD_WEBHOOK'
          });
        }
      } catch (webhookErr) {
        console.warn('n8n Webhook connection failed, falling back to Local Engine:', webhookErr);
      }
    }

    // Mode B: Deterministic Local Intelligence Engine
    const classified = classifyAllReviews(reviews);

    // Summary count per category
    const categoriesSummary = {
      fees_and_charges: classified.filter((r) => r.category_id === 'fees_and_charges').length,
      orders_and_redemptions: classified.filter((r) => r.category_id === 'orders_and_redemptions').length,
      kyc_and_banking: classified.filter((r) => r.category_id === 'kyc_and_banking').length,
      app_performance_ui: classified.filter((r) => r.category_id === 'app_performance_ui').length,
      support_and_disputes: classified.filter((r) => r.category_id === 'support_and_disputes').length
    };

    const themes = extractThemesAndRank(classified);
    const topThreeThemes = themes.slice(0, 3);
    const recommendations = generateRecommendations(themes);
    const weeklyPulse = generateWeeklyProductPulse(workspace, reviews.length, themes, recommendations);
    const approvalRecord = createPendingApprovalRecord(weeklyPulse);

    return NextResponse.json({
      success: true,
      workspace,
      total_ingested: reviews.length,
      total_filtered: classified.length,
      categories_summary: categoriesSummary,
      classified_reviews: classified,
      themes,
      top_three_themes: topThreeThemes,
      recommendations,
      weekly_pulse: weeklyPulse,
      approval_record: approvalRecord,
      execution_mode: 'LOCAL_ENGINE'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal pipeline execution error' },
      { status: 500 }
    );
  }
}
