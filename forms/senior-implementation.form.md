---
markform:
  spec: MF/0.1
  version: "2026.01.30"
  title: Senior Implementation Role Assessment
  description: SQL and data analysis assessment for senior implementation roles (5+ years experience)
  run_mode: research
  roles: [agent]
  target_score: "91+ points"
---

<!-- form id="senior_implementation_assessment" -->

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

### Question 4.2: Fill in the Blanks _.form.md_.form.md\*

_Pickers scan a location once, then scan multiple items from that location. Your data shows NULL for location on item scans. Operations wants every row to show the current location the picker is working at. How would you fill in those gaps?_

**Context:** Propagate the last scanned location to all subsequent events (until a new location is scanned).

```sql
-- Sample events
| event_id | trace_id | time  | scan_label | scan_code   |
|----------|----------|-------|------------|-------------|
| e1       | t1       | 100   | location   | ABCD 01 02  |
| e2       | t1       | 105   | item       | SKU-111     |
| e3       | t1       | 110   | item       | SKU-222     |
| e4       | t1       | 115   | location   | ABCD 01 03  |
| e5       | t1       | 120   | item       | SKU-333     |
```

**Expected Result:**

```
| event_id | scan_label | scan_code   | current_location |
|----------|------------|-------------|------------------|
| e1       | location   | ABCD 01 02  | ABCD 01 02       |
| e2       | item       | SKU-111     | ABCD 01 02       |
| e3       | item       | SKU-222     | ABCD 01 02       |
| e4       | location   | ABCD 01 03  | ABCD 01 03       |
| e5       | item       | SKU-333     | ABCD 01 03       |
```

**Tasks:**

<!-- field kind="string" id="q4_2_query" label="Task 1: Write a query to fill in the current_location column as shown in the expected result" role="agent" required=true minLength=150 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q4_2_frame_explain" label="Task 2: Explain why your approach works and what happens at each row" role="agent" required=true minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- field kind="string" id="q4_2_range_vs_rows" label="Task 3: What edge cases or gotchas should you watch out for with this approach?" role="agent" required=true minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- field kind="string" id="q4_2_bonus" label="BONUS: Show an alternative approach to solve this and compare performance" role="agent" required=false minLength=100 maxLength=4000 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_5" title="SECTION 5: Root Cause Analysis (25 points)" -->

## SECTION 5: Root Cause Analysis (Core)

### Question 5.2: The Missing Pick _.form.md_.form.md\*

_A picker completed a job but the customer claims an item is missing from the shipment. The picker swears they picked everything. How would you compare what was supposed to be picked versus what was actually scanned?_

**Context:** Users report "missing items" in their pick jobs.

```sql
-- Events logged
| job_id | event_seq | event_type | location_id | item_id  | quantity |
|--------|-----------|------------|-------------|----------|----------|
| J-001  | 1         | JOB_START  | NULL        | NULL     | NULL     |
| J-001  | 2         | PICK       | ABCD 01 02  | SKU-111  | 1        |
| J-001  | 3         | PICK       | ABCD 01 03  | SKU-222  | 1        |
| J-001  | 4         | JOB_END    | PACKV-01    | NULL     | NULL     |

-- Expected picks (from order)
| job_id | item_id  | expected_quantity |
|--------|----------|-------------------|
| J-001  | SKU-111  | 1                 |
| J-001  | SKU-222  | 1                 |
| J-001  | SKU-333  | 1                 |
```

**Tasks:**

<!-- field kind="string" id="q5_2_missing" label="Task 1: Write a query to find missing picks (expected but not in events)" role="agent" required=true minLength=100 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q5_2_unexpected" label="Task 2: Write a query to find unexpected picks (in events but not expected)" role="agent" required=true minLength=100 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q5_2_completion_rate" label="Task 3: Calculate the job completion rate: actual_picks / expected_picks" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="checkboxes" id="q5_2_bonus_reasons" label="BONUS Part 1: What are 5 possible reasons SKU-333 wasn't picked?" role="agent" required=false -->

