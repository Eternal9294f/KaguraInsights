# 📄 Product Requirements Document (PRD): Project Kagura

**Product Name:** Kagura (Customer Feedback Intelligence Platform)  
**Target Workspace:** Groww (Mutual Funds & Direct Stock Investing)  
**Fellowship Program:** NextLeap Product Management Fellowship — Milestone 5  
**Version:** 1.0.0 (Production SaaS Prototype)  
**Author:** Technical Product Manager & Senior AI Product Architect  

---

## 1. Executive Summary & Problem Space

In modern high-velocity consumer fintech applications like **Groww**, product managers receive thousands of public app reviews every week across the Apple App Store, Google Play Store, and social channels.

### The Problem:
1. **Scattered Feedback**: Reviews are fragmented, unstructured, and noisy.
2. **Friction Obfuscation**: High-impact operational and regulatory misconceptions get buried under generic 1-star ratings.
3. **The AMC Exit-Load Dilemma**: In Groww's mutual fund flow, users redeeming units within statutory lock-in periods (e.g. 365 days) incur a 0.5%–1.0% statutory AMC exit-load fee. Retail investors misattribute this statutory fee to unauthorized broker cuts or hidden commissions levied by Groww, triggering angry reviews, SEBI threats, and unitholder churn.
4. **Lack of HITL Governance**: Autonomous AI summaries often hallucinate user quotes or trigger premature emails to leadership without human review.

### The Solution (Kagura):
Kagura is an end-to-end, evidence-traceable intelligence platform that:
- Normalizes and classifies reviews into a canonical **5-category taxonomy**.
- Groups complaints into recurring themes and calculates exact frequency % (zero double-counting).
- Enforces an automated **≤ 250 words** executive **Weekly Product Pulse**.
- Gates downstream distribution behind an immutable **Human-in-the-Loop (HITL)** approval record.
- Invokes real **Model Context Protocol (MCP)** tools to publish Google Docs and stage (never auto-send) Gmail stakeholder drafts.

---

## 2. Target User Personas & User Journey

### Primary Persona: Lead Product Manager (Growth & Mutual Funds)
- **Goal**: Identify core dropoff friction, understand true sentiment drivers, and prioritize product backlog items with quantifiable evidence.
- **Pain Point**: Spends 8+ hours manually tagging spreadsheets and arguing with stakeholders about whether exit-load complaints are statistically significant.

### Secondary Persona: VP of Product / Executive Leadership
- **Goal**: Receive a concise, evidence-grounded **Weekly Product Pulse** under 250 words that links complaints directly to actionable backlog fixes.

### User Journey Map:
```
[ Ingest Reviews ] ──► [ 5-Category Sort ] ──► [ Theme Clustering ] ──► [ Generate Pulse ]
                                                                               │
                                                                               ▼
[ Live Google Doc ] ◄── [ MCP Dispatch ] ◄── [ Human Approval Gate ] ◄─────────┘
        &
[ Gmail Draft ]
```

---

## 3. Canonical 5-Category Issue Taxonomy (Groww)

| Category ID | Category Name | Description | Conflict / Ambiguity Rule |
| :--- | :--- | :--- | :--- |
| `fees_and_charges` | **Fees, Charges & Statutory Deductions** | Exit-load misattributions, GST, STT, brokerage fee misconceptions. | Prioritized when perceived financial deduction is the primary user grievance. |
| `orders_and_redemptions` | **Orders, Transactions & Redemptions** | NAV allotment lag, SIP processing delays, double payment debits. | Applies when transaction timing or order execution is the root cause. |
| `kyc_and_banking` | **Account Onboarding, KYC & Banking** | Penny-drop verification, Aadhaar OTP timeouts, bank mandate failures. | Applies to bank account linking, CAMS, and KRA regulatory verification. |
| `app_performance_ui` | **App Usability, UI & Performance** | Market-open app freezes (9:15 AM), chart latency, biometric login loops. | Applies to client software crashes, device compatibility, and UI lag. |
| `support_and_disputes` | **Customer Support & Dispute Escalations** | Chatbot circular looping, ticket closures without fix, missing helpline. | Applies when customer care unresponsiveness is the primary complaint. |

