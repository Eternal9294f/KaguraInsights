# 🔥 Project Kagura: Customer Feedback Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)]()
[![Tests Passing](https://img.shields.io/badge/Tests-7%2F7%20Passed%20(100%25)-brightgreen.svg)]()
[![MCP Enabled](https://img.shields.io/badge/MCP-JSON--RPC%202.0-purple)]()
[![NextLeap Fellowship](https://img.shields.io/badge/NextLeap-Milestone%205-orange)]()

**Kagura** is a customer feedback intelligence platform that converts scattered public app store reviews into structured, evidence-backed product insights. 

Demonstrated on **Groww** (Mutual Funds & Direct Stock Investing), Kagura isolates high-impact friction points (such as the statutory mutual fund exit-load misconception), quantifies complaint frequencies, generates an executive-ready **Weekly Product Pulse (strictly ≤ 250 words)**, and executes stakeholder communication gated by a strict **Human-in-the-Loop (HITL) Model Context Protocol (MCP)** layer.

---

## 📌 Executive Summary & Problem Space

- **Target Entity**: Groww (NextBillion Technology Pvt. Ltd.)
- **Primary Domain**: Mutual Funds & Direct Equity Investing
- **Primary Friction Isolated**: **Mutual Fund AMC Statutory Exit-Load Misattribution**
  - **The Grievance**: Retail unitholders redeeming mutual funds within 365 days notice a 0.5%–1.0% statutory deduction from their redemption payout.
  - **The Misconception**: Users misattribute this statutory fee to unauthorized broker cuts or hidden commissions charged by Groww (*"Groww cheated me! Deducted 1% brokerage on zero commission fund!"*).
  - **The Impact**: Spikes 1-star app store ratings, triggers SEBI complaint threats, and elevates unitholder churn.
  - **The Product Fix**: An in-app Pre-Redemption Exit-Load Transparency Calculator showing exact statutory AMC deductions versus ₹0 Groww broker fee before order confirmation.

---

## 🏗️ Technical Architecture

```
[ Public Review Corpus (Google Play / App Store) ]
                       │
                       ▼
        [ Next.js SaaS Web Cockpit ] (Screens 1 to 8)
                       │
         (POST /api/pipeline or n8n Webhook)
                       │
                       ▼
    [ n8n Workflow 1: Review Intelligence Pipeline ]
     ├─ 8–12 Week Window & Schema Validation
     ├─ 5-Category Taxonomy Classification Engine
     ├─ Theme Clustering & Frequency Math (Zero double-counting)
     ├─ Verbatim Grounding (Centroid substring quotes + Review IDs)
     └─ Weekly Product Pulse Generator (Strictly ≤ 250 words)
                       │
                       ▼
        [ SCREEN 7: HUMAN-IN-THE-LOOP APPROVAL GATE ]
         ├─ PM inspects and edits candidate pulse
         ├─ [REJECT]: Aborts execution immediately
         └─ [APPROVE]: Emits cryptographic approval record
                       │
                       ▼
    [ n8n Workflow 2: Approved Stakeholder Distribution ]
     ├─ Gatekeeper Node: Asserts status == 'APPROVED' (Else 403 Forbidden)
     ├─ MCP Tool: Create Google Docs / Notion Documentation Entry
     └─ MCP Tool: Create Gmail Stakeholder Email Draft (ZERO AUTO-SEND)
                       │
                       ▼
      [ Screen 8: Live Activity & Execution Trace ]
```

---

## 🖥️ The 8 Dedicated SaaS Screens

| Screen | Title | Key Capabilities |
| :--- | :--- | :--- |
| **Screen 1** | **Workspace Overview** | High-level metrics: review volume, top friction themes, pulse preview, Groww workspace badge. |
| **Screen 2** | **Reviews Explorer** | Searchable table with filters for rating (1–5★), date window, category, and verbatim text. |
| **Screen 3** | **5-Category Classification** | Visual breakdown across the 5 canonical categories with confidence scoring. |
| **Screen 4** | **Theme Intelligence** | Frequency-ranked friction clusters, percentage shares, and customer evidence quotes. |
| **Screen 5** | **Recommendations** | Actionable PM backlog proposals with problem context, evidence, and expected benefit. |
| **Screen 6** | **Weekly Product Pulse** | The executive 250-word report with live word-count validator and source explainer. |
| **Screen 7** | **Human Approval Gate** | HITL interface with inline markdown editor, signer badge, and authorization lock. |
| **Screen 8** | **Integrations & Activity** | Live execution audit logs, clickable Google Doc link, and Gmail draft ID. |

---

## 📊 Canonical 5-Category Taxonomy

1. **Fees, Charges & Statutory Deductions**: Exit load misattributions, GST, STT, brokerage fee misconceptions.
2. **Orders, Transactions & Redemptions**: NAV cut-off allotment lag, SIP processing delays, double payment debits.
3. **Account Onboarding, KYC & Banking**: Penny-drop verification, Aadhaar OTP timeouts, bank mandate failures.
4. **App Usability, UI & Performance**: Market-open app freezes (9:15 AM), chart latency, biometric login loops.
5. **Customer Support & Dispute Escalations**: Chatbot circular looping, ticket closures without fix, missing helpline.

---

## 🧪 7/7 Automated Validation Tests (100% Passing)

Kagura features dual test runners (Pytest & Node.js) validating the 7 core requirements:

```bash
# Option 1: Run with Python / Pytest
python -m pytest tests/test_kagura.py -v -p no:cacheprovider

# Option 2: Run with Node.js runner
node tests/test_runner.js
```

### Official Execution Report:

| Test ID | Test Name | Status | Evidence / Result |
| :---: | :--- | :---: | :--- |
| **TEST-1** | Review filtering produces expected records (8-12 wk window) | ✅ **PASSED** | 60 reviews validated within date bounds |
| **TEST-2** | Five-category classification returns valid categories | ✅ **PASSED** | 100% reviews mapped to 5 canonical categories |
| **TEST-3** | Theme grouping correctly associates relevant reviews | ✅ **PASSED** | Zero double counting across clusters |
| **TEST-4** | Frequency calculation and ranking are correct | ✅ **PASSED** | Fees & Charges top cluster: 21 reviews (Rank #1) |
| **TEST-5** | Exact quotations and source references are preserved | ✅ **PASSED** | Verbatim substring matched to `REV-GW-001` |
| **TEST-6** | Weekly Product Pulse contains <= 250 words & 4 sections | ✅ **PASSED** | Automated validation: 72 words (Strictly ≤ 250 words) |
| **TEST-7** | Human approval blocks downstream actions until approved | ✅ **PASSED** | Downstream dispatch strictly rejected without approval |

---

## 🚀 Quickstart Guide (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Tests
```bash
npm test
# or
node tests/test_runner.js
```

### 3. Start Local Web Cockpit
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ⚡ How to Import the n8n Workflows

1. Open your **n8n Cloud** or local instance (`app.n8n.cloud`).
2. Navigate to **Workflows &rarr; Import from File**.
3. Import the two pre-wired JSON files:
   - `n8n/workflow_1_review_intelligence_pipeline.json`
   - `n8n/workflow_2_approved_stakeholder_distribution.json`
4. Copy the Webhook URLs and paste them into Kagura’s **Settings Modal** on the web app!

---

## 🔒 MCP Safety & Guardrails
1. **Mandatory Human Sign-off**: Downstream tools will return `403 Forbidden` unless the payload contains a valid reviewer signature hash.
2. **Draft-Only Email Protection**: The MCP email tool creates drafts in Gmail (`users.drafts.create`); sending permissions are strictly omitted from the protocol.
3. **Traceability Guarantee**: Every quote and recommendation includes a direct reference link back to the originating review ID.
