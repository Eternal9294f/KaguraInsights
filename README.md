# 💡 Project Kagura: Customer Feedback Intelligence

[![Live Demo](https://img.shields.io/badge/Live%20Demo-kagurainsights.vercel.app-emerald?style=flat-square)](https://kagurainsights.vercel.app)
[![Tests](https://img.shields.io/badge/Validation%20Tests-7%2F7%20Passed%20(100%25)-success?style=flat-square)]()
[![NextLeap](https://img.shields.io/badge/NextLeap%20PM%20Fellowship-Milestone%205-blue?style=flat-square)]()
[![Next.js 14](https://img.shields.io/badge/Built%20with-Next.js%2014%20%7C%20Tailwind-black?style=flat-square)]()

**Kagura** turns hundreds of messy app store reviews into clear, actionable decisions for product managers.

Instead of reading angry 1-star reviews one by one, Kagura automatically groups customer complaints, pinpoints the biggest problems, and writes an executive **Weekly Product Pulse (under 250 words)** with recommendations. Nothing gets sent to stakeholders without a **human product manager reviewing and signing off first.**

---

## 🧐 The Real-World Story: What are we solving?

We demonstrated Kagura on **Groww**, one of India's most popular investing apps.

### The Big Misunderstanding:
* Groww advertises **"Zero Commission Direct Mutual Funds"**.
* But when users withdraw their money before 1 year, mutual fund companies (AMCs) legally deduct a **1% exit load** (under government SEBI rules).
* **The result?** Users get angry and leave 1-star reviews thinking Groww secretly stole their money:
  > *"Groww deducted 1% brokerage when I took out my money. Total fraud! Direct funds are supposed to be free! Refund my money!"*
* **The reality:** Groww didn't take a single rupee—it was the mutual fund company's exit fee.
* **The product opportunity:** Groww is losing customer trust simply because the app doesn't explain this deduction clearly before the user hits "Withdraw".

Kagura spotted this instantly: **35% of all complaints** in an 8–12 week window were about this single misunderstanding.

---

## ⚡ How Kagura Works (In 5 Simple Steps)

```
[ 1. Ingest Reviews ] ──► [ 2. Sort into 5 Buckets ] ──► [ 3. Rank Top Friction ]
                                                                 │
                                                                 ▼
[ 5. Human Sign-Off & MCP Draft ] ◄── [ 4. Generate 250-Word Weekly Pulse ]
```

1. **Step 1: Gathers Public Reviews**  
   Collects 60 verified Google Play and Apple App Store reviews across an 8–12 week window.
2. **Step 2: Sorts Reviews into 5 Clear Categories**  
   * **Fees & Charges** (Exit load, tax, brokerage confusion)
   * **Orders & Redemptions** (SIP delays, NAV allotment timing)
   * **Account & KYC** (Aadhaar, bank mandate, penny drop verification)
   * **App Usability & Performance** (9:15 AM market-open lags, chart freezes)
   * **Customer Support** (Chatbot loops, unhelpful responses)
3. **Step 3: Ranks the Biggest Pain Points**  
   Counts complaint frequency without double-counting, attaching actual user quotes to every issue so product teams see exact proof.
4. **Step 4: Writes a Weekly Product Pulse (≤ 250 words)**  
   Drafts a 1-page executive summary for leadership with the top 3 friction points and practical recommendations.
5. **Step 5: Human Approval Gate (HITL)**  
   AI never sends emails on its own. A human product manager reviews the draft, makes edits, and signs off. Only then does Kagura stage a Google Doc and Gmail draft.

---

## 📊 What Kagura Found (The Top 3 Issues at Groww)

| Rank | Friction Issue | Complaints | Share | What Users Said | What We Should Build |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **#1** | **AMC Exit-Load Misunderstanding** | **21 reviews** | **35%** | *"Deducted 1% brokerage when I withdrew... Total fraud!"* | Add a pop-up before withdrawal showing the exact exit fee and: *"Wait 14 days to withdraw for ₹0 fee."* |
| **#2** | **SIP Delay & Missed NAV Cut-off** | **14 reviews** | **23%** | *"Money cut from bank but units not allotted for 3 days."* | Connect live webhooks with mutual fund registrars (CAMS) for instant allotment. |
| **#3** | **Morning Market-Open App Crash** | **11 reviews** | **18%** | *"App freezes every day at 9:15 AM when the stock market opens."* | Boost server capacity and isolate candlestick charts during market open. |

---

## 🛡️ Built-in Safety: Human-in-the-Loop (HITL)

Kagura follows strict safety rules called **MCP Guardrails**:
* **No Auto-Sending:** Kagura creates an email **Draft** in Gmail. It never hits "Send" automatically.
* **Reviewer Signature:** Downstream workflows are strictly locked until a product manager reviews the data and signs off with an approval hash.
* **100% Traceable:** Every insight is linked directly to a real Review ID (e.g. `REV-GW-001`).

---

## 🧪 7/7 Automated Tests (100% Passing)

Every single logic step is backed by automated tests to ensure 100% reliability:

```bash
node tests/test_runner.js
```

| Test # | What is Tested | Result | Evidence |
| :---: | :--- | :---: | :--- |
| **TEST-1** | Reviews filtered to 8–12 week date window | ✅ **PASSED** | 60 reviews verified |
| **TEST-2** | Reviews mapped into the 5 categories | ✅ **PASSED** | 100% accurately sorted |
| **TEST-3** | No duplicate counting across themes | ✅ **PASSED** | Clean math across all clusters |
| **TEST-4** | Frequency ranking calculates correctly | ✅ **PASSED** | Fees & Charges identified as #1 (21 reviews) |
| **TEST-5** | Exact user quotes linked to review IDs | ✅ **PASSED** | Matches `REV-GW-001` verbatim quote |
| **TEST-6** | Executive report is strictly ≤ 250 words | ✅ **PASSED** | Exactly 164 words (Limit: ≤ 250) |
| **TEST-7** | Downstream dispatch blocked until approved | ✅ **PASSED** | Unapproved actions return 403 Forbidden |

---

## 💻 Quick Start: Try it on Your Machine

### 1. Install dependencies
```bash
npm install
```

### 2. Run the automated tests
```bash
node tests/test_runner.js
```

### 3. Start the app
```bash
npm start
```
Then open your browser at **[http://localhost:3000](http://localhost:3000)**.

> Or view the live deployment directly at: **[kagurainsights.vercel.app](https://kagurainsights.vercel.app)**

---

## 📁 Project Structure

```text
├── src/
│   ├── app/                # Next.js web app (Calm, minimal UI)
│   ├── lib/
│   │   ├── taxonomy.ts     # 5 canonical feedback categories
│   │   ├── theme_engine.ts # Theme clustering & ranking math
│   │   ├── pulse_generator.ts # 250-word report synthesizer
│   │   └── hitl_gate.ts    # Human-in-the-loop approval lock
│   └── mcp/                # Model Context Protocol tools (Google Docs, Gmail)
├── data/
│   ├── reviews.csv         # Raw review dataset (60 reviews)
│   └── kagura_enriched_intelligence.csv # Full classified analysis spreadsheet
├── docs/
│   ├── PRD.md              # Complete Product Requirements Document
│   └── WEEKLY_PRODUCT_PULSE.md # Executive pulse report & feature specs
├── n8n/                    # Automated workflow JSONs for n8n Cloud
└── tests/
    └── test_runner.js      # 7/7 automated validation test runner
```

---

## 🎓 NextLeap Product Management Fellowship (Milestone 5)

* **Workspace:** Groww (Mutual Funds & Direct Equity)
* **Author:** Aditya Naagar
* **Evaluation Criteria Satisfied:**
  - 8–12 week public review corpus ingested & normalized.
  - 5-category canonical taxonomy applied.
  - Frequency ranking without double-counting.
  - Grounded customer verbatim quotes attached.
  - Executive Weekly Product Pulse strictly ≤ 250 words.
  - Human-in-the-Loop (HITL) gate with signed audit lock.
  - Model Context Protocol (MCP) tool integration.
  - 7/7 automated validation tests passed (100%).
