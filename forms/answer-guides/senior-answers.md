# Senior Level Answer Guide

**Target Score:** 91+ points
**Duration:** 120-180 minutes
**Experience Level:** 5+ years

> **Note:** Sections 1-3 and Q6.1 share questions with the mid-level assessment. Refer to `mid-answers.md` for those answers. This guide focuses on senior-specific questions.

---

## SECTION 4: Window Functions & Sequence Analysis (20 points)

### Question 4.2: Fill in the Blanks

**Context:**
```sql
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

---

#### Task 1: Write fill-in query (8 pts)

**Sample Solution (LAST_VALUE with IGNORE NULLS):**
```sql
SELECT
  event_id,
  trace_id,
  time,
  scan_label,
  scan_code,
  LAST_VALUE(
    CASE WHEN scan_label = 'location' THEN scan_code ELSE NULL END
  ) IGNORE NULLS OVER (
    PARTITION BY trace_id
    ORDER BY time
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS current_location
FROM events
ORDER BY trace_id, time;
```

**Alternative (FIRST_VALUE looking backward):**
```sql
SELECT
  event_id,
  trace_id,
  time,
  scan_label,
  scan_code,
  FIRST_VALUE(
    CASE WHEN scan_label = 'location' THEN scan_code ELSE NULL END
  ) IGNORE NULLS OVER (
    PARTITION BY trace_id
    ORDER BY time DESC
    ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
  ) AS current_location
FROM events
ORDER BY trace_id, time;
-- Note: This actually looks forward in reverse order
```

**Key Concepts:**
- LAST_VALUE with IGNORE NULLS
- Window frame specification
- Gap-filling pattern

**Rubric:**
| Criteria | Points |
|----------|--------|
| LAST_VALUE or equivalent | 2 pts |
| IGNORE NULLS | 2 pts |
| Correct frame clause | 3 pts |
| Correct result | 1 pt |

---

#### Task 2: Explain how it works (6 pts)

**Expected Answer:**

**Row-by-row walkthrough:**

| Row | scan_label | Frame contents (locations only) | LAST_VALUE result |
|-----|------------|--------------------------------|-------------------|
| e1 | location | [ABCD 01 02] | ABCD 01 02 |
| e2 | item | [ABCD 01 02, NULL] | ABCD 01 02 (ignores NULL) |
| e3 | item | [ABCD 01 02, NULL, NULL] | ABCD 01 02 |
| e4 | location | [ABCD 01 02, NULL, NULL, ABCD 01 03] | ABCD 01 03 |
| e5 | item | [..., ABCD 01 03, NULL] | ABCD 01 03 |

**Why it works:**
1. The CASE expression produces the location code for location scans, NULL otherwise
2. `IGNORE NULLS` means we skip over the NULL values from item scans
3. `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` ensures we look at all previous rows
4. LAST_VALUE gets the most recent non-NULL location

**Rubric:**
| Criteria | Points |
|----------|--------|
| Explains IGNORE NULLS behavior | 2 pts |
| Explains frame clause | 2 pts |
| Clear step-by-step reasoning | 2 pts |

---

#### Task 3: Edge cases and gotchas (6 pts)

**Expected Answer:**

1. **First event is not a location:**
   - If the first scan in a trace is an item, `current_location` will be NULL
   - May need to filter these out or handle differently

2. **ROWS vs RANGE:**
   - `ROWS` is required here. The default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`
   - For LAST_VALUE specifically, default is often `RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` which would pick the LAST location in the entire partition!

3. **Multiple locations at same timestamp:**
   - If two location scans have identical timestamps, ordering is non-deterministic
   - May need secondary sort key (event_id)

4. **NULL trace_id:**
   - All NULL trace_ids would group together, mixing different workers/jobs

5. **Database support:**
   - Not all databases support `IGNORE NULLS` (MySQL doesn't)
   - May need workaround with subqueries or self-join

**Rubric:**
| Criteria | Points |
|----------|--------|
| Mentions NULL first location | 2 pts |
| Mentions ROWS vs RANGE issue | 2 pts |
| At least one other valid edge case | 2 pts |

---

#### BONUS: Alternative approach (5 pts)

**Self-Join Approach:**
```sql
WITH location_scans AS (
  SELECT trace_id, time, scan_code AS location
  FROM events
  WHERE scan_label = 'location'
)
SELECT
  e.event_id,
  e.trace_id,
  e.time,
  e.scan_label,
  e.scan_code,
  ls.location AS current_location
FROM events e
LEFT JOIN location_scans ls ON
  e.trace_id = ls.trace_id
  AND ls.time = (
    SELECT MAX(time)
    FROM location_scans ls2
    WHERE ls2.trace_id = e.trace_id
      AND ls2.time <= e.time
  );
```

**Performance comparison:**
- **Window function:** Single pass, O(n log n) with proper indexes
- **Self-join:** Multiple passes, correlated subquery can be O(n²)

**Window function is generally faster** for this use case.

---

## SECTION 5: Root Cause Analysis (25 points)

### Question 5.2: The Missing Pick

**Context:**
```sql
-- Events logged
| job_id | event_seq | event_type | location_id | item_id  | quantity |
|--------|-----------|------------|-------------|----------|----------|
| J-001  | 1         | JOB_START  | NULL        | NULL     | NULL     |
| J-001  | 2         | PICK       | ABCD 01 02  | SKU-111  | 1        |
| J-001  | 3         | PICK       | ABCD 01 03  | SKU-222  | 1        |
| J-001  | 4         | JOB_END    | PACKV-01    | NULL     | NULL     |

-- Expected picks
| job_id | item_id  | expected_quantity |
|--------|----------|-------------------|
| J-001  | SKU-111  | 1                 |
| J-001  | SKU-222  | 1                 |
| J-001  | SKU-333  | 1                 |
```

---

#### Task 1: Find missing picks (8 pts)

**Sample Solution:**
```sql
-- Using LEFT JOIN with NULL check
SELECT
  exp.job_id,
  exp.item_id,
  exp.expected_quantity
FROM expected_picks exp
LEFT JOIN events e ON
  exp.job_id = e.job_id
  AND exp.item_id = e.item_id
  AND e.event_type = 'PICK'
WHERE e.item_id IS NULL;
```

**Alternative using EXCEPT:**
```sql
SELECT job_id, item_id
FROM expected_picks
EXCEPT
SELECT job_id, item_id
FROM events
WHERE event_type = 'PICK';
```

**Alternative using NOT EXISTS:**
```sql
SELECT exp.job_id, exp.item_id, exp.expected_quantity
FROM expected_picks exp
WHERE NOT EXISTS (
  SELECT 1 FROM events e
  WHERE e.job_id = exp.job_id
    AND e.item_id = exp.item_id
    AND e.event_type = 'PICK'
);
```

**Rubric:**
| Criteria | Points |
|----------|--------|
| Correct join/set logic | 4 pts |
| Filters to PICK events | 2 pts |
| Returns expected columns | 2 pts |

---

#### Task 2: Find unexpected picks (8 pts)

**Sample Solution:**
```sql
SELECT
  e.job_id,
  e.item_id,
  e.quantity
FROM events e
LEFT JOIN expected_picks exp ON
  e.job_id = exp.job_id
  AND e.item_id = exp.item_id
WHERE e.event_type = 'PICK'
  AND exp.item_id IS NULL;
```

**Key insight:** This is the reverse of Task 1 - swap which table is the "left" side.

**Rubric:**
| Criteria | Points |
|----------|--------|
| Correct reverse logic | 4 pts |
| Filters to PICK events | 2 pts |
| Returns event details | 2 pts |

---

#### Task 3: Job completion rate (9 pts)

**Sample Solution:**
```sql
WITH actual_picks AS (
  SELECT
    job_id,
    item_id,
    SUM(quantity) AS picked_quantity
  FROM events
  WHERE event_type = 'PICK'
  GROUP BY job_id, item_id
),
expected_totals AS (
  SELECT
    job_id,
    COUNT(DISTINCT item_id) AS expected_items,
    SUM(expected_quantity) AS expected_total_qty
  FROM expected_picks
  GROUP BY job_id
),
actual_totals AS (
  SELECT
    job_id,
    COUNT(DISTINCT item_id) AS picked_items,
    COALESCE(SUM(picked_quantity), 0) AS picked_total_qty
  FROM actual_picks
  GROUP BY job_id
)
SELECT
  e.job_id,
  e.expected_items,
  COALESCE(a.picked_items, 0) AS picked_items,
  e.expected_total_qty,
  COALESCE(a.picked_total_qty, 0) AS picked_total_qty,
  ROUND(
    COALESCE(a.picked_items, 0) * 100.0 / NULLIF(e.expected_items, 0),
    2
  ) AS item_completion_pct,
  ROUND(
    COALESCE(a.picked_total_qty, 0) * 100.0 / NULLIF(e.expected_total_qty, 0),
    2
  ) AS qty_completion_pct
FROM expected_totals e
LEFT JOIN actual_totals a ON e.job_id = a.job_id;
```

**Expected Result for J-001:**
- Expected: 3 items, 3 units
- Actual: 2 items, 2 units
- Completion: 66.67%

**Rubric:**
| Criteria | Points |
|----------|--------|
| Aggregates expected correctly | 3 pts |
| Aggregates actual correctly | 3 pts |
| Calculates ratio correctly | 2 pts |
| Handles NULL/zero cases | 1 pt |

---

#### BONUS Part 1: Why wasn't SKU-333 picked? (3 pts)

All options are plausible:
- [x] **Item out of stock** - Physical stock depleted
- [x] **Location label damaged** - Couldn't scan to verify
- [x] **Picker missed** - Human error, skipped location
- [x] **Wrong allocation** - System error in pick planning
- [x] **Missing inventory** - Discrepancy between system and physical
- [x] **Scanner malfunction** - Scan didn't register
- [x] **Order modified** - Item removed after job creation

---

#### BONUS Part 2: Investigation approach (5 pts)

**Expected Answer:**

| Reason | How to Investigate |
|--------|-------------------|
| Out of stock | Check stock table for SKU-333 at allocated location at job time |
| Label damaged | Check if any location scan near allocated location + talk to picker |
| Picker missed | Check picker's scan sequence - did they scan nearby locations? |
| Wrong allocation | Compare allocation rules with actual location of SKU-333 |
| Missing inventory | Check inventory adjustment history for SKU-333 |
| Scanner issue | Check device logs for errors around job time, battery level |
| Order modified | Check order modification audit trail, timestamps vs job start |

---

## SECTION 6: Performance & Optimization (Bonus - 15 points)

### Question 6.2: The Row Explosion

**Context:**
```sql
SELECT a.*, s.quantity_available, i.uom, i.name
FROM assignment a
LEFT JOIN stock s ON a.sku = s.sku
LEFT JOIN item_master i ON a.sku = i.sku;

-- assignment: 1 row for SKU-001
-- stock: 2 rows for SKU-001 (LOC-A, LOC-B)
-- item_master: 2 rows for SKU-001 (job 100, 101)
```

---

#### Task 1: How many rows? (4 pts)

**Expected Answer:**
**4 rows** (1 × 2 × 2 = 4)

Each assignment row multiplies by matching rows in each joined table:
- 1 assignment row for SKU-001
- × 2 stock rows (LOC-A, LOC-B)
- × 2 item_master rows (job 100, 101)
- = 4 rows total

This is a **Cartesian product** because the joins create all combinations.

**Rubric:**
| Criteria | Points |
|----------|--------|
| Correct answer (4) | 2 pts |
| Explains multiplication | 2 pts |

---

#### Task 2: Fix the query (7 pts)

**Sample Solution:**
```sql
WITH latest_items AS (
  SELECT sku, uom, name
  FROM item_master
  WHERE import_job_id = (SELECT MAX(import_job_id) FROM item_master)
),
stock_by_assignment AS (
  SELECT
    a.consignee,
    a.sku,
    a.location_id AS assignment_location,
    COALESCE(s.quantity_available, 0) AS quantity_at_assignment_loc
  FROM assignment a
  LEFT JOIN stock s ON
    a.sku = s.sku
    AND a.location_id = s.location_id  -- Match on BOTH sku AND location
)
SELECT
  sba.consignee,
  sba.sku,
  sba.assignment_location,
  sba.quantity_at_assignment_loc,
  li.uom,
  li.name
FROM stock_by_assignment sba
LEFT JOIN latest_items li ON sba.sku = li.sku;
```

**Alternative (aggregate stock):**
```sql
WITH stock_totals AS (
  SELECT sku, SUM(quantity_available) AS total_stock
  FROM stock
  GROUP BY sku
),
latest_items AS (
  SELECT sku, uom, name
  FROM item_master
  WHERE import_job_id = (SELECT MAX(import_job_id) FROM item_master)
)
SELECT
  a.consignee,
  a.sku,
  a.location_id,
  st.total_stock,
  li.uom,
  li.name
FROM assignment a
LEFT JOIN stock_totals st ON a.sku = st.sku
LEFT JOIN latest_items li ON a.sku = li.sku;
```

**Rubric:**
| Criteria | Points |
|----------|--------|
| De-duplicates item_master | 3 pts |
| Handles stock correctly | 3 pts |
| Returns 1 row per assignment | 1 pt |

---

#### Task 3: General rule (4 pts)

**Expected Answer:**
**"Ensure each join produces at most one match per row from the left table."**

Before joining:
1. **Check cardinality** - Is the join 1:1, 1:N, or N:M?
2. **De-duplicate first** - If the right table has multiple rows per key, aggregate or filter to 1 row first
3. **Use CTEs** - Pre-compute unique/aggregated versions of tables
4. **Add join conditions** - More specific join keys prevent multiplication
5. **Test with small data** - Verify row counts before running on full dataset

**Red flag:** If `SELECT COUNT(*) FROM result` is much larger than `SELECT COUNT(*) FROM base_table`, you likely have a Cartesian product.

---

## SECTION 7: Practical Scenarios (Bonus - 15 points)

### Question 7.1: Where Did the Time Go?

---

#### Task 1: Time between events (5 pts)

```sql
SELECT
  worker_id,
  event_time,
  event_type,
  LAG(event_time) OVER (
    PARTITION BY worker_id
    ORDER BY event_time
  ) AS prev_event_time,
  event_time - LAG(event_time) OVER (
    PARTITION BY worker_id
    ORDER BY event_time
  ) AS time_gap
FROM events;
```

---

#### Task 2: Flag gaps >15 minutes (4 pts)

```sql
WITH event_gaps AS (
  SELECT
    worker_id,
    event_time,
    event_type,
    LAG(event_time) OVER (
      PARTITION BY worker_id
      ORDER BY event_time
    ) AS prev_event_time,
    EXTRACT(EPOCH FROM (
      event_time - LAG(event_time) OVER (
        PARTITION BY worker_id
        ORDER BY event_time
      )
    )) / 60 AS gap_minutes
  FROM events
)
SELECT *,
  CASE WHEN gap_minutes > 15 THEN 'BREAK' ELSE 'OK' END AS gap_flag
FROM event_gaps
WHERE gap_minutes > 15;
```

---

#### Task 3: Total break time per worker (4 pts)

```sql
WITH event_gaps AS (
  SELECT
    worker_id,
    EXTRACT(EPOCH FROM (
      event_time - LAG(event_time) OVER (
        PARTITION BY worker_id ORDER BY event_time
      )
    )) / 60 AS gap_minutes
  FROM events
)
SELECT
  worker_id,
  SUM(CASE WHEN gap_minutes > 15 THEN gap_minutes ELSE 0 END) AS total_break_minutes,
  COUNT(CASE WHEN gap_minutes > 15 THEN 1 END) AS break_count
FROM event_gaps
GROUP BY worker_id
ORDER BY total_break_minutes DESC;
```

---

#### BONUS: Exclude JOB_END → JOB_START (5 pts)

```sql
WITH event_gaps AS (
  SELECT
    worker_id,
    event_time,
    event_type,
    LAG(event_type) OVER (PARTITION BY worker_id ORDER BY event_time) AS prev_event_type,
    EXTRACT(EPOCH FROM (
      event_time - LAG(event_time) OVER (PARTITION BY worker_id ORDER BY event_time)
    )) / 60 AS gap_minutes
  FROM events
)
SELECT *
FROM event_gaps
WHERE gap_minutes > 15
  AND NOT (prev_event_type = 'JOB_END' AND event_type = 'JOB_START');
```

---

### Question 7.2: One Size Doesn't Fit All

---

#### Task 1: Configurable ABC (7 pts)

```sql
SELECT
  o.consignee,
  o.sku,
  o.cumulative_percent_rank,
  c.a_plus_threshold,
  c.a_threshold,
  c.b_threshold,
  CASE
    WHEN o.cumulative_percent_rank <= c.a_plus_threshold THEN 'A+'
    WHEN o.cumulative_percent_rank <= c.a_threshold THEN 'A'
    WHEN o.cumulative_percent_rank <= c.b_threshold THEN 'B'
    ELSE 'C'
  END AS abc_category
FROM order_stats o
JOIN abc_config c ON o.consignee = c.consignee;
```

---

#### Task 2: Validate thresholds (4 pts)

```sql
SELECT
  consignee,
  a_plus_threshold,
  a_threshold,
  b_threshold,
  CASE
    WHEN a_plus_threshold >= a_threshold THEN 'INVALID: a_plus >= a'
    WHEN a_threshold >= b_threshold THEN 'INVALID: a >= b'
    WHEN a_plus_threshold <= 0 OR a_plus_threshold > 1 THEN 'INVALID: a_plus out of range'
    WHEN b_threshold > 1 THEN 'INVALID: b > 1'
    ELSE 'VALID'
  END AS validation_status
FROM abc_config
WHERE a_plus_threshold >= a_threshold
   OR a_threshold >= b_threshold;
```

---

#### BONUS: Fallback strategy (4 pts)

```sql
WITH default_config AS (
  SELECT 0.50 AS a_plus, 0.80 AS a, 0.95 AS b
)
SELECT
  o.consignee,
  o.sku,
  o.cumulative_percent_rank,
  CASE
    WHEN o.cumulative_percent_rank <= COALESCE(c.a_plus_threshold, d.a_plus) THEN 'A+'
    WHEN o.cumulative_percent_rank <= COALESCE(c.a_threshold, d.a) THEN 'A'
    WHEN o.cumulative_percent_rank <= COALESCE(c.b_threshold, d.b) THEN 'B'
    ELSE 'C'
  END AS abc_category
FROM order_stats o
CROSS JOIN default_config d
LEFT JOIN abc_config c ON o.consignee = c.consignee;
```

---

## SECTION 8: Data Validation & Quality (Bonus - 10 points)

### Question 8.1: Garbage In, Garbage Out

---

#### Task 1: Four validation queries (6 pts)

**Rule 1: Unique composite key**
```sql
SELECT consignee, sku, location_id, COUNT(*) AS duplicate_count
FROM assignment_import
GROUP BY consignee, sku, location_id
HAVING COUNT(*) > 1;
```

**Rule 2: Quantity > 0**
```sql
SELECT *
FROM assignment_import
WHERE quantity <= 0 OR quantity IS NULL;
```

**Rule 3: Location format**
```sql
SELECT *
FROM assignment_import
WHERE NOT REGEXP_LIKE(location_id, '^[A-Z]{4} [0-9]{2} [0-9]{2} [0-9]{2}$');
-- Pattern: ABCD XX YY ZZ
```

**Rule 4: SKU exists**
```sql
SELECT ai.*
FROM assignment_import ai
LEFT JOIN item_master im ON ai.sku = im.sku
WHERE im.sku IS NULL;
```

---

#### Task 2: Combined report (4 pts)

```sql
WITH violations AS (
  SELECT
    consignee, sku, location_id, quantity,
    'DUPLICATE_KEY' AS violation_type
  FROM assignment_import
  GROUP BY consignee, sku, location_id, quantity
  HAVING COUNT(*) > 1

  UNION ALL

  SELECT consignee, sku, location_id, quantity,
    'INVALID_QUANTITY' AS violation_type
  FROM assignment_import
  WHERE quantity <= 0 OR quantity IS NULL

  UNION ALL

  SELECT consignee, sku, location_id, quantity,
    'INVALID_LOCATION_FORMAT' AS violation_type
  FROM assignment_import
  WHERE NOT REGEXP_LIKE(location_id, '^[A-Z]{4} [0-9]{2} [0-9]{2} [0-9]{2}$')

  UNION ALL

  SELECT ai.consignee, ai.sku, ai.location_id, ai.quantity,
    'UNKNOWN_SKU' AS violation_type
  FROM assignment_import ai
  LEFT JOIN item_master im ON ai.sku = im.sku
  WHERE im.sku IS NULL
)
SELECT * FROM violations
ORDER BY violation_type, consignee, sku;
```

---

#### BONUS: Quality score (5 pts)

```sql
WITH import_stats AS (
  SELECT
    COUNT(*) AS total_rows,
    SUM(CASE WHEN dup.consignee IS NOT NULL THEN 1 ELSE 0 END) AS dup_violations,
    SUM(CASE WHEN quantity <= 0 OR quantity IS NULL THEN 1 ELSE 0 END) AS qty_violations,
    SUM(CASE WHEN NOT REGEXP_LIKE(location_id, '^[A-Z]{4}.*') THEN 1 ELSE 0 END) AS loc_violations,
    SUM(CASE WHEN im.sku IS NULL THEN 1 ELSE 0 END) AS sku_violations
  FROM assignment_import ai
  LEFT JOIN item_master im ON ai.sku = im.sku
  LEFT JOIN (
    SELECT consignee, sku, location_id
    FROM assignment_import
    GROUP BY consignee, sku, location_id
    HAVING COUNT(*) > 1
  ) dup ON ai.consignee = dup.consignee AND ai.sku = dup.sku AND ai.location_id = dup.location_id
)
SELECT
  total_rows,
  dup_violations + qty_violations + loc_violations + sku_violations AS total_violations,
  ROUND(
    (1 - (dup_violations + qty_violations + loc_violations + sku_violations) * 1.0 / NULLIF(total_rows, 0)) * 100,
    2
  ) AS quality_score
FROM import_stats;
```

---

### Question 8.2: The Orphan Records

---

#### Task 1: Invalid job_id (3 pts)

```sql
SELECT e.*
FROM events e
LEFT JOIN jobs j ON e.job_id = j.job_id
WHERE j.job_id IS NULL
  AND e.job_id IS NOT NULL;
```

---

#### Task 2: Invalid sku (3 pts)

```sql
SELECT e.*
FROM events e
LEFT JOIN item_master im ON e.item_id = im.sku
WHERE im.sku IS NULL
  AND e.item_id IS NOT NULL
  AND e.event_type = 'PICK';  -- Only check SKU for pick events
```

---

#### Task 3: Invalid location_id (3 pts)

```sql
SELECT e.*
FROM events e
LEFT JOIN locations l ON e.location_id = l.location_id
WHERE l.location_id IS NULL
  AND e.location_id IS NOT NULL;
```

---

#### BONUS: FK vs soft validation trade-offs (5 pts)

**Foreign Key Constraints:**

Pros:
- Enforced at database level - cannot insert invalid data
- No separate validation queries needed
- Guaranteed referential integrity
- Better for OLTP systems

Cons:
- Rigid - blocks all inserts with missing references
- Can cause cascade failures during ETL
- Hard to load data out of order
- May need to disable/re-enable during bulk loads

**Soft Validation Queries:**

Pros:
- Flexible - can load data first, validate later
- Better for data warehouses/analytics
- Can report violations without blocking
- Easier to handle "known bad" data

Cons:
- Must remember to run validation
- Data can be inconsistent between checks
- More complex to maintain
- No automatic cleanup on delete

**Recommendation:** Use FK constraints for core transactional tables, soft validation for analytics/reporting tables that need flexibility.

---

## Grading Summary

| Section | Points | Type |
|---------|--------|------|
| Section 1-3: Core | 55 | Core |
| Section 4: Window Functions | 20 | Core |
| Section 5: Root Cause | 25 | Core |
| **Core Total** | **100** | |
| Section 6: Performance | 15 | Bonus |
| Section 7: Practical | 15 | Bonus |
| Section 8: Validation | 10 | Bonus |
| **Total Possible** | **140** | |

**Senior Passing Score:** 91+ points (91%+ on core, with bonus expected)
