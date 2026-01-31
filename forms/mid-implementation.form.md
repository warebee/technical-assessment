---
markform:
  spec: MF/0.1
  version: "2026.01.30"
  title: Mid-Level Implementation Role Assessment
  description: SQL and data analysis assessment for mid-level implementation roles (2-5 years experience)
  run_mode: research
  roles: [agent]
  target_score: "76-90 points"
  # Role metadata for auto-detection
  role:
    id: mid
    title: Mid-Level Implementation
    experience: "2-5 years"
    estimated_time: "90-120 minutes"
    sort_order: 2
---

<!-- form id="mid_implementation_assessment" -->

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

### Question 1.2: The Retry Storm _.form.md_.form.md

_Mobile scanners in the warehouse sometimes lose network connectivity and retry sending events. The same scan is now appearing multiple times in your database. How would you clean this up?_

**Context:** You have event data with duplicate `event_id` values due to retries.

```sql
-- Sample data
| event_id | time_created    | time_received   | device_serial | scan_code |
|----------|-----------------|-----------------|---------------|-----------|
| evt-001  | 1706356800000   | 1706356805000   | GLOVE-123     | LOC-001   |
| evt-001  | 1706356800000   | 1706356810000   | GLOVE-123     | LOC-001   |
| evt-002  | 1706356820000   | 1706356825000   | GLOVE-456     | ITEM-789  |
```

**Tasks:**

<!-- field kind="string" id="q1_2_explain" label="Task 1: Explain why taking the latest time_received makes sense for deduplication" role="agent" required=true minLength=50 maxLength=1000 -->
<!-- /field -->

<!-- field kind="string" id="q1_2_cte" label="Task 2: Write a query to keep only one record per event_id (the one with the latest time_received)" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="string" id="q1_2_alternative" label="Task 3: What would happen if you used time_created instead? When might that be appropriate?" role="agent" required=true minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- field kind="string" id="q1_2_bonus" label="BONUS: How would you handle cases where time_received is NULL?" role="agent" required=false minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_2" title="SECTION 2: Data Joins & Enrichment (20 points)" -->

## SECTION 2: Data Joins & Enrichment (Core)

### Question 2.2: The Barcode Mix-Up _.form.md_.form.md\*

_Some warehouses scan EAN barcodes, others scan internal SKU codes. Your events table has both, but the item master uses a different column for each. How would you match events to products regardless of which code was scanned?_

**Context:** Events can scan either EAN codes OR SKU codes. You need to enrich with item data.

```sql
-- Sample events
| event_id | scan_type | scan_code      |
|----------|-----------|----------------|
| evt-001  | ean       | 4006209532584  |
| evt-002  | sku       | SKU-12345      |
| evt-003  | ean       | 4006209532591  |

-- Item master
| sku       | ean           | uom | name        |
|-----------|---------------|-----|-------------|
| SKU-12345 | 4006209532584 | PC  | Widget A    |
| SKU-67890 | 4006209532591 | BOX | Widget B    |
```

**Tasks:**

<!-- field kind="string" id="q2_2_join_strategy" label="Task 1: Write a join strategy that matches when scan_type='ean' → item_master.ean, and when scan_type='sku' → item_master.sku" role="agent" required=true minLength=100 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q2_2_tradeoff" label="Task 2: What are alternative approaches to solve this, and what are the trade-offs?" role="agent" required=true minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- field kind="string" id="q2_2_bonus" label="BONUS: How would you handle case sensitivity differences (e.g., 'sku-12345' vs 'SKU-12345')?" role="agent" required=false minLength=50 maxLength=1000 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_3" title="SECTION 3: ABC Analysis & Statistics (15 points)" -->

## SECTION 3: ABC Analysis & Statistics (Core)

### Question 3.2: The Multi-Tenant Popularity Contest _.form.md_.form.md

_Your warehouse serves multiple customers (consignees). A "fast mover" for one customer might be a "slow mover" for another. How would you rank items separately for each customer?_

**Context:** Calculate ABC per consignee (different customers have different popular items).

```sql
-- Sample data (multi-tenant)
| consignee | sku     | quantity_ordered |
|-----------|---------|------------------|
| DEMO      | SKU-001 | 10000            |
| DEMO      | SKU-002 | 5000             |
| ACME      | SKU-001 | 500              |
| ACME      | SKU-002 | 8000             |
```

**Tasks:**

<!-- field kind="string" id="q3_2_query" label="Task 1: Write a query to rank items by order volume, separately for each customer" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="string" id="q3_2_explain" label="Task 2: Why would SKU-001 be 'A+' for DEMO but 'C' for ACME?" role="agent" required=true minLength=50 maxLength=1000 -->
<!-- /field -->

<!-- field kind="string" id="q3_2_bonus" label="BONUS: Write a query to compare global ABC vs per-consignee ABC - find items where the classification differs by 2+ categories" role="agent" required=false minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_4" title="SECTION 4: Window Functions & Sequence Analysis (20 points)" -->

