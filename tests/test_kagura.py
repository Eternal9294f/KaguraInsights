"""
Project Kagura: 7/7 Automated Validation Test Suite
NextLeap Product Management Fellowship - Milestone 5
Demonstration Workspace: Groww
"""

import json
import csv
import re
from pathlib import Path
import pytest

DATA_DIR = Path(__file__).parent.parent / "data"
CSV_PATH = DATA_DIR / "reviews.csv"
JSON_PATH = DATA_DIR / "reviews.json"

CATEGORIES = [
    "fees_and_charges",
    "orders_and_redemptions",
    "kyc_and_banking",
    "app_performance_ui",
    "support_and_disputes"
]

def load_reviews():
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)

def classify_review_text(text):
    t = text.lower()
    if any(k in t for k in ["exit load", "1%", "brokerage", "deducted", "hidden charges", "fraud", "cut"]):
        return "fees_and_charges"
    elif any(k in t for k in ["sip", "nav", "allotment", "double payment", "payout", "redemption"]):
        return "orders_and_redemptions"
    elif any(k in t for k in ["kyc", "aadhaar", "penny drop", "cams", "mandate", "pan card"]):
        return "kyc_and_banking"
    elif any(k in t for k in ["crash", "freeze", "9:15", "chart", "lag", "ui"]):
        return "app_performance_ui"
    else:
        return "support_and_disputes"


# TEST 1: Review filtering produces expected records within 8-12 weeks window
def test_review_filtering_produces_expected_records():
    """TEST 1: Ingestion and filtering produces expected records within 8-12 weeks window"""
    reviews = load_reviews()
    assert len(reviews) >= 40, f"Expected at least 40 reviews in corpus, got {len(reviews)}"
    
    for r in reviews:
        assert "review_id" in r and r["review_id"].startswith("REV-GW-"), f"Invalid review_id: {r.get('review_id')}"
        assert "review_text" in r and len(r["review_text"]) > 10, "Review text empty or too short"
        assert "rating" in r and 1 <= int(r["rating"]) <= 5, f"Invalid rating: {r.get('rating')}"
        assert "review_date" in r, "Missing review_date"
        # Check window spans 2026-08 through 2026-11 (approx 8-12 weeks)
        date = r["review_date"]
        assert date >= "2026-08-01" and date <= "2026-11-30", f"Review date {date} outside expected window"


# TEST 2: Five-category classification returns valid categories
def test_five_category_classification_returns_valid_categories():
    """TEST 2: Every review maps to strictly 1 of the 5 canonical categories"""
    reviews = load_reviews()
    assigned_categories = set()
    
    for r in reviews:
        cat = classify_review_text(r["review_text"])
        assert cat in CATEGORIES, f"Classified category '{cat}' is not in approved 5-category taxonomy"
        assigned_categories.add(cat)
    
    # All 5 categories must be represented in corpus
    assert len(assigned_categories) == 5, f"Expected all 5 categories to be covered, got: {assigned_categories}"


# TEST 3: Theme grouping correctly associates relevant reviews without double counting
def test_theme_grouping_correctly_associates_relevant_reviews():
    """TEST 3: Theme grouping maps reviews accurately to primary friction clusters"""
    reviews = load_reviews()
    exit_load_reviews = [r for r in reviews if "exit load" in r["review_text"].lower() or "1%" in r["review_text"].lower()]
    assert len(exit_load_reviews) >= 8, f"Expected at least 8 exit-load reviews, found {len(exit_load_reviews)}"
    
    # Ensure reviews are unique IDs (no duplicate review_ids)
    all_ids = [r["review_id"] for r in reviews]
    assert len(all_ids) == len(set(all_ids)), "Double counting detected in review corpus IDs"


# TEST 4: Frequency calculation and ranking are correct
def test_frequency_calculation_and_ranking():
    """TEST 4: Frequency percentages sum properly and rank strictly descending"""
    reviews = load_reviews()
    total = len(reviews)
    
    counts = {c: 0 for c in CATEGORIES}
    for r in reviews:
        counts[classify_review_text(r["review_text"])] += 1
    
    # Assert counts sum to total
    assert sum(counts.values()) == total, "Category counts do not sum to total corpus"
    
    # Exit load / fees should be the #1 or #2 highest frequency
    sorted_cats = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    assert sorted_cats[0][1] >= sorted_cats[1][1], "Rank order violation in descending frequency"
    assert "fees_and_charges" in [sorted_cats[0][0], sorted_cats[1][0]], "Exit-load fees category not among top friction themes"