- [ ] Item out of stock at pick location <!-- #out_of_stock -->
- [ ] Location label damaged/unreadable <!-- #label_damaged -->
- [ ] Picker missed the location <!-- #picker_missed -->
- [ ] System allocated wrong location <!-- #wrong_allocation -->
- [ ] Item physically missing (inventory discrepancy) <!-- #missing -->
- [ ] Scanner malfunction/dead battery <!-- #scanner_issue -->
- [ ] Order was modified after job started <!-- #order_modified -->
<!-- /field -->

<!-- field kind="string" id="q5_2_bonus_investigate" label="BONUS Part 2: How would you investigate each of the selected reasons?" role="agent" required=false minLength=100 maxLength=2000 -->
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

<!-- field kind="string" id="q6_1_rewrite" label="Task 1: Rewrite this query to improve performance" role="agent" required=true minLength=150 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q6_1_explain" label="Task 2: Explain why the rewritten version performs better" role="agent" required=true minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- field kind="string" id="q6_1_bonus" label="BONUS: Add proper indexes - which columns would you index?" role="agent" required=false minLength=50 maxLength=1000 -->
<!-- /field -->

---

### Question 6.2: The Row Explosion _.form.md_.form.md\*

_Your report should show 1,000 assignments, but it's returning 50,000 rows. The numbers are all wrong. What's happening and how would you fix it?_

**Context:** This query returns incorrect results (too many rows).

```sql
SELECT a.consignee,
       a.sku,
       a.location_id,
       s.quantity_available,
       i.uom,
       i.name
FROM assignment a
LEFT JOIN stock s ON a.sku = s.sku
LEFT JOIN item_master i ON a.sku = i.sku;
```

**Data:**

```
-- assignment: 1 row per SKU
| consignee | sku     | location_id |
|-----------|---------|-------------|
| DEMO      | SKU-001 | ABCD 01 02  |

-- stock: multiple locations per SKU
| sku     | location_id | quantity_available |
|---------|-------------|-------------------|
| SKU-001 | LOC-A       | 50                |
| SKU-001 | LOC-B       | 30                |

-- item_master: multiple imports per SKU
| sku     | import_job_id | uom | name     |
|---------|---------------|-----|----------|
| SKU-001 | 100           | PC  | Widget A |
| SKU-001 | 101           | PC  | Widget A |
```

**Tasks:**

<!-- field kind="string" id="q6_2_rows" label="Task 1: How many rows will this query return? Why?" role="agent" required=true minLength=50 maxLength=1000 -->
<!-- /field -->

<!-- field kind="string" id="q6_2_fix" label="Task 2: Fix the query to return only 1 row per assignment" role="agent" required=true minLength=150 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q6_2_rule" label="Task 3: What's the general rule to avoid Cartesian products in multi-table joins?" role="agent" required=true minLength=50 maxLength=1000 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_7" title="SECTION 7: Practical Scenarios (Bonus - 15 points)" -->

## SECTION 7: Practical Scenarios (Bonus/Advanced)

### Question 7.1: Where Did the Time Go? _.form.md_.form.md\*

_The warehouse manager notices productivity is down but can't pinpoint why. They suspect workers are taking long unscheduled breaks. How would you identify gaps in activity from the scan data?_

**Context:** Detect when workers take breaks >15 minutes between scans.

```sql
-- Sample events
| worker_id | event_time          | event_type |
|-----------|---------------------|------------|
| W-001     | 2024-01-27 09:00:00 | PICK       |
| W-001     | 2024-01-27 09:05:00 | PICK       |
| W-001     | 2024-01-27 09:25:00 | PICK       |  -- 20 min gap
| W-001     | 2024-01-27 09:30:00 | PICK       |
```

**Tasks:**

<!-- field kind="string" id="q7_1_lag" label="Task 1: Write a query to calculate time between consecutive events for each worker" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="string" id="q7_1_flag" label="Task 2: Flag gaps >15 minutes" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="string" id="q7_1_total" label="Task 3: Calculate total break time per worker" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="string" id="q7_1_bonus" label="BONUS: Exclude JOB_END → JOB_START gaps (those are expected)" role="agent" required=false minLength=100 maxLength=3000 -->
<!-- /field -->

