# Implementation Role Assessment Questions

## Overview

This assessment evaluates candidates on:

- Problem-solving and critical thinking
- Data structure understanding
- Root cause analysis
- Basic data analytics (ABC analysis, statistics)
- Data quality and deduplication strategies
- SQL query optimization and joins

---

## SECTION 1: Data Quality & Deduplication (Core)

### Question 1.1: Identify the Deduplication Issue \*

**Scenario:** You're importing assignment data where `(consignee, sku, location_id)` must be unique.

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

1. What problem will occur with this query?
2. Write a query using `ROW_NUMBER()` to deduplicate, keeping the latest record
3. How would you validate the deduplication worked correctly?

**Expected Skills:**

- Understanding of PARTITION BY and ORDER BY
- Data quality awareness
- Testing/validation thinking

---

### Question 1.2: Multi-Column Deduplication Strategy _.form.md_.form.md

**Scenario:** You have event data with duplicate `event_id` values due to retries.

```sql
-- Sample data
| event_id | time_created    | time_received   | device_serial | scan_code |
|----------|-----------------|-----------------|---------------|-----------|
| evt-001  | 1706356800000   | 1706356805000   | GLOVE-123     | LOC-001   |
| evt-001  | 1706356800000   | 1706356810000   | GLOVE-123     | LOC-001   |
| evt-002  | 1706356820000   | 1706356825000   | GLOVE-456     | ITEM-789  |
```

**Tasks:**

1. Explain why taking the latest `time_received` makes sense for deduplication
2. Write a CTE to deduplicate by `event_id`, keeping the latest `time_received`
3. What would happen if you used `time_created` instead? When might that be appropriate?
4. **BONUS:** How would you handle cases where `time_received` is NULL?

**Expected Skills:**

- Critical thinking about timestamp selection
- CTE usage
- Edge case handling

---

## SECTION 2: Data Joins & Enrichment (Core)

### Question 2.1: Left Join with Latest Data _.form.md_.form.md

**Scenario:** You need to enrich scan events with item master data, but only use the latest import.

```sql
-- Tables available:
-- events: event_id, sku, scan_time
-- item_master: import_job_id, sku, uom, name, ean (multiple imports exist)
```

**Tasks:**

1. Write a query to get the latest `import_job_id` from `item_master`
2. Create a CTE called `latest_items` that filters to only the latest import
3. Join events to `latest_items` on SKU
4. What happens if an event has a SKU not in the latest import? How would you identify these?

**Expected Skills:**

- Subquery usage
- LEFT JOIN understanding
- Data completeness awareness

---

### Question 2.2: Complex Join with Multiple Lookups _.form.md_.form.md\*

**Scenario:** Events can scan either EAN codes OR SKU codes. You need to enrich with item data.

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

1. Write a join strategy that matches:
   - When `scan_type = 'ean'` → match on `item_master.ean`
   - When `scan_type = 'sku'` → match on `item_master.sku`
2. What's the trade-off between using CASE in the join vs. UNION of two queries?
3. **BONUS:** How would you handle case sensitivity differences (e.g., "sku-12345" vs "SKU-12345")?

**Expected Skills:**

- Conditional join logic
- UNION vs CASE trade-offs
- String normalization

---

## SECTION 3: ABC Analysis & Statistics (Core)

### Question 3.1: Basic ABC Classification \*

**Scenario:** Classify items by order frequency using the 50-80-95 rule.

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

1. Write a CASE statement to assign ABC categories:
   - A+: 0-50% cumulative
   - A: 50-80% cumulative
   - B: 80-95% cumulative
   - C: 95-100% cumulative
2. What does `cumulative_percent_rank = 0.45` mean in business terms?
3. Why might we use `cumulative_percent_rank` instead of `percent_rank` for ABC?

**Expected Skills:**

- Understanding of Pareto principle
- CASE statement usage
- Business logic interpretation

---

### Question 3.2: ABC Analysis with PARTITION BY _.form.md_.form.md

**Scenario:** Calculate ABC per consignee (different customers have different popular items).

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

1. Write a query to calculate:
   - `percent_rank_per_consignee` (within each consignee)
   - `cumulative_percent_rank_per_consignee`
2. Why would SKU-001 be "A+" for DEMO but "C" for ACME?
3. **BONUS:** Write a query to compare global ABC vs per-consignee ABC - find items where the classification differs by 2+ categories

**Expected Skills:**

- Window functions with PARTITION BY
- Multi-tenant data patterns
- Analytical comparison logic

---

## SECTION 4: Window Functions & Sequence Analysis (Core)

### Question 4.1: LAG and LEAD for Scan Sequences _.form.md_.form.md

**Scenario:** Track location→item scan sequences to validate pick flow.

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

1. Use `LAG()` to capture the previous location for each item scan
2. Use `LEAD()` to capture the next item after each location scan
3. Write a query to find "orphaned items" (items without a preceding location scan)
4. **BONUS:** Calculate the time gap between location scan and item scan - flag if >30 seconds

**Expected Skills:**

- LAG/LEAD with PARTITION BY and ORDER BY
- IGNORE NULLS clause
- Data validation logic

---

### Question 4.2: LAST*VALUE with Frame Specification *.form.md\_.form.md\*

**Scenario:** Propagate the last scanned location to all subsequent events (until a new location is scanned).

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

