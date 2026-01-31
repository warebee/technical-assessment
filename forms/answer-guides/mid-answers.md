# Mid-Level Answer Guide

**Target Score:** 76-90 points
**Duration:** 90-120 minutes
**Experience Level:** 2-5 years

---

## SECTION 1: Data Quality & Deduplication (20 points)

### Question 1.2: The Retry Storm

**Context:**
```sql
| event_id | time_created    | time_received   | device_serial | scan_code |
|----------|-----------------|-----------------|---------------|-----------|
| evt-001  | 1706356800000   | 1706356805000   | GLOVE-123     | LOC-001   |
| evt-001  | 1706356800000   | 1706356810000   | GLOVE-123     | LOC-001   |
| evt-002  | 1706356820000   | 1706356825000   | GLOVE-456     | ITEM-789  |
```

---

#### Task 1: Why use time_received for deduplication? (5 pts)

**Expected Answer:**
`time_received` is the server timestamp when the event was stored. For deduplication, we want the latest _received_ record because:

1. **time_created is identical** - All retries of the same event have the same `time_created` (when the scan actually happened on the device)
2. **time_received differs** - Each retry attempt has a different server timestamp
3. **Latest = most complete** - The last successful transmission likely has the most complete/accurate server-side metadata

Using `time_created` would result in arbitrary selection (all duplicates have the same value).

**Key Concepts:**
- Device timestamp vs server timestamp
- Retry semantics
- Deduplication ordering

**Rubric:**
| Criteria | Points |
|----------|--------|
| Explains time_created is same | 2 pts |
| Explains time_received differs | 2 pts |
| Justifies "latest" choice | 1 pt |

---

#### Task 2: Write deduplication query (10 pts)

**Sample Solution:**
```sql
WITH ranked_events AS (
  SELECT
    event_id,
    time_created,
    time_received,
    device_serial,
    scan_code,
    ROW_NUMBER() OVER (
      PARTITION BY event_id
      ORDER BY time_received DESC
    ) AS rn
  FROM raw_events
)
SELECT
  event_id,
  time_created,
  time_received,
  device_serial,
  scan_code
FROM ranked_events
WHERE rn = 1;
```

**Key Concepts:**
- ROW_NUMBER() for deduplication
- PARTITION BY event_id (the unique identifier)
- ORDER BY time_received DESC (latest first)

**Rubric:**
| Criteria | Points |
|----------|--------|
| CTE structure | 2 pts |
| ROW_NUMBER() | 2 pts |
| PARTITION BY event_id | 3 pts |
| ORDER BY time_received DESC | 2 pts |
| WHERE rn = 1 | 1 pt |

**Common Mistakes:**
- Partitioning by wrong columns (device_serial, scan_code)
- Using RANK() (could return multiple rows on ties)
- Forgetting DESC

---

#### Task 3: time_created vs time_received trade-offs (5 pts)

**Expected Answer:**
If you used `time_created` instead:
- All duplicate rows have the **same** time_created (the original scan time)
- ROW_NUMBER would pick an arbitrary row (non-deterministic)
- This is a **bug** - you'd get random results

**When time_created would be appropriate:**
- Ordering events chronologically (for sequence analysis)
- Finding the actual time an event occurred
- Calculating time between events on the same device
- When there are no duplicates (clean data)

**Rubric:**
| Criteria | Points |
|----------|--------|
| Explains time_created is same for dupes | 2 pts |
| Identifies non-deterministic behavior | 2 pts |
| Valid use case for time_created | 1 pt |

---

#### BONUS: Handle NULL time_received (5 pts)

**Sample Solution:**
```sql
ROW_NUMBER() OVER (
  PARTITION BY event_id
  ORDER BY
    CASE WHEN time_received IS NULL THEN 1 ELSE 0 END,  -- NULLs last
    time_received DESC
) AS rn
```

OR use COALESCE:
```sql
ORDER BY COALESCE(time_received, 0) DESC
-- Note: This assumes time_received=0 is older than any valid timestamp
```

**Better approach:**
```sql
ORDER BY time_received DESC NULLS LAST
```

**Key Concept:** NULL values sort differently across databases. Being explicit with NULLS LAST ensures consistent behavior.

---

## SECTION 2: Data Joins & Enrichment (20 points)

### Question 2.2: The Barcode Mix-Up

**Context:**
```sql
-- Events
| event_id | scan_type | scan_code      |
|----------|-----------|----------------|
| evt-001  | ean       | 4006209532584  |
| evt-002  | sku       | SKU-12345      |

-- Item master
| sku       | ean           | uom | name     |
|-----------|---------------|-----|----------|
| SKU-12345 | 4006209532584 | PC  | Widget A |
```

---

#### Task 1: Write conditional join (12 pts)