---

## 4. Theme Identification & Frequency Methodology

To ensure executive trust and mathematical reproducibility:
1. **No Double-Counting**: Each review is attributed to its single primary friction cluster.
2. **Frequency Calculation**:
   $$\text{Frequency } (\%) = \left( \frac{\text{Review Count in Theme}}{\text{Total Valid Reviews in Window}} \right) \times 100$$
3. **Centroid Quotation Grounding**: 3 verbatim quotes are extracted directly from review text and bound to `review_id`s with timestamps and source URLs.

---

## 5. Model Context Protocol (MCP) Architecture

Project Kagura integrates a genuine **JSON-RPC 2.0 MCP Server**:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_stakeholder_email_draft",
    "arguments": {
      "approval_id": "APP-2026-M5-042",
      "subject": "[Groww Pulse] Weekly Customer Feedback Intelligence",
      "executive_summary": "...",
      "documentation_url": "https://docs.google.com/document/d/..."
    }
  }
}
```

### Safety & Guardrail Guarantees:
- **Zero Auto-Send**: The MCP server schema defines draft staging only (`users.drafts.create`); outbound sending permissions are structurally absent from the code.
- **Signed Approval Requirement**: Dispatches fail with `403 Forbidden` unless payload includes a valid reviewer signature hash.

---

## 6. Two Decoupled n8n Workflows

1. **Workflow 1: Review Intelligence Pipeline** (`n8n/workflow_1_review_intelligence_pipeline.json`):
   - Trigger: Webhook (`POST /webhook/review-intelligence-pipeline`)
   - Nodes: Filter (8–12 wks) &rarr; 5-Category Classifier &rarr; Theme Clustering &rarr; Verbatim Extractor &rarr; Recommendations Engine &rarr; Weekly Pulse Synthesizer &rarr; Response.
2. **Workflow 2: Approved Stakeholder Distribution** (`n8n/workflow_2_approved_stakeholder_distribution.json`):
   - Trigger: Webhook (`POST /webhook/dispatch-approved-pulse`)
   - Nodes: HITL Gatekeeper Check &rarr; MCP Doc Generation &rarr; MCP Email Draft Staging &rarr; Audit Logger &rarr; Response.

---

## 7. 7/7 Automated Validation Test Suite

All 7 core test assertions execute with 100% pass rate in `< 0.2s`:

| Test ID | Test Name | Assertion Target | Status |
| :---: | :--- | :--- | :---: |
| **TEST-1** | `test_review_filtering_window` | 8–12 week date windowing and required field integrity | **PASS (100%)** |
| **TEST-2** | `test_five_category_classification` | All reviews map to 1 of 5 canonical categories | **PASS (100%)** |
| **TEST-3** | `test_theme_grouping_no_duplicates` | Primary cluster association without double-counting | **PASS (100%)** |
| **TEST-4** | `test_frequency_ranking_order` | Mathematical percentage accuracy and descending rank | **PASS (100%)** |
| **TEST-5** | `test_verbatim_quote_grounding` | Substring match against source text + Review ID link | **PASS (100%)** |
| **TEST-6** | `test_weekly_pulse_word_count` | Strict length validation: **≤ 250 words** across 4 sections | **PASS (100%)** |
| **TEST-7** | `test_hitl_approval_gatekeeper` | Unapproved dispatch rejected; signed approval authorized | **PASS (100%)** |

---

## 8. Limitations & Roadmap

### Current Version Limitations:
- Public reviews currently rely on batch CSV/JSON exports or n8n scrapers rather than streaming app store WebSocket ingestion.
- The 5-category taxonomy is tuned for fintech/brokerage apps (Groww); other verticals require custom dictionary weights.

### V2 Roadmap:
- Real-time sentiment shift alerts over Slack/Teams when a new app release spikes 1-star ratings by > 15%.
- Direct Jira / Linear ticket generation from approved product recommendations via MCP.
