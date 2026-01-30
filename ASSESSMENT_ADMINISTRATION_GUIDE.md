# Assessment Administration Guide

## Overview

This guide helps interviewers administer the Implementation Role technical assessment effectively.

---

## Assessment Formats

### Format 1: Take-Home Assignment (Recommended for Initial Screening)

**Duration:** 2-3 hours
**Setting:** Candidate completes at home with internet access
**Focus:** Depth and completeness

**Recommended Question Set:**

```
Core Questions (complete all):
- Question 1.1: Deduplication basics
- Question 2.1: Left join with latest data
- Question 3.1: Basic ABC classification
- Question 4.1: LAG and LEAD
- Question 5.1: Allocation mismatch diagnosis

Bonus Questions (attempt 1-2):
- Question 6.1: Query optimization
- Question 7.1: Time-series gap detection
```

**Delivery Instructions:**

1. Send questions as markdown file
2. Request SQL scripts + explanations document
3. Include sample data as CSV or SQL INSERT statements
4. Allow 48 hours to complete
5. Request they track time spent (honor system)

**Evaluation Focus:**

- Completeness and correctness (40%)
- Code quality and structure (25%)
- Explanation clarity (20%)
- Bonus question attempts (15%)

---

### Format 2: Live Coding Interview (45-60 minutes)

**Duration:** 45-60 minutes
**Setting:** Video call with screen share
**Focus:** Problem-solving process and communication

**Recommended Question Set (choose 2-3):**

```
Warm-up (10 min):
- Question 1.1: Deduplication basics

Main Questions (20-25 min each):
- Question 2.2: Complex join with multiple lookups
- Question 4.1: LAG and LEAD sequences
- Question 5.1: Root cause analysis

Follow-up (if time):
- Deep dive on one answer
- Ask "how would you optimize this?"
```

**Interview Flow:**

1. **0-5 min:** Introduce problem, clarify requirements
2. **5-20 min:** Candidate writes solution (allow pseudocode initially)
3. **20-30 min:** Discuss approach, handle follow-ups
4. **30-35 min:** Move to next question or deeper dive

**What to Observe:**

- ✅ Asks clarifying questions before coding
- ✅ Explains thinking out loud
- ✅ Tests logic mentally or with examples
- ✅ Recognizes mistakes and corrects them
- ✅ Adapts when given hints

**Red Flags:**

- ❌ Jumps straight to coding without understanding problem
- ❌ Cannot explain choices
- ❌ Defensive when questioned
- ❌ Gets stuck and cannot recover with hints

---

### Format 3: Hybrid Assessment (Optimal)

**Phase 1 - Take-Home (60 min):**
Complete Questions 1.1, 2.1, 3.1

**Phase 2 - Live Review (30 min):**

- Candidate walks through their solutions (10 min)
- Interviewer asks follow-up questions (15 min)
- Live coding challenge: Question 5.1 or 5.2 (15 min)

**Benefits:**

- Validates take-home work is candidate's own
- Tests real-time problem-solving
- Allows discussion of approach trade-offs

---

## Question Difficulty Mapping

### Junior Implementation Role (0-2 years)

**Required to Pass:** 60-75 points

**Recommended Questions:**

- 1.1: Deduplication basics \*
- 2.1: Left join with latest data _.form.md_.form.md
- 3.1: Basic ABC classification \*
- 4.1: LAG and LEAD (Task 1-2 only) _.form.md_.form.md

**Evaluation Criteria:**

- SQL syntax correctness
- Basic join understanding
- Can explain logic with prompting
- Attempts bonus questions (even if incomplete)

---

### Mid-Level Implementation Role (2-5 years)

**Required to Pass:** 76-90 points

**Recommended Questions:**

- 1.2: Multi-column deduplication _.form.md_.form.md
- 2.2: Complex joins _.form.md_.form.md\*
- 3.2: ABC with PARTITION BY _.form.md_.form.md
- 4.2: LAST*VALUE with frames *.form.md\_.form.md\*
- 5.1: Allocation mismatch _.form.md_.form.md
- One from Section 6 or 7 (bonus)

**Evaluation Criteria:**

- Advanced SQL features (window functions, CTEs)
- Considers edge cases without prompting
- Can compare multiple approaches
- Completes at least one bonus question

---

### Senior Implementation Role (5+ years)

**Required to Pass:** 91+ points

**Recommended Questions:**

- All core questions (1.2, 2.2, 3.2, 4.2, 5.2)
- At least 2 from Section 6 (Performance)
- At least 1 from Section 7 (Advanced scenarios)
- At least 1 from Section 8 (Data quality)

**Evaluation Criteria:**

- Optimal solutions, not just working ones
- Discusses performance implications unprompted
- Designs reusable patterns
- Shows deep understanding of data modeling
- Can mentor others (explains clearly)

---

## Scoring Guidelines

### Full Credit (100%)

- ✅ SQL runs without errors
- ✅ Returns correct results for all test cases
- ✅ Handles edge cases (NULL, empty sets, duplicates)
- ✅ Well-structured (CTEs, meaningful names)
- ✅ Clear explanation of approach

### Partial Credit (50-90%)