**Sample Solution (CASE in JOIN):**
```sql
SELECT
  e.event_id,
  e.scan_type,
  e.scan_code,
  i.sku,
  i.name,
  i.uom
FROM events e
LEFT JOIN item_master i ON
  CASE
    WHEN e.scan_type = 'ean' THEN e.scan_code = i.ean
    WHEN e.scan_type = 'sku' THEN e.scan_code = i.sku
    ELSE FALSE
  END;
```

**Alternative (OR conditions):**
```sql
SELECT
  e.event_id,
  e.scan_type,
  e.scan_code,
  i.sku,
  i.name,
  i.uom
FROM events e
LEFT JOIN item_master i ON
  (e.scan_type = 'ean' AND e.scan_code = i.ean)
  OR
  (e.scan_type = 'sku' AND e.scan_code = i.sku);
```

**Key Concepts:**
- Conditional join logic
- CASE in ON clause
- OR-based multi-condition join

**Rubric:**
| Criteria | Points |
|----------|--------|
| Correct join structure | 3 pts |
| Handles scan_type='ean' case | 3 pts |
| Handles scan_type='sku' case | 3 pts |
| Uses LEFT JOIN (preserves unmatched) | 3 pts |

---

#### Task 2: Alternative approaches & trade-offs (8 pts)

**Expected Answer:**

**Approach 1: CASE in JOIN (shown above)**
- Pros: Single query, elegant
- Cons: May not use indexes efficiently, harder to optimize

**Approach 2: UNION of two queries**
```sql
SELECT e.*, i.sku, i.name, i.uom
FROM events e
JOIN item_master i ON e.scan_code = i.ean
WHERE e.scan_type = 'ean'

UNION ALL

SELECT e.*, i.sku, i.name, i.uom
FROM events e
JOIN item_master i ON e.scan_code = i.sku
WHERE e.scan_type = 'sku';
```
- Pros: Can use indexes on i.ean and i.sku separately
- Cons: Two scans of events table, more code

**Approach 3: Pre-compute a lookup column**
```sql
-- Add a normalized_code column to item_master
-- that contains either SKU or EAN as needed
```
- Pros: Simplifies query, best performance
- Cons: Requires schema change, data maintenance

**Rubric:**
| Criteria | Points |
|----------|--------|
| Describes 2+ approaches | 3 pts |
| Explains performance trade-offs | 3 pts |
| Mentions index implications | 2 pts |

---

#### BONUS: Handle case sensitivity (5 pts)

**Sample Solution:**
```sql
LEFT JOIN item_master i ON
  CASE
    WHEN e.scan_type = 'ean' THEN UPPER(e.scan_code) = UPPER(i.ean)
    WHEN e.scan_type = 'sku' THEN UPPER(e.scan_code) = UPPER(i.sku)
    ELSE FALSE
  END;
```

**Better (for performance):**
```sql
-- Store normalized (uppercase) values in the table
-- Or create functional indexes on UPPER(sku), UPPER(ean)
```

---

## SECTION 3: ABC Analysis & Statistics (15 points)

### Question 3.2: The Multi-Tenant Popularity Contest

**Context:**
```sql
| consignee | sku     | quantity_ordered |
|-----------|---------|------------------|
| DEMO      | SKU-001 | 10000            |
| DEMO      | SKU-002 | 5000             |
| ACME      | SKU-001 | 500              |
| ACME      | SKU-002 | 8000             |
```

---

#### Task 1: Write per-consignee ranking query (8 pts)

**Sample Solution:**
```sql
WITH consignee_totals AS (
  SELECT
    consignee,
    SUM(quantity_ordered) AS total_qty
  FROM orders
  GROUP BY consignee
),
ranked_items AS (
  SELECT
    o.consignee,
    o.sku,
    o.quantity_ordered,
    o.quantity_ordered * 1.0 / ct.total_qty AS pct_of_total,
    SUM(o.quantity_ordered * 1.0 / ct.total_qty) OVER (
      PARTITION BY o.consignee
      ORDER BY o.quantity_ordered DESC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_pct,
    ROW_NUMBER() OVER (
      PARTITION BY o.consignee
      ORDER BY o.quantity_ordered DESC
    ) AS rank_within_consignee
  FROM orders o
  JOIN consignee_totals ct ON o.consignee = ct.consignee
)
SELECT
  consignee,
  sku,
  quantity_ordered,
  cumulative_pct,
  CASE
    WHEN cumulative_pct <= 0.50 THEN 'A+'
    WHEN cumulative_pct <= 0.80 THEN 'A'
    WHEN cumulative_pct <= 0.95 THEN 'B'
    ELSE 'C'
  END AS abc_category
FROM ranked_items
ORDER BY consignee, cumulative_pct;
```