---

### Question 7.2: One Size Doesn't Fit All _.form.md_.form.md\*\*

_Different customers want different definitions of "fast mover." Customer A says top 60% of volume is "A-class", Customer B says top 50%. How would you make the classification rules configurable per customer?_

**Context:** ABC thresholds should be configurable per consignee.

```sql
-- Config table
| consignee | a_plus_threshold | a_threshold | b_threshold |
|-----------|------------------|-------------|-------------|
| DEMO      | 0.50             | 0.80        | 0.95        |
| ACME      | 0.60             | 0.85        | 0.97        |

-- Order stats (with cumulative_percent_rank already calculated)
| consignee | sku     | cumulative_percent_rank |
|-----------|---------|-------------------------|
| DEMO      | SKU-001 | 0.45                    |
| ACME      | SKU-002 | 0.55                    |
```

**Tasks:**

<!-- field kind="string" id="q7_2_query" label="Task 1: Write a query to assign ABC categories using the config thresholds" role="agent" required=true minLength=150 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q7_2_validate" label="Task 2: How would you validate that thresholds are properly ordered (a_plus < a < b)?" role="agent" required=true minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- field kind="string" id="q7_2_bonus" label="BONUS: Design a fallback strategy if a consignee has no config entry" role="agent" required=false minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- /group -->

<!-- group id="section_8" title="SECTION 8: Data Validation & Quality (Bonus - 10 points)" -->

## SECTION 8: Data Validation & Quality (Bonus)

### Question 8.1: Garbage In, Garbage Out _.form.md_.form.md

_Customers upload CSV files with assignment data, but the quality varies wildly, duplicates, negative quantities, malformed location codes. How would you validate the data before it corrupts your system?_

**Context:** Write quality checks for assignment imports.

**Rules:**

- `(consignee, sku, location_id)` must be unique
- `quantity` must be > 0
- `location_id` must match pattern `ABCD XX YY ZZ`
- `sku` must exist in item_master

**Tasks:**

<!-- field kind="string" id="q8_1_queries" label="Task 1: Write 4 separate validation queries (one per rule)" role="agent" required=true minLength=200 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q8_1_report" label="Task 2: Combine into a single report showing all violations" role="agent" required=true minLength=150 maxLength=4000 -->
<!-- /field -->

<!-- field kind="string" id="q8_1_bonus" label="BONUS: Design a 'quality score' (0-100) for each import" role="agent" required=false minLength=100 maxLength=2000 -->
<!-- /field -->

---

### Question 8.2: The Orphan Records _.form.md_.form.md\*

_Events are referencing jobs, SKUs, and locations that don't exist in the master tables. This breaks downstream reports. How would you find and report these broken references?_

**Context:** Events reference `job_id`, `sku`, and `location_id` from other tables.

**Tasks:**

<!-- field kind="string" id="q8_2_job" label="Task 1: Write a query to find events with invalid job_id (not in jobs table)" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="string" id="q8_2_sku" label="Task 2: Find events with invalid sku (not in item_master)" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="string" id="q8_2_location" label="Task 3: Find events with invalid location_id (not in locations table)" role="agent" required=true minLength=100 maxLength=3000 -->
<!-- /field -->

<!-- field kind="string" id="q8_2_bonus" label="BONUS: What's the trade-off between enforcing foreign keys vs. soft validation queries?" role="agent" required=false minLength=50 maxLength=1500 -->
<!-- /field -->

<!-- /group -->

<!-- group id="submission" title="Submission" -->

## Ready to Submit?

Please review your answers before submitting. Your responses will be emailed to the evaluation team for review.

**Scoring Information:**

- Target score for Senior role: 91+ points
- Core Questions: 100 points possible
- Bonus Questions: Up to 40 additional points
- Your answers will be manually graded
- Demonstrates mastery of SQL, data analysis, and problem-solving
- BONUS tasks are optional but expected for senior candidates

<!-- /group -->

<!-- /form -->
