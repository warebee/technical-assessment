# Answer Key - Sample Solutions

## Question 1.1: Identify the Deduplication Issue

### Task 1: What problem will occur?

**Expected Answer:**
The query will insert duplicate rows for `(consignee, sku, location_id)` combinations. In the sample data, `DEMO + SKU-001 + ABCD 01 02` appears twice with different quantities (100 and 150). This violates the uniqueness constraint and makes it unclear which quantity is correct.

**Red Flags in Answer:**

- Doesn't identify the duplicate key issue
- Focuses only on quantity differences
- Doesn't mention data integrity concerns

### Task 2: Write deduplication query

**Correct Solution:**

```sql
WITH deduplicated AS (
  SELECT consignee,
         sku,
         location_id,
         quantity,
         uom,
         ROW_NUMBER() OVER (
           PARTITION BY consignee, sku, location_id
           ORDER BY import_timestamp DESC
         ) AS row_num
  FROM raw_assignment_data
  WHERE import_date = CURRENT_DATE
)
SELECT consignee,
       sku,
       location_id,
       quantity,
       uom
FROM deduplicated
WHERE row_num = 1;
```

**Key Points to Evaluate:**

- ✅ Uses ROW_NUMBER() (not RANK or DENSE_RANK - common mistake)
- ✅ PARTITION BY includes ALL unique key columns (consignee, sku, location_id)
- ✅ ORDER BY uses import_timestamp DESC (latest first)
- ✅ Filters to row_num = 1

**Alternative Valid Solution:**

```sql
-- Using QUALIFY (Trino/Presto specific)
SELECT consignee,
       sku,
       location_id,
       quantity,
       uom
FROM raw_assignment_data
WHERE import_date = CURRENT_DATE
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY consignee, sku, location_id
  ORDER BY import_timestamp DESC
) = 1;
```

**Common Mistakes:**