**Key Concepts:**
- PARTITION BY consignee for separate rankings
- Cumulative sum with window function
- ROW_NUMBER for tie-breaking

**Rubric:**
| Criteria | Points |
|----------|--------|
| PARTITION BY consignee | 3 pts |
| Cumulative percentage calculation | 3 pts |
| ABC CASE statement | 2 pts |

---

#### Task 2: Why SKU-001 differs between consignees? (4 pts)

**Expected Answer:**
For DEMO: SKU-001 has 10,000 units (67% of DEMO's 15,000 total) → **A+**
For ACME: SKU-001 has 500 units (6% of ACME's 8,500 total) → **C**

The same SKU has different velocity relative to each customer's total activity. ABC classification is about **relative importance**, not absolute volume.

**Rubric:**
| Criteria | Points |
|----------|--------|
| Calculates percentages | 2 pts |
| Explains relative nature | 2 pts |

---

#### BONUS: Compare global vs per-consignee ABC (5 pts)

**Sample Solution:**
```sql
WITH global_abc AS (
  SELECT sku,
    CASE
      WHEN SUM(quantity_ordered) OVER (ORDER BY quantity_ordered DESC
        ROWS UNBOUNDED PRECEDING) * 1.0 /
        SUM(quantity_ordered) OVER () <= 0.50 THEN 1  -- A+
      WHEN ... <= 0.80 THEN 2  -- A
      WHEN ... <= 0.95 THEN 3  -- B
      ELSE 4  -- C
    END AS global_category_num
  FROM orders
  GROUP BY sku
),
consignee_abc AS (
  -- Similar but with PARTITION BY consignee
  ...
)
SELECT
  g.sku,
  c.consignee,
  g.global_category_num,
  c.consignee_category_num,
  ABS(g.global_category_num - c.consignee_category_num) AS category_diff
FROM global_abc g
JOIN consignee_abc c ON g.sku = c.sku
WHERE ABS(g.global_category_num - c.consignee_category_num) >= 2;
```

---

## SECTION 5: Root Cause Analysis (25 points)

### Question 5.1: The Phantom Stock

---

#### Task 1: SKU-001 - Why only 80 allocated? (7 pts)

**Expected Answer:**
Stock shows: LOC-A (50) + LOC-B (50) = 100 units
Allocated: 80 units
Missing: 20 units

Possible reasons:
1. **Already allocated/reserved** - Some units reserved for other orders
2. **Partial availability** - One location may be blocked/unavailable
3. **UOM conversion** - 50 + 50 = 100 base units, but order needs 100 in different UOM
4. **Min pick quantity** - Location requires minimum pick that leaves remainder
5. **Zone restriction** - Order can only pull from certain zones, limiting available qty

**Rubric:**
| Criteria | Points |
|----------|--------|
| Identifies math (100 vs 80) | 2 pts |
| Provides 3+ valid reasons | 3 pts |
| Reasons are specific/actionable | 2 pts |

---

#### Task 2: SKU-003 - Select root causes (8 pts)

**All 6 options are valid root causes:**

- [x] **Location marked as blocked/unavailable** - LOC-D may be in maintenance or blocked
- [x] **Item-location assignment missing** - No assignment record linking SKU-003 to LOC-D
- [x] **Allocation rule excludes this location type** - LOC-D might be bulk storage, order needs pick face
- [x] **UOM mismatch** - Stock in pallets, order needs eaches, no conversion
- [x] **Location type incompatible with process type** - Outbound can't pull from receiving dock
- [x] **Consignee restriction** - Stock belongs to different customer

**Rubric:**
| Criteria | Points |
|----------|--------|
| Selects 3+ valid causes | 5 pts |
| Selects 5+ causes (comprehensive) | 3 pts bonus |

---

#### Task 3: Diagnostic query (10 pts)

**Sample Solution:**
```sql
SELECT
  a.sku,
  a.to_allocate_quantity,
  a.allocated_quantity,
  a.unallocated_quantity,
  a.unallocated_reason,
  s.location_id,
  s.quantity_available,
  l.location_status,
  l.location_type,
  l.zone,
  assign.assignment_id,
  CASE
    WHEN s.sku IS NULL THEN 'NO_STOCK_RECORD'
    WHEN l.location_status = 'blocked' THEN 'LOCATION_BLOCKED'
    WHEN assign.assignment_id IS NULL THEN 'NO_ASSIGNMENT'
    WHEN s.quantity_available = 0 THEN 'ZERO_AVAILABLE'
    ELSE 'UNKNOWN'
  END AS diagnostic_reason
FROM allocation_results a
LEFT JOIN stock s ON a.sku = s.sku
LEFT JOIN locations l ON s.location_id = l.location_id
LEFT JOIN assignments assign ON a.sku = assign.sku AND s.location_id = assign.location_id
WHERE a.unallocated_quantity > 0
ORDER BY a.sku, s.location_id;
```

**Key Concepts:**
- Multiple LEFT JOINs to check each potential cause
- CASE statement for diagnostic categorization
- Filters to unallocated items

**Rubric:**
| Criteria | Points |
|----------|--------|
| Joins allocation with stock | 3 pts |
| Includes location info | 2 pts |
| Includes assignment check | 2 pts |
| Diagnostic CASE logic | 3 pts |

---

#### BONUS: Detect allocation preference issues (5 pts)

**Sample Solution:**
```sql
-- Check if certain locations are being over/under utilized
SELECT
  location_id,
  COUNT(*) as times_allocated,
  SUM(allocated_quantity) as total_allocated,
  AVG(allocated_quantity) as avg_per_allocation
FROM allocation_details
GROUP BY location_id
ORDER BY times_allocated DESC;

-- Compare to expected distribution based on stock
SELECT
  s.location_id,
  s.quantity_available,
  COALESCE(ad.times_allocated, 0) as actual_allocations,
  s.quantity_available / NULLIF(COALESCE(ad.times_allocated, 0), 0) as qty_per_allocation
FROM stock s
LEFT JOIN (
  SELECT location_id, COUNT(*) as times_allocated
  FROM allocation_details
  GROUP BY location_id
) ad ON s.location_id = ad.location_id
ORDER BY s.quantity_available DESC;
```

---

## SECTION 6: Performance & Optimization (Bonus - 15 points)

### Question 6.1: The Slow Report

**Original Query:**
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

---

#### Task 1: Rewrite for performance (7 pts)

**Sample Solution:**
```sql
WITH latest_import AS (
  SELECT MAX(import_job_id) AS max_job_id
  FROM item_master
),
latest_items AS (
  SELECT sku, name
  FROM item_master
  WHERE import_job_id = (SELECT max_job_id FROM latest_import)
),
stock_totals AS (
  SELECT sku, SUM(quantity) AS total_stock
  FROM stock
  GROUP BY sku
)
SELECT
  e.event_id,
  e.sku,
  li.name AS item_name,
  st.total_stock
FROM events e
LEFT JOIN latest_items li ON e.sku = li.sku
LEFT JOIN stock_totals st ON e.sku = st.sku
WHERE e.date_created >= CURRENT_DATE - INTERVAL '7' DAY;
```

**Key Concepts:**
- CTEs to pre-compute expensive operations
- JOIN instead of correlated subqueries
- Pre-aggregate stock totals

**Rubric:**
| Criteria | Points |
|----------|--------|
| Removes correlated subqueries | 3 pts |
| Uses CTEs or derived tables | 2 pts |
| Pre-aggregates stock | 2 pts |

---

#### Task 2: Why is it faster? (5 pts)

**Expected Answer:**
Original query problems:
1. **Correlated subqueries** - Execute once per row in events (N+1 pattern)
2. **MAX(import_job_id)** - Calculated repeatedly for every row
3. **SUM(quantity)** - Aggregation runs for every event row

Rewritten query improvements:
1. **CTEs execute once** - MAX calculated once, stock aggregated once
2. **JOINs are set-based** - Database optimizes join strategy
3. **Hash joins** - Pre-computed tables can use efficient hash joins
4. **Parallelism** - CTEs can potentially run in parallel

**Rubric:**
| Criteria | Points |
|----------|--------|
| Identifies N+1/correlated issue | 2 pts |
| Explains set-based benefits | 2 pts |
| Mentions specific optimizations | 1 pt |

---

#### BONUS: Index recommendations (3 pts)

**Recommended Indexes:**
```sql
-- For the date filter on events
CREATE INDEX idx_events_date ON events(date_created);

-- For the SKU lookups
CREATE INDEX idx_events_sku ON events(sku);
CREATE INDEX idx_item_master_job_sku ON item_master(import_job_id, sku);
CREATE INDEX idx_stock_sku ON stock(sku);

-- For the MAX query
CREATE INDEX idx_item_master_job ON item_master(import_job_id DESC);
```

---

## Grading Summary

| Section | Points | Passing (76%) |
|---------|--------|---------------|
| Section 1: Deduplication | 20 | 15 |
| Section 2: Joins | 20 | 15 |
| Section 3: ABC Analysis | 15 | 12 |
| Section 4: Window Functions | 20 | 15 |
| Section 5: Root Cause | 25 | 19 |
| **Core Total** | **100** | **76** |
| Section 6: Performance (Bonus) | 15 | - |
| **Total Possible** | **115** | - |

**Passing Score:** 76-90 points (76-90%)
**Strong Performance:** 91+ points