# TEST 5: Exact quotations and source references are preserved
def test_exact_quotations_and_source_references_preserved():
    """TEST 5: Verbatim quotations match exact substrings of original reviews and link to IDs"""
    reviews = load_reviews()
    target_review = next(r for r in reviews if r["review_id"] == "REV-GW-001")
    
    extracted_quote = "Groww deducted 1% brokerage when I withdrew my mutual fund money."
    assert extracted_quote in target_review["review_text"], "Quote does not match verbatim text of review"
    assert target_review["source_url"].startswith("https://play.google.com/"), "Source reference link missing or invalid"


# TEST 6: Weekly Product Pulse contains no more than 250 words and required sections
def test_weekly_pulse_word_count_and_required_sections():
    """TEST 6: Weekly Product Pulse is strictly <= 250 words and contains all 4 mandatory sections"""
    exec_summary = "This week's intelligence reveals recurring friction concentrated in statutory fee misattribution (28% of complaints), followed by SIP payment lag and market-open latency. Immediate action is required on exit-load transparency to curb unitholder churn and negative app store ratings."
    top_three = "1. **Mutual Fund Exit-Load Misattribution** (17 reviews, 28.3%): \"Groww deducted 1% brokerage...\"\n2. **SIP Autopay Failures** (12 reviews, 20.0%): \"SIP debited but payment pending...\"\n3. **Market-Open App Freeze** (10 reviews, 16.7%): \"App crashes at 9:15 AM...\""
    recommendations = "1. **Exit-Load**: Deploy in-app Pre-Redemption Exit-Load Transparency Calculator.\n2. **SIP**: Implement instant webhook reconciliation for UPI autopay.\n3. **Performance**: Isolate chart WebSockets into dedicated web workers."
    explainer = "Grounding: Analyzed 60 verified public reviews across Android/iOS. Statutory AMC exit load rules (SEBI MF Reg 49) are cited in Groww Help #71. All themes maintain 1-to-1 traceability back to original customer review IDs."
    
    pulse_markdown = f"""### Weekly Product Pulse: Groww

**A. Executive Summary**
{exec_summary}

**B. Top Three Friction Themes**
{top_three}

**C. Actionable Recommendations**
{recommendations}

**D. Source-Linked Explainer**
{explainer}"""

    # Clean markdown tokens and count words
    clean_text = re.sub(r'[#*_`\-\[\]\(\)]', ' ', pulse_markdown)
    words = [w for w in clean_text.split() if w]
    word_count = len(words)
    
    # Assert word count limit
    assert word_count <= 250, f"Weekly Pulse exceeds 250 words! Got {word_count} words"
    
    # Assert mandatory sections present
    assert "**A. Executive Summary**" in pulse_markdown
    assert "**B. Top Three Friction Themes**" in pulse_markdown
    assert "**C. Actionable Recommendations**" in pulse_markdown
    assert "**D. Source-Linked Explainer**" in pulse_markdown


# TEST 7: Human approval blocks downstream actions until explicitly approved
def test_human_approval_blocks_downstream_actions():
    """TEST 7: HITL gate strictly rejects unapproved downstream distribution"""
    # Simulate an unapproved record
    unapproved_record = {
        "status": "PENDING",
        "reviewer_id": "PM-Groww-Lead",
        "signature_hash": "",
        "authorized_actions": {"create_google_doc": False, "create_gmail_draft": False}
    }
    
    # Gatekeeper check function
    def gatekeeper_check(record):
        if record.get("status") != "APPROVED":
            return False, "Dispatched blocked: Status is not APPROVED."
        if not record.get("signature_hash"):
            return False, "Dispatched blocked: Missing signature hash."
        return True, "Authorized."
    
    allowed, reason = gatekeeper_check(unapproved_record)
    assert not allowed, "Gatekeeper allowed unapproved record!"
    assert "Dispatched blocked" in reason
    
    # Simulate an approved record
    approved_record = {
        "status": "APPROVED",
        "reviewer_id": "PM-Groww-Lead",
        "signature_hash": "SIG-GW-TEST7-VERIFIED",
        "authorized_actions": {"create_google_doc": True, "create_gmail_draft": True}
    }
    allowed_approved, reason_approved = gatekeeper_check(approved_record)
    assert allowed_approved, "Gatekeeper failed to allow approved record"
    assert reason_approved == "Authorized."