- ⚠️ SQL has minor syntax errors but logic is sound (70%)
- ⚠️ Works for happy path but fails edge cases (60%)
- ⚠️ Correct approach but inefficient (70%)
- ⚠️ Explanation is unclear or incomplete (80%)

### Minimal Credit (20-40%)

- ❌ Wrong approach but shows some understanding (30%)
- ❌ Pseudocode/sketch instead of working SQL (40%)
- ❌ Incomplete solution but on right track (25%)

### No Credit (0%)

- ❌ No attempt
- ❌ Solution completely unrelated to problem
- ❌ Copy-pasted without modification from internet

---

## Common Partial Solutions (How to Score)

### Scenario 1: Candidate uses DISTINCT instead of ROW_NUMBER()

```sql
-- Question 1.1 - Their answer:
SELECT DISTINCT consignee, sku, location_id, quantity, uom
FROM raw_assignment_data;
```

**Score: 30/100**

- Recognizes duplicate problem (✅)
- Does not preserve latest record (❌)
- DISTINCT doesn't solve the business need (❌)

**Follow-up Question:**
"What if the same consignee+sku+location has two different quantities? Which one does DISTINCT keep?"

**If they answer correctly:** Bump to 50/100 (concept understood, execution wrong)

---

### Scenario 2: Forgot IGNORE NULLS in window function

```sql
-- Question 4.1 - Their answer:
LAG(CASE WHEN scan_label = 'location' THEN scan_code ELSE NULL END)
OVER (PARTITION BY trace_id ORDER BY time_created)
```

**Score: 70/100**

- Correct function (LAG) (✅)
- Correct CASE logic (✅)
- Correct PARTITION and ORDER (✅)
- Missing IGNORE NULLS - won't skip item scans (❌)

**Follow-up:**
"Walk me through what happens when this encounters an item scan between two location scans."

**If they recognize the issue:** Bump to 90/100

---

### Scenario 3: Uses correlated subquery instead of CTE

```sql
-- Question 2.1 - Their answer:
SELECT e.event_id,
       e.sku,
       (SELECT name FROM item_master
        WHERE sku = e.sku
        AND import_job_id = (SELECT MAX(import_job_id) FROM item_master)
       ) as item_name
FROM events e;
```

**Score: 80/100**

- Logically correct (✅)
- Handles latest import correctly (✅)
- Performance concern for large datasets (⚠️)
- Not following CTE pattern requested (⚠️)

**Follow-up:**
"This works, but how would you rewrite it as a CTE? What's the performance difference?"

**If they can rewrite:** Keep 80/100 (knows multiple approaches)

---

## Test Data Preparation

### Minimal Test Dataset (for live coding)

Provide 5-10 rows that cover:

- ✅ Happy path cases
- ✅ At least one NULL value
- ✅ At least one duplicate
- ✅ At least one edge case (e.g., orphaned record)

### Example for Question 1.1:

```sql
CREATE TABLE raw_assignment_data (
  consignee VARCHAR(50),
  sku VARCHAR(50),
  location_id VARCHAR(50),
  quantity INT,
  uom VARCHAR(10),
  import_timestamp TIMESTAMP
);

INSERT INTO raw_assignment_data VALUES
  -- Duplicate (different quantities)
  ('DEMO', 'SKU-001', 'ABCD 01 02', 100, 'PC', '2024-01-27 10:00:00'),
  ('DEMO', 'SKU-001', 'ABCD 01 02', 150, 'PC', '2024-01-27 10:05:00'),

  -- Duplicate (same quantity - still should dedupe)
  ('DEMO', 'SKU-002', 'ABCD 01 03', 200, 'PC', '2024-01-27 10:00:00'),
  ('DEMO', 'SKU-002', 'ABCD 01 03', 200, 'PC', '2024-01-27 10:02:00'),

  -- No duplicate
  ('DEMO', 'SKU-003', 'ABCD 01 04', 50, 'BOX', '2024-01-27 10:00:00'),

  -- NULL in quantity (edge case)
  ('ACME', 'SKU-004', 'ABCD 02 01', NULL, 'PC', '2024-01-27 10:00:00'),
  ('ACME', 'SKU-004', 'ABCD 02 01', 75, 'PC', '2024-01-27 10:01:00');
```

**Expected Result After Deduplication:**

```
DEMO, SKU-001, ABCD 01 02, 150, PC   (latest)
DEMO, SKU-002, ABCD 01 03, 200, PC   (latest)
DEMO, SKU-003, ABCD 01 04, 50, BOX   (no dup)
ACME, SKU-004, ABCD 02 01, 75, PC    (non-null)
```

---

## Interview Facilitation Tips

### Creating a Positive Environment

1. **Start with context:** "This question tests deduplication, which you'll do daily in this role."
2. **Encourage questions:** "Feel free to ask about the data structure or requirements."
3. **Allow pseudocode:** "If you're unsure of exact syntax, pseudocode or comments are fine."
4. **Normalize mistakes:** "That's a common first approach - what happens if we have two records with the same timestamp?"

### Providing Hints (Without Giving Away Answer)

**If stuck on deduplication approach:**