1. Write a query using `LAST_VALUE()` with proper frame specification
2. Why is `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` necessary?
3. What would happen with `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`?
4. **BONUS:** Rewrite using a self-join instead of LAST_VALUE - which performs better?

**Expected Skills:**

- Advanced window function frames
- Performance considerations
- Alternative approaches

---

## SECTION 5: Root Cause Analysis (Core)

### Question 5.1: Diagnose Allocation Mismatch _.form.md_.form.md

**Scenario:** Allocation results show incorrect quantities.

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

1. SKU-001: Why might only 80 units be allocated when 100 are in stock?
2. SKU-003: Stock exists but nothing allocated. List 3 possible root causes.
3. Write a diagnostic query to join allocation results with stock to identify mismatches
4. **BONUS:** How would you detect if the allocation engine is preferring certain locations incorrectly?

**Expected Skills:**

- Data investigation approach
- Join analysis for diagnostics
- Hypothesis generation

---

### Question 5.2: Event Sequence Validation _.form.md_.form.md\*

**Scenario:** Users report "missing items" in their pick jobs.

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

1. Write a query to find missing picks (expected but not in events)
2. Write a query to find unexpected picks (in events but not expected)
3. Calculate the job completion rate: `actual_picks / expected_picks`
4. **BONUS:** What are 5 possible reasons SKU-333 wasn't picked? How would you investigate each?

**Expected Skills:**

- Set operations (EXCEPT, NOT IN, LEFT JOIN with NULL check)
- Data reconciliation
- Systematic troubleshooting

---

## SECTION 6: Performance & Optimization (Bonus)

### Question 6.1: Optimize Nested Subqueries _.form.md_.form.md\*

**Scenario:** This query is slow on large datasets.

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

1. Rewrite using CTEs and JOINs instead of subqueries
2. Explain why the rewritten version performs better
3. **BONUS:** Add proper indexes - which columns would you index?

**Expected Skills:**

- Query optimization awareness
- CTE refactoring
- Index strategy (bonus)

---

### Question 6.2: Avoid Cartesian Product _.form.md_.form.md\*

**Scenario:** This query returns incorrect results (too many rows).

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

1. How many rows will this query return? Why?
2. Fix the query to return only 1 row per assignment
3. What's the general rule to avoid Cartesian products in multi-table joins?

**Expected Skills:**

- Understanding of join multiplication
- Deduplication before joins
- Data modeling awareness

---

## SECTION 7: Practical Scenarios (Bonus/Advanced)

### Question 7.1: Time-Series Gap Detection _.form.md_.form.md\*

**Scenario:** Detect when workers take breaks >15 minutes between scans.

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

1. Use LAG() to calculate time between consecutive events
2. Flag gaps >15 minutes
3. Calculate total break time per worker
4. **BONUS:** Exclude JOB_END → JOB_START gaps (those are expected)

---

### Question 7.2: Dynamic ABC Thresholds _.form.md_.form.md\*\*

**Scenario:** ABC thresholds should be configurable per consignee.

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

1. Write a query to assign ABC categories using the config thresholds
2. How would you validate that thresholds are properly ordered (a_plus < a < b)?
3. **BONUS:** Design a fallback strategy if a consignee has no config entry

---

## SECTION 8: Data Validation & Quality (Bonus)

### Question 8.1: Detect Data Anomalies _.form.md_.form.md

**Scenario:** Write quality checks for assignment imports.

**Rules:**

- `(consignee, sku, location_id)` must be unique
- `quantity` must be > 0
- `location_id` must match pattern `ABCD XX YY ZZ`
- `sku` must exist in item_master

**Tasks:**

1. Write 4 separate validation queries (one per rule)
2. Combine into a single report showing all violations
3. **BONUS:** Design a "quality score" (0-100) for each import

---

### Question 8.2: Referential Integrity Check _.form.md_.form.md\*

**Scenario:** Events reference `job_id`, `sku`, and `location_id` from other tables.

**Tasks:**

1. Write a query to find events with invalid `job_id` (not in jobs table)
2. Find events with invalid `sku` (not in item_master)
3. Find events with invalid `location_id` (not in locations table)
4. **BONUS:** What's the trade-off between enforcing foreign keys vs. soft validation queries?

---

## Scoring Rubric

### Core Questions (Required)

- Section 1: 20 points
- Section 2: 20 points
- Section 3: 15 points
- Section 4: 20 points
- Section 5: 25 points
  **Total Core: 100 points**

### Bonus Questions (Optional)

- Section 6: 15 points
- Section 7: 15 points
- Section 8: 10 points
  **Total Bonus: 40 points**

### Evaluation Criteria

- **SQL Correctness** (40%): Does the query run and return correct results?
- **Approach & Logic** (30%): Is the solution well-structured and logical?
- **Edge Case Handling** (15%): Does the solution handle NULL, empty sets, etc.?
- **Explanation Quality** (15%): Can the candidate explain their reasoning?

### Passing Scores

- **Junior Implementation**: 60-75 points (core only)
- **Mid-Level Implementation**: 76-90 points (core + some bonus)
- **Senior Implementation**: 91+ points (core + most bonus)

---

## Answer Key Notes

_Provide detailed answer keys separately with:_

- Complete SQL solutions
- Explanation of key concepts
- Common mistakes to watch for
- Alternative valid approaches
- Performance considerations