## SECTION 4: Window Functions & Sequence Analysis (Core)

### Question 4.1: Where Did That Item Come From? _.form.md_.form.md

_Pickers scan a location barcode, then scan item barcodes. But in your events table, each scan is a separate row with no direct link between them. How would you build a report showing which location each item was picked from?_

**Context:** Track location→item scan sequences to validate pick flow.

```sql
-- Sample scans
| event_id | trace_id | time_created | scan_label | scan_code   |
|----------|----------|--------------|------------|-------------|
| e1       | t1       | 100          | location   | ABCD 01 02  |
| e2       | t1       | 105          | item       | SKU-12345   |
| e3       | t1       | 110          | location   | ABCD 01 03  |
| e4       | t1       | 115          | item       | SKU-67890   |
```

<!-- /group -->

<!-- group id="section_5" title="SECTION 5: Root Cause Analysis (25 points)" -->

## SECTION 5: Root Cause Analysis (Core)

### Question 5.1: The Phantom Stock _.form.md_.form.md

_The allocation engine says there's not enough stock for an order, but the inventory report shows plenty on hand.
Operations is frustrated - where's the disconnect? How would you investigate?_

**Context:** Allocation results show incorrect quantities.

```sql
-- Allocation results
| sku     | to_allocate_quantity | allocated_quantity | unallocated_quantity | unallocated_reason |
|---------|----------------------|--------------------|----------------------|--------------------|
| SKU-001 | 100                  | 80                 | 20                   | insufficient_stock |
| SKU-002 | 50                   | 50                 | 0                    | NULL               |
| SKU-003 | 200                  | 0                  | 200                  | no_location_found  |

-- Stock levels
| sku     | location_id | quantity_available |
|---------|-------------|-------------------|
| SKU-001 | LOC-A       | 50                |
| SKU-001 | LOC-B       | 50                |
| SKU-002 | LOC-C       | 60                |
| SKU-003 | LOC-D       | 250               |
```

**Tasks:**

<!-- field kind="string" id="q5_1_sku001" label="Task 1: SKU-001 - Why might only 80 units be allocated when 100 are in stock?" role="agent" required=true minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- field kind="checkboxes" id="q5_1_sku003_causes" label="Task 2: SKU-003 - Stock exists but nothing allocated. Select 3 or more possible root causes" role="agent" required=true -->

- [ ] Location marked as blocked/unavailable <!-- #blocked -->
- [ ] Item-location assignment missing (SKU not mapped to location) <!-- #assignment_missing -->
- [ ] Allocation rule excludes this location type <!-- #rule_excludes -->
- [ ] UOM mismatch (no conversion rule) <!-- #uom_mismatch -->
- [ ] Location type incompatible with process type <!-- #type_incompatible -->
- [ ] Consignee restriction (customer cannot access this location) <!-- #consignee_restrict -->
<!-- /field -->

<!-- field kind="string" id="q5_1_diagnostic" label="Task 3: Write a diagnostic query to join allocation results with stock to identify mismatches" role="agent" required=true minLength=100 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q5_1_bonus" label="BONUS: How would you detect if the allocation engine is preferring certain locations incorrectly?" role="agent" required=false minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_6" title="SECTION 6: Performance & Optimization (Bonus - 15 points)" -->

## SECTION 6: Performance & Optimization (Bonus)

### Question 6.1: The Slow Report _.form.md_.form.md\*

_A daily report that used to run in seconds now takes 10 minutes. The data volume has grown 10x. How would you make this query faster?_

**Context:** This query is slow on large datasets.

```sql
SELECT e.event_id,
       e.sku,
       (SELECT name FROM item_master
        WHERE sku = e.sku
        AND import_job_id = (SELECT MAX(import_job_id) FROM item_master)
       ) as item_name,
       (SELECT SUM(quantity) FROM stock
        WHERE sku = e.sku
       ) as total_stock
FROM events e
WHERE date_created >= CURRENT_DATE - INTERVAL '7' DAY;
```

**Tasks:**

<!-- field kind="string" id="q6_1_rewrite" label="Task 1: Rewrite this query to improve performance" role="agent" required=false minLength=150 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q6_1_explain" label="Task 2: Explain why the rewritten version performs better" role="agent" required=false minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- field kind="string" id="q6_1_bonus" label="BONUS: Add proper indexes - which columns would you index?" role="agent" required=false minLength=50 maxLength=1000 -->
<!-- /field -->

<!-- /group -->

<!-- group id="submission" title="Submission" -->

## Ready to Submit?

Please review your answers before submitting. Your responses will be emailed to the evaluation team for review.

**Scoring Information:**

- Target score for Mid-Level role: 76-90 points
- Core Questions: 100 points possible
- Bonus Questions: Up to 15 additional points
- Your answers will be manually graded using our answer key
- Focus on demonstrating problem-solving approach and SQL fundamentals
- BONUS tasks are optional but demonstrate advanced expertise

<!-- /group -->

<!-- /form -->
