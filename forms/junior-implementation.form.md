---
markform:
  spec: MF/0.1
  version: "2026.01.30"
  title: Junior Implementation Role Assessment
  description: SQL and data analysis assessment for junior implementation roles (0-2 years experience)
  run_mode: research
  roles: [agent]
  target_score: "60-75 points"
  # Role metadata for auto-detection
  role:
    id: junior
    title: Junior Implementation
    experience: "0-2 years"
    estimated_time: "60-90 minutes"
    sort_order: 1
---

<!-- form id="junior_implementation_assessment" -->

<!-- group id="candidate_info" title="Candidate Information" -->

## Candidate Information

Please provide your contact information to begin the assessment.

<!-- field kind="string" id="candidate_name" label="Full Name" role="agent" required=true minLength=2 maxLength=100 -->
<!-- /field -->

<!-- field kind="string" id="candidate_email" label="Email Address" role="agent" required=true minLength=5 maxLength=150 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_1" title="SECTION 1: Data Quality & Deduplication (20 points)" -->

## SECTION 1: Data Quality & Deduplication (Core)

### Question 1.1: The Duplicate Import Mystery \*

_The warehouse received a data file today, but the import keeps failing with a "duplicate key violation" error. The operations team re-sent the file twice, thinking it was corrupted. How would you identify and fix the issue?_

**Context:** You're importing assignment data where `(consignee, sku, location_id)` must be unique.

```sql
-- Current import query
SELECT consignee, sku, location_id, quantity, uom
FROM raw_assignment_data
WHERE import_date = CURRENT_DATE;
```

**Dataset Sample:**

```
| consignee | sku      | location_id | quantity | uom | import_timestamp    |
|-----------|----------|-------------|----------|-----|---------------------|
| DEMO      | SKU-001  | ABCD 01 02  | 100      | PC  | 2024-01-27 10:00:00 |
| DEMO      | SKU-001  | ABCD 01 02  | 150      | PC  | 2024-01-27 10:05:00 |
| DEMO      | SKU-002  | ABCD 01 03  | 200      | PC  | 2024-01-27 10:00:00 |
```

**Tasks:**

<!-- field kind="string" id="q1_1_problem" label="Task 1: What problem will occur with this query?" role="agent" required=true minLength=50 maxLength=1000 -->
<!-- /field -->

<!-- field kind="string" id="q1_1_solution" label="Task 2: Write a query that keeps only one record per unique key (the most recent one)" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="string" id="q1_1_validation" label="Task 3: How would you validate the deduplication worked correctly?" role="agent" required=true minLength=50 maxLength=2000 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_2" title="SECTION 2: Data Joins & Enrichment (20 points)" -->

## SECTION 2: Data Joins & Enrichment (Core)

### Question 2.1: The Missing Product Details _.form.md_.form.md

_Your scan event report shows SKU codes but no product names. The item master table exists, but it contains data from multiple daily imports, some outdated.
How would you enrich the events with only the current product information?_

**Context:**

```sql
-- Tables available:
-- events: event_id, sku, scan_time
-- item_master: import_job_id, sku, uom, name, ean (multiple imports exist)
```

**Tasks:**

<!-- field kind="string" id="q2_1_latest_import" label="Task 1: Write a query to get the latest import_job_id from item_master" role="agent" required=true minLength=30 maxLength=500 -->
<!-- /field -->

<!-- field kind="string" id="q2_1_cte" label="Task 2: Write a query that returns only items from the latest import" role="agent" required=true minLength=100 maxLength=2000 -->
<!-- /field -->

<!-- field kind="string" id="q2_1_join" label="Task 3: Combine events with the latest item data to show product details" role="agent" required=true minLength=100 maxLength=2000 -->
<!-- /field -->

<!-- field kind="string" id="q2_1_missing" label="Task 4: What happens if an event has a SKU not in the latest import? How would you identify these?" role="agent" required=true minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_3" title="SECTION 3: ABC Analysis & Statistics (15 points)" -->

## SECTION 3: ABC Analysis & Statistics (Core)

### Question 3.1: Too Many SKUs, Not Enough Time \*

_The warehouse has 50,000 SKUs but only enough labor to optimize slotting for 5,000. The manager asks: "Which items should we focus on to get the most impact?" How would you categorize the SKUs using order history data?_

**Context:**

```sql
-- Sample order statistics
| sku       | order_line_count | quantity_ordered | cumulative_percent_rank |
|-----------|------------------|------------------|-------------------------|
| SKU-001   | 1000             | 50000            | 0.45                    |
| SKU-002   | 800              | 40000            | 0.75                    |
| SKU-003   | 300              | 15000            | 0.90                    |
| SKU-004   | 100              | 5000             | 0.98                    |
```

**Tasks:**

<!-- field kind="string" id="q3_1_case" label="Task 1: Write a query to categorize SKUs into priority groups (A+, A, B, C) based on cumulative_percent_rank" role="agent" required=true minLength=100 maxLength=1500 -->
<!-- /field -->

<!-- field kind="string" id="q3_1_meaning" label="Task 2: What does cumulative_percent_rank = 0.45 mean in business terms?" role="agent" required=true minLength=50 maxLength=1000 -->
<!-- /field -->

<!-- field kind="string" id="q3_1_why_cumulative" label="Task 3: Why might we use cumulative_percent_rank instead of percent_rank for ABC?" role="agent" required=true minLength=50 maxLength=1000 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_4" title="SECTION 4: Window Functions & Sequence Analysis (20 points)" -->

## SECTION 4: Window Functions & Sequence Analysis (Core)

### Question 4.1: Where Did That Item Come From? _.form.md_.form.md

_Pickers scan a location barcode, then scan item barcodes. But in your events table, each scan is a separate row with no direct link between them. How would you build a report showing which location each item was picked from?_

**Context:**

```sql
-- Sample scans
| event_id | trace_id | time_created | scan_label | scan_code   |
|----------|----------|--------------|------------|-------------|
| e1       | t1       | 100          | location   | ABCD 01 02  |
| e2       | t1       | 105          | item       | SKU-12345   |
| e3       | t1       | 110          | location   | ABCD 01 03  |
| e4       | t1       | 115          | item       | SKU-67890   |
```

**Tasks:**

<!-- field kind="string" id="q4_1_lag" label="Task 1: Write a query to show the location each item was picked from" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="string" id="q4_1_lead" label="Task 2: Write a query to show which item will be picked next after each location scan" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- /group -->

<!-- group id="submission" title="Submission" -->

## Ready to Submit?

Please review your answers before submitting. Your responses will be emailed to the evaluation team for review.

**Scoring Information:**

- Target score for Junior role: 60-75 points
- Core Questions (Total): 75 points possible
- Focus on demonstrating problem-solving approach and SQL fundamentals

<!-- /group -->

<!-- /form -->