- ❌ Don't say: "Use ROW_NUMBER()"
- ✅ Do say: "How could you assign a ranking to each duplicate and then filter?"

**If stuck on window function:**

- ❌ Don't say: "You need IGNORE NULLS"
- ✅ Do say: "Walk me through what happens row-by-row. What do you get when you LAG over a NULL?"

**If missing edge case:**

- ❌ Don't say: "What about NULLs?"
- ✅ Do say: "Let's test your query mentally. What if quantity is NULL in one row?"

### Time Management

**If candidate is taking too long (>50% over time):**

1. "Let's move forward - you can come back to this if we have time."
2. Ask them to explain their approach in words instead of finishing code.
3. Move to a different question type (don't stack 3 hard questions).

**If candidate finishes early:**

1. Ask follow-up: "How would this perform on 10 million rows?"
2. Request alternative approach: "Can you think of another way to solve this?"
3. Move to bonus questions.

---

## Red Flags by Question Type

### Deduplication Questions (1.1, 1.2)

- ❌ Tries to use DISTINCT on full row (including timestamp)
- ❌ Cannot explain why they chose specific ORDER BY column
- ❌ Uses RANK instead of ROW_NUMBER without understanding difference
- ❌ Deletes duplicates instead of querying deduplicated view

### Join Questions (2.1, 2.2)

- ❌ Uses INNER JOIN when LEFT JOIN needed (loses data)
- ❌ Joins without understanding cardinality (causes row multiplication)
- ❌ Cannot explain difference between LEFT JOIN and RIGHT JOIN
- ❌ Forgets to filter to latest import_job_id

### Window Function Questions (4.1, 4.2)

- ❌ Confuses LAG and LEAD
- ❌ Forgets PARTITION BY (mixes data from different jobs)
- ❌ Uses wrong ORDER BY direction (ASC vs DESC)
- ❌ Cannot explain what IGNORE NULLS does

### Root Cause Questions (5.1, 5.2)

- ❌ Jumps to conclusion without checking data
- ❌ Can only think of one possible cause
- ❌ Cannot design a diagnostic query
- ❌ Blames the system without evidence

---

## Calibration Across Interviewers

### Conduct Calibration Sessions

1. Have 3+ interviewers score the same candidate responses independently
2. Discuss differences in scoring
3. Agree on standards for "good enough" vs "excellent"

### Example Calibration Exercise

**Candidate Answer to Question 1.1:**

```sql
WITH ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY consignee, sku, location_id
                            ORDER BY import_timestamp DESC) as rn
  FROM raw_assignment_data
)
SELECT consignee, sku, location_id, quantity, uom
FROM ranked
WHERE rn = 1;
```

**Interviewer A Score: 95/100** ("Nearly perfect, just missing import_date filter")
**Interviewer B Score: 100/100** ("Exactly what I wanted")
**Interviewer C Score: 85/100** ("Should have used QUALIFY instead of CTE")

**Calibrated Score: 95/100**

- Solution is correct and complete (✅)
- CTE vs QUALIFY is stylistic preference (✅)
- Missing import_date filter is minor if sample data was pre-filtered (⚠️)

---

## Post-Assessment Debrief

### With the Candidate (if they pass)

1. "You did well on X, Y, Z - those are core skills for this role."
2. "Area to grow: [specific skill] - here are resources..."
3. "Next steps: [follow-up interview / take-home project]"

### With the Candidate (if they don't pass)

1. "Thank you for your time. The role requires [specific skills] at a higher level."
2. Be specific: "For example, window functions with proper framing are essential."
3. Offer resources: "I recommend practicing on [platform] if you'd like to strengthen these skills."
4. Leave door open: "Feel free to reapply in 6 months if you build these skills."

### Internal Team Debrief

1. Score each question objectively
2. Flag any questions that seemed unfair/unclear
3. Note any candidate strengths not captured by assessment
4. Make hire/no-hire recommendation based on rubric

---

## Adapting Questions for Your Warehouse

### Customization Checklist

- [ ] Replace "ABCD" location format with your actual format
- [ ] Use your actual table names (e.g., `wms_events` instead of `events`)
- [ ] Include your actual business rules (e.g., ABC thresholds)
- [ ] Add company-specific constraints (e.g., "consignee X cannot access zone Y")
- [ ] Use realistic data volumes from your warehouse

### Example Customization:

**Original Question 1.1:** Generic assignment import

**Customized for your warehouse:**
"You're importing shipment planning data where `(customer_id, order_id, carrier)` must be unique. Our source system sometimes sends duplicate webhooks..."

---

## Conclusion

This assessment is designed to be:

- ✅ **Practical:** Based on real warehouse implementation scenarios
- ✅ **Fair:** Multiple levels of difficulty with partial credit
- ✅ **Efficient:** Can be administered in 45 min (live) or 2 hours (take-home)
- ✅ **Predictive:** Tests skills used daily in implementation roles

Remember: The goal is not to trick candidates but to find those who can:

1. Solve real data problems
2. Think critically about edge cases
3. Communicate their approach clearly
4. Learn and adapt quickly

Good luck with your hiring! 🎯