- Using `DISTINCT` without deduplication logic (loses quantity info)
- Using `GROUP BY` with `MAX(quantity)` (doesn't necessarily get latest)
- Forgetting one of the key columns in PARTITION BY
- Using ASC instead of DESC in ORDER BY

### Task 3: Validation query

**Good Answer:**

```sql
-- Check for duplicates AFTER deduplication
SELECT consignee,
       sku,
       location_id,
       COUNT(*) as duplicate_count
FROM (
  -- Insert the deduplication query here
) deduplicated_data
GROUP BY consignee, sku, location_id
HAVING COUNT(*) > 1;

-- Should return 0 rows if successful
```

**Better Answer (shows more thorough thinking):**

```sql
-- Validation report
WITH raw_counts AS (
  SELECT COUNT(*) as total_raw_rows,
         COUNT(DISTINCT CONCAT(consignee, '-', sku, '-', location_id)) as unique_keys
  FROM raw_assignment_data
  WHERE import_date = CURRENT_DATE
),
deduplicated_counts AS (
  SELECT COUNT(*) as total_deduplicated_rows,
         COUNT(DISTINCT CONCAT(consignee, '-', sku, '-', location_id)) as unique_keys_after
  FROM (
    -- Insert deduplication query here
  )
)
SELECT r.total_raw_rows,
       r.unique_keys,
       d.total_deduplicated_rows,
       d.unique_keys_after,
       r.total_raw_rows - d.total_deduplicated_rows as rows_removed,
       -- Validation: deduplicated count should equal unique keys
       d.total_deduplicated_rows = d.unique_keys_after as is_truly_unique
FROM raw_counts r, deduplicated_counts d;
```

---

## Question 2.1: Left Join with Latest Data

### Task 1: Get latest import_job_id

**Correct Solutions:**

Option A (Subquery):

```sql
SELECT MAX(import_job_id) as latest_import_job_id
FROM item_master;
```

Option B (Window function):

```sql
SELECT DISTINCT import_job_id
FROM (
  SELECT import_job_id,
         ROW_NUMBER() OVER (ORDER BY import_job_id DESC) as rn
  FROM item_master
)
WHERE rn = 1;
```

**Evaluation:** Both correct, Option A is simpler and preferred for this use case.

### Task 2: Create latest_items CTE

**Correct Solution:**

```sql
WITH latest_items AS (
  SELECT sku,
         uom,
         name,
         ean
  FROM item_master
  WHERE import_job_id = (
    SELECT MAX(import_job_id)
    FROM item_master
  )
)
```

**Key Points:**

- ✅ Filters to only latest import
- ✅ Selects relevant columns (not SELECT \*)
- ✅ Uses subquery or separate CTE for max import_job_id

### Task 3: Join events to latest_items

**Correct Solution:**

```sql
WITH latest_items AS (
  SELECT sku, uom, name, ean
  FROM item_master
  WHERE import_job_id = (SELECT MAX(import_job_id) FROM item_master)
)
SELECT e.event_id,
       e.sku,
       e.scan_time,
       i.uom,
       i.name,
       i.ean
FROM events e
LEFT JOIN latest_items i ON e.sku = i.sku;
```

**Important:** Must be LEFT JOIN (not INNER JOIN) to preserve all events.

### Task 4: Identify missing SKUs

**Good Answer:**

```sql
SELECT e.event_id,
       e.sku,
       e.scan_time
FROM events e
LEFT JOIN latest_items i ON e.sku = i.sku
WHERE i.sku IS NULL;
```

**Better Answer (with counts and analysis):**

```sql
-- Summary of missing SKUs
SELECT e.sku,
       COUNT(*) as event_count,
       MIN(e.scan_time) as first_seen,
       MAX(e.scan_time) as last_seen
FROM events e
LEFT JOIN latest_items i ON e.sku = i.sku
WHERE i.sku IS NULL
GROUP BY e.sku
ORDER BY event_count DESC;

-- This helps prioritize which missing SKUs to investigate first
```

**Shows Strong Analytical Thinking:**

- Recognizes that NULL check on right-side table indicates missing match
- Aggregates to show impact (how many events affected)
- Orders by importance
- Includes time range for context

---

## Question 3.1: Basic ABC Classification

### Task 1: CASE statement for ABC

**Correct Solution:**

```sql
SELECT sku,
       order_line_count,
       quantity_ordered,
       cumulative_percent_rank,
       CASE
         WHEN cumulative_percent_rank BETWEEN 0 AND 0.5 THEN 'A+'
         WHEN cumulative_percent_rank BETWEEN 0.5 AND 0.8 THEN 'A'
         WHEN cumulative_percent_rank BETWEEN 0.8 AND 0.95 THEN 'B'
         ELSE 'C'
       END AS category_abc
FROM order_statistics;
```

**Alternative (using < and >=):**

```sql
CASE
  WHEN cumulative_percent_rank < 0.5 THEN 'A+'
  WHEN cumulative_percent_rank < 0.8 THEN 'A'
  WHEN cumulative_percent_rank < 0.95 THEN 'B'
  ELSE 'C'
END AS category_abc
```

**Key Points:**

- ✅ Correct threshold values (0.5, 0.8, 0.95)
- ✅ Proper BETWEEN logic (inclusive on both ends)
- ⚠️ Alternative with < is also correct but must ensure proper ordering

### Task 2: Business interpretation

**Expected Answer:**
`cumulative_percent_rank = 0.45` means this SKU, along with all higher-ranked SKUs, accounts for 45% of total order volume. In other words, the top items up to and including this SKU represent 45% of all orders.

**Strong Answer (shows deeper understanding):**
"This SKU is at the 45th percentile of cumulative order volume, meaning it's in the top-performing items. It falls into the A+ category, which represents the 'vital few' items that drive nearly half of all order activity. These should be prioritized for optimal placement in the warehouse (e.g., at the front of aisles, at ergonomic heights) to minimize travel time and maximize picking efficiency."

**Red Flags:**

- Confuses cumulative_percent_rank with percent_rank
- Says "45% of total SKUs" (wrong - it's about order volume, not SKU count)
- Cannot explain practical implications

### Task 3: Why cumulative vs regular percent_rank?

**Good Answer:**
Cumulative percent rank tells us "what portion of total volume have we accounted for so far?" which directly supports ABC analysis goals. We want to identify the small set of items that account for most of the volume (Pareto principle: 20% of SKUs = 80% of volume).

Regular percent_rank just tells us relative position but not accumulated impact.

**Strong Answer (with example):**

```
Using percent_rank:
SKU-001: percent_rank = 0.95  (top 5%)
SKU-002: percent_rank = 0.80  (top 20%)

But we don't know if SKU-001 + SKU-002 together = 30% of volume or 70% of volume.

Using cumulative_percent_rank:
SKU-001: cumulative = 0.45  (this SKU alone = 45% of volume)
SKU-002: cumulative = 0.70  (top 2 SKUs together = 70% of volume)

ABC classification needs the "together" view to make allocation decisions.
```

---

## Question 4.1: LAG and LEAD for Scan Sequences

### Task 1: LAG for previous location

**Correct Solution:**

```sql
SELECT event_id,
       trace_id,
       time_created,
       scan_label,
       scan_code,
       LAG(
         CASE
           WHEN scan_label = 'location' THEN scan_code
           ELSE NULL
         END
       ) IGNORE NULLS OVER (
         PARTITION BY trace_id
         ORDER BY time_created ASC
       ) AS previous_location
FROM scans;
```

**Critical Elements:**

- ✅ CASE statement to only capture location scans (not item scans)
- ✅ IGNORE NULLS - essential to skip over item scans
- ✅ PARTITION BY trace_id (events from different jobs shouldn't mix)
- ✅ ORDER BY time_created ASC

**Common Mistake (doesn't work correctly):**

```sql
-- WRONG - doesn't use IGNORE NULLS
LAG(scan_code) OVER (PARTITION BY trace_id ORDER BY time_created)
```

This would give you the previous scan regardless of type, so after an item scan you'd get another item as "previous_location".

### Task 2: LEAD for next item

**Correct Solution:**

```sql
SELECT event_id,
       trace_id,
       time_created,
       scan_label,
       scan_code,
       LEAD(
         CASE
           WHEN scan_label = 'item' THEN scan_code
           ELSE NULL
         END
       ) IGNORE NULLS OVER (
         PARTITION BY trace_id
         ORDER BY time_created ASC
       ) AS next_item
FROM scans;
```

**Same principles as LAG, but looking forward.**

### Task 3: Find orphaned items

**Good Solution:**

```sql
WITH scans_with_context AS (
  SELECT event_id,
         trace_id,
         scan_label,
         scan_code,
         LAG(
           CASE WHEN scan_label = 'location' THEN scan_code ELSE NULL END
         ) IGNORE NULLS OVER (PARTITION BY trace_id ORDER BY time_created) AS previous_location
  FROM scans
)
SELECT event_id,
       trace_id,
       scan_code as orphaned_item
FROM scans_with_context
WHERE scan_label = 'item'
  AND previous_location IS NULL;
```

**Strong Solution (with business context):**

```sql
WITH scans_with_context AS (
  -- Same as above
)
SELECT trace_id,
       COUNT(*) as orphaned_item_count,
       ARRAY_AGG(scan_code) as orphaned_items,
       MIN(event_id) as first_orphaned_event
FROM scans_with_context
WHERE scan_label = 'item'
  AND previous_location IS NULL
GROUP BY trace_id
ORDER BY orphaned_item_count DESC;
```

**Evaluation:**

- Shows aggregation thinking (how many affected?)
- Uses ARRAY_AGG for easy debugging
- Groups by trace_id to see which jobs are problematic

### Task 4 (BONUS): Time gap calculation

**Strong Solution:**

```sql
WITH scans_with_context AS (
  SELECT event_id,
         trace_id,
         time_created,
         scan_label,
         scan_code,
         LAG(time_created) OVER (
           PARTITION BY trace_id
           ORDER BY time_created
         ) AS previous_time,
         LAG(scan_label) OVER (
           PARTITION BY trace_id
           ORDER BY time_created
         ) AS previous_scan_label
  FROM scans
),
time_gaps AS (
  SELECT event_id,
         trace_id,
         scan_label,
         scan_code,
         previous_scan_label,
         (time_created - previous_time) / 1000.0 AS gap_seconds
  FROM scans_with_context
)
SELECT event_id,
       trace_id,
       scan_code,
       gap_seconds,
       gap_seconds > 30 AS is_gap_excessive
FROM time_gaps
WHERE scan_label = 'item'
  AND previous_scan_label = 'location'
ORDER BY gap_seconds DESC;
```

**Key Points:**

- Calculates time difference in seconds (assuming milliseconds input)
- Filters to location→item transitions specifically
- Flags excessive gaps
- Orders by worst offenders first

---

## Question 5.1: Diagnose Allocation Mismatch

### Task 1: SKU-001 diagnosis

**Expected Reasoning:**
Possible reasons only 80 of 100 units allocated despite 100 available:

1. **Location-level restrictions**: One location might be blocked/restricted
2. **Allocation rules**: Business rules might limit how much comes from a single location
3. **UOM mismatch**: Stock in one UOM, requested in another, conversion issues
4. **Reserved stock**: 20 units might be reserved for another order
5. **Rounding**: If allocation works in full pallets/boxes, remainder might be too small

**Strong Answer (systematic approach):**
"First, I'd check if both locations (LOC-A and LOC-B) have status='available' in the location master. Then I'd verify if there's an allocation rule limiting picks from a single location to 50 units. Next, I'd check for UOM conversion issues - if the order requested in BOX but stock is in PC, conversion might be incorrect. Finally, I'd look for any reservations or holds on the 20 unallocated units."

### Task 2: SKU-003 root causes

**Expected Answers (at least 3):**

1. Location LOC-D is marked as blocked/unavailable
2. Item-location assignment missing (SKU-003 not mapped to LOC-D in assignment table)
3. Allocation rule excludes this location (e.g., "replenishment zone only")
4. UOM mismatch (requested BOX, available in PC, no conversion rule)
5. Location type incompatible with process type
6. Consignee restriction (DEMO customer cannot pick from LOC-D)

### Task 3: Diagnostic join query

**Good Solution:**

```sql
SELECT ar.sku,
       ar.to_allocate_quantity,
       ar.allocated_quantity,
       ar.unallocated_quantity,
       ar.unallocated_reason,
       SUM(s.quantity_available) as total_stock,
       COUNT(DISTINCT s.location_id) as stock_location_count,
       ARRAY_AGG(s.location_id) as stock_locations
FROM allocation_results ar
LEFT JOIN stock s ON ar.sku = s.sku AND s.quantity_available > 0
WHERE ar.unallocated_quantity > 0
GROUP BY ar.sku, ar.to_allocate_quantity, ar.allocated_quantity,
         ar.unallocated_quantity, ar.unallocated_reason
ORDER BY ar.unallocated_quantity DESC;
```

**Strong Solution (multi-dimensional analysis):**

```sql
WITH allocation_vs_stock AS (
  SELECT ar.sku,
         ar.to_allocate_quantity,
         ar.allocated_quantity,
         ar.unallocated_quantity,
         ar.unallocated_reason,
         COALESCE(SUM(s.quantity_available), 0) as total_stock,
         COALESCE(SUM(
           CASE WHEN l.status = 'available' THEN s.quantity_available ELSE 0 END
         ), 0) as available_stock,
         COUNT(DISTINCT s.location_id) as stock_locations,
         COUNT(DISTINCT CASE WHEN l.status = 'available' THEN s.location_id END) as available_locations
  FROM allocation_results ar
  LEFT JOIN stock s ON ar.sku = s.sku
  LEFT JOIN locations l ON s.location_id = l.location_id
  WHERE ar.unallocated_quantity > 0
  GROUP BY ar.sku, ar.to_allocate_quantity, ar.allocated_quantity,
           ar.unallocated_quantity, ar.unallocated_reason
)
SELECT *,
       CASE
         WHEN total_stock = 0 THEN 'No stock exists'
         WHEN available_stock = 0 THEN 'Stock exists but locations blocked'
         WHEN available_stock < unallocated_quantity THEN 'Insufficient available stock'
         WHEN available_stock >= unallocated_quantity THEN 'Stock available - check rules/assignments'
         ELSE 'Unknown'
       END AS diagnosis
FROM allocation_vs_stock
ORDER BY unallocated_quantity DESC;
```

**Evaluation Criteria:**

- ✅ Joins allocation results with stock data
- ✅ Includes location status checks
- ✅ Aggregates to show totals vs allocated
- \* Provides automated diagnosis/categorization
- \* Considers multiple failure modes

---

## Evaluation Tips

### What Makes a Strong Candidate

1. **Writes working SQL first, optimizes second**
2. **Explains reasoning** ("I used LEFT JOIN because...")
3. **Considers edge cases** (NULL handling, empty sets, case sensitivity)
4. **Thinks like a debugger** (validation queries, diagnostic reports)
5. **Shows business awareness** (relates technical decisions to warehouse operations)

### Red Flags

1. Cannot explain why they chose a specific approach
2. Ignores edge cases (no NULL handling)
3. Over-engineers simple solutions
4. Copy-pastes without understanding
5. Cannot troubleshoot when query doesn't work

### Bonus Points

1. Writes multiple solutions and compares trade-offs
2. Includes validation/testing queries
3. Adds helpful comments in SQL
4. Considers performance implications
5. Relates back to real-world warehouse scenarios
