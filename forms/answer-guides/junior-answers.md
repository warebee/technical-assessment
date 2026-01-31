# Junior Level Answer Guide

**Target Score:** 60-75 points
**Duration:** 60-90 minutes
**Experience Level:** 0-2 years

---

## SECTION 1: Data Quality & Deduplication (20 points)

### Question 1.1: The Duplicate Import Mystery

**Context:**
```sql
-- Current import query
SELECT consignee, sku, location_id, quantity, uom
FROM raw_assignment_data
WHERE import_date = CURRENT_DATE;
```

**Sample Data:**
```
| consignee | sku      | location_id | quantity | uom | import_timestamp    |
|-----------|----------|-------------|----------|-----|---------------------|
| DEMO      | SKU-001  | ABCD 01 02  | 100      | PC  | 2024-01-27 10:00:00 |
| DEMO      | SKU-001  | ABCD 01 02  | 150      | PC  | 2024-01-27 10:05:00 |
| DEMO      | SKU-002  | ABCD 01 03  | 200      | PC  | 2024-01-27 10:00:00 |
```

---

#### Task 1: What problem will occur with this query? (5 pts)

**Expected Answer:**
The query will return duplicate rows for the composite key `(consignee, sku, location_id)`. In the sample data, SKU-001 at location ABCD 01 02 appears twice with different quantities (100 and 150). If this data is used in an INSERT with a unique constraint on that key, it will fail with a "duplicate key violation" error.

**Key Concepts:**
- Understanding of composite keys
- Recognition of data quality issues
- Awareness of INSERT failures

**Rubric:**
| Criteria | Points |
|----------|--------|
| Identifies duplicate key issue | 2 pts |
| Explains INSERT failure consequence | 2 pts |
| References specific example from data | 1 pt |

**Common Mistakes:**
- Missing that it's a composite key (not just SKU)
- Not explaining the consequence (just saying "duplicates")

---

#### Task 2: Write a query to keep only the most recent record (10 pts)

**Sample Solution:**
```sql
WITH ranked_data AS (
  SELECT
    consignee,
    sku,
    location_id,
    quantity,
    uom,
    import_timestamp,
    ROW_NUMBER() OVER (
      PARTITION BY consignee, sku, location_id
      ORDER BY import_timestamp DESC
    ) AS rn
  FROM raw_assignment_data
  WHERE import_date = CURRENT_DATE
)
SELECT
  consignee,
  sku,
  location_id,
  quantity,
  uom
FROM ranked_data
WHERE rn = 1;
```

**Key Concepts:**
- ROW_NUMBER() window function
- PARTITION BY for grouping
- ORDER BY DESC for "latest first"
- Filtering with rn = 1

**Rubric:**
| Criteria | Points |
|----------|--------|
| Correct use of ROW_NUMBER() | 3 pts |
| Correct PARTITION BY clause | 3 pts |
| Correct ORDER BY DESC | 2 pts |
| Correct filter (rn = 1) | 2 pts |

**Alternative Valid Approaches:**
```sql
-- Using MAX() subquery (less elegant but valid)
SELECT r.*
FROM raw_assignment_data r
WHERE r.import_timestamp = (
  SELECT MAX(import_timestamp)
  FROM raw_assignment_data r2
  WHERE r2.consignee = r.consignee
    AND r2.sku = r.sku
    AND r2.location_id = r.location_id
)
AND import_date = CURRENT_DATE;
```

**Common Mistakes:**
- Forgetting `DESC` in ORDER BY (gets oldest instead of newest)
- Using RANK() instead of ROW_NUMBER() (can return multiple rows on ties)
- Not including all key columns in PARTITION BY

**Red Flags:**
- Using GROUP BY without aggregation
- Using DISTINCT (doesn't solve the quantity ambiguity)

---

#### Task 3: How would you validate the deduplication worked? (5 pts)

**Expected Answer:**
Run a count query to verify no duplicates remain:

```sql
-- Check for duplicates after deduplication
SELECT consignee, sku, location_id, COUNT(*) as cnt
FROM deduplicated_result
GROUP BY consignee, sku, location_id
HAVING COUNT(*) > 1;

-- This should return 0 rows if deduplication worked
```

Additional validation:
- Compare total row count before and after
- Verify the kept rows have the expected (latest) timestamps
- Spot-check a few known duplicates to confirm correct one was retained

**Rubric:**
| Criteria | Points |
|----------|--------|
| Count/GROUP BY validation query | 2 pts |
| HAVING COUNT(*) > 1 check | 2 pts |
| Additional validation ideas | 1 pt |

---

## SECTION 2: Data Joins & Enrichment (20 points)

### Question 2.1: The Missing Product Details

**Context:**
```sql
-- Tables available:
-- events: event_id, sku, scan_time
-- item_master: import_job_id, sku, uom, name, ean (multiple imports exist)
```

---

#### Task 1: Get the latest import_job_id (5 pts)

**Sample Solution:**
```sql
SELECT MAX(import_job_id) FROM item_master;
```

**Key Concepts:**
- MAX() aggregate function
- Understanding that import_job_id is sequential/incremental

**Rubric:**
| Criteria | Points |
|----------|--------|
| Correct MAX() syntax | 3 pts |
| Correct table reference | 2 pts |

**Alternative:**
```sql
SELECT import_job_id
FROM item_master
ORDER BY import_job_id DESC
LIMIT 1;
```

---

#### Task 2: CTE to filter to latest import (5 pts)

**Sample Solution:**
```sql
WITH latest_items AS (
  SELECT sku, uom, name, ean
  FROM item_master
  WHERE import_job_id = (SELECT MAX(import_job_id) FROM item_master)
)
SELECT * FROM latest_items;
```

**Key Concepts:**
- CTE syntax (WITH ... AS)
- Subquery in WHERE clause
- Filtering to specific import version

**Rubric:**
| Criteria | Points |
|----------|--------|
| Correct CTE syntax | 2 pts |
| Subquery for MAX | 2 pts |
| Correct column selection | 1 pt |

---

#### Task 3: Join events with latest item data (5 pts)

**Sample Solution:**
```sql
WITH latest_items AS (
  SELECT sku, uom, name, ean
  FROM item_master
  WHERE import_job_id = (SELECT MAX(import_job_id) FROM item_master)
)
SELECT
  e.event_id,
  e.sku,
  e.scan_time,
  li.name,
  li.uom,
  li.ean
FROM events e
LEFT JOIN latest_items li ON e.sku = li.sku;
```

**Key Concepts:**
- LEFT JOIN (to keep all events even without item data)
- JOIN condition on SKU
- Selecting columns from both tables

**Rubric:**
| Criteria | Points |
|----------|--------|
| LEFT JOIN (not INNER) | 2 pts |
| Correct join condition | 2 pts |
| Appropriate column selection | 1 pt |

---

#### Task 4: Identify events with missing SKU data (5 pts)

**Expected Answer:**
With a LEFT JOIN, events with SKUs not in the latest import will have NULL values for the item_master columns.

```sql
-- Find events with missing item data
SELECT e.event_id, e.sku
FROM events e
LEFT JOIN latest_items li ON e.sku = li.sku
WHERE li.sku IS NULL;
```

**Explanation:**
- LEFT JOIN preserves all rows from `events`
- If no match exists in `latest_items`, the joined columns are NULL
- Filtering on `li.sku IS NULL` finds unmatched events

**Rubric:**
| Criteria | Points |
|----------|--------|
| Understands NULL result for missing | 2 pts |
| Query to identify missing | 2 pts |
| Clear explanation | 1 pt |

**Common Mistakes:**
- Using INNER JOIN (silently drops unmatched events)
- Using `li.sku = NULL` instead of `IS NULL`

---

## SECTION 3: ABC Analysis & Statistics (15 points)

### Question 3.1: Too Many SKUs, Not Enough Time

**Sample Data:**
```
| sku       | order_line_count | quantity_ordered | cumulative_percent_rank |
|-----------|------------------|------------------|-------------------------|
| SKU-001   | 1000             | 50000            | 0.45                    |
| SKU-002   | 800              | 40000            | 0.75                    |
| SKU-003   | 300              | 15000            | 0.90                    |
| SKU-004   | 100              | 5000             | 0.98                    |
```

---

#### Task 1: Write ABC classification CASE statement (7 pts)

**Sample Solution:**
```sql
SELECT
  sku,
  order_line_count,
  quantity_ordered,
  cumulative_percent_rank,
  CASE
    WHEN cumulative_percent_rank <= 0.50 THEN 'A+'
    WHEN cumulative_percent_rank <= 0.80 THEN 'A'
    WHEN cumulative_percent_rank <= 0.95 THEN 'B'
    ELSE 'C'
  END AS abc_category
FROM order_statistics
ORDER BY cumulative_percent_rank;
```

**Expected Results:**
```
| sku     | abc_category |
|---------|--------------|
| SKU-001 | A+           |
| SKU-002 | A            |
| SKU-003 | B            |
| SKU-004 | C            |
```

**Key Concepts:**
- CASE statement syntax
- Correct threshold boundaries (50/80/95)
- Understanding that CASE evaluates in order

**Rubric:**
| Criteria | Points |
|----------|--------|
| Correct CASE syntax | 2 pts |
| Correct thresholds | 3 pts |
| Correct category labels | 2 pts |

**Common Mistakes:**
- Using `<` instead of `<=` (boundary items miscategorized)
- Putting conditions in wrong order
- Using `BETWEEN` incorrectly (e.g., `BETWEEN 0.50 AND 0.80` would include 0.50 twice)

---

#### Task 2: What does cumulative_percent_rank = 0.45 mean? (4 pts)

**Expected Answer:**
A cumulative_percent_rank of 0.45 means this SKU, combined with all higher-volume SKUs, accounts for 45% of total order activity (e.g., total picks, order lines, or volume - depending on what was measured).

In business terms: This is a high-velocity item. The top items up to and including this one represent 45% of all warehouse activity.

**Key Concepts:**
- Cumulative distribution
- Pareto principle (80/20 rule)
- Business interpretation

**Rubric:**
| Criteria | Points |
|----------|--------|
| Explains "45% of total activity" | 2 pts |
| Mentions cumulative nature | 1 pt |
| Business relevance | 1 pt |

---

#### Task 3: Why cumulative_percent_rank vs percent_rank? (4 pts)

**Expected Answer:**
`percent_rank` gives the relative position of a single item (e.g., "this item is in the top 10%"), while `cumulative_percent_rank` shows what percentage of total activity is covered up to that point.

For ABC analysis, we need cumulative because:
- We want to know "how much activity do my top N items cover?"
- The 80/20 rule is about cumulative contribution, not individual rank
- It answers: "If I optimize these items, what % of picks am I improving?"

**Rubric:**
| Criteria | Points |
|----------|--------|
| Explains difference correctly | 2 pts |
| Connects to ABC purpose | 2 pts |

---

## SECTION 4: Window Functions & Sequence Analysis (20 points)

### Question 4.1: Where Did That Item Come From?

**Sample Data:**
```
| event_id | trace_id | time_created | scan_label | scan_code   |
|----------|----------|--------------|------------|-------------|
| e1       | t1       | 100          | location   | ABCD 01 02  |
| e2       | t1       | 105          | item       | SKU-12345   |
| e3       | t1       | 110          | location   | ABCD 01 03  |
| e4       | t1       | 115          | item       | SKU-67890   |
```

---

#### Task 1: Use LAG to show location for each item (10 pts)

**Sample Solution:**
```sql
SELECT
  event_id,
  trace_id,
  time_created,
  scan_label,
  scan_code,
  LAG(scan_code) OVER (
    PARTITION BY trace_id
    ORDER BY time_created
  ) AS previous_scan,
  CASE
    WHEN scan_label = 'item' THEN
      LAG(scan_code) OVER (
        PARTITION BY trace_id
        ORDER BY time_created
      )
    ELSE NULL
  END AS picked_from_location
FROM events;
```

**Expected Output:**
```
| event_id | scan_label | scan_code   | previous_scan | picked_from_location |
|----------|------------|-------------|---------------|----------------------|
| e1       | location   | ABCD 01 02  | NULL          | NULL                 |
| e2       | item       | SKU-12345   | ABCD 01 02    | ABCD 01 02           |
| e3       | location   | ABCD 01 03  | SKU-12345     | NULL                 |
| e4       | item       | SKU-67890   | ABCD 01 03    | ABCD 01 03           |
```

**Key Concepts:**
- LAG() window function
- PARTITION BY for trace isolation
- ORDER BY for temporal ordering

**Rubric:**
| Criteria | Points |
|----------|--------|
| Correct LAG() syntax | 3 pts |
| Correct PARTITION BY | 3 pts |
| Correct ORDER BY | 2 pts |
| Filters to show only for items | 2 pts |

**Common Mistakes:**
- Forgetting PARTITION BY (crosses trace boundaries)
- Wrong ORDER BY direction
- Not handling the case where previous scan isn't a location

---

#### Task 2: Use LEAD to show next item after location (10 pts)

**Sample Solution:**
```sql
SELECT
  event_id,
  trace_id,
  time_created,
  scan_label,
  scan_code,
  LEAD(scan_code) OVER (
    PARTITION BY trace_id
    ORDER BY time_created
  ) AS next_scan,
  CASE
    WHEN scan_label = 'location' THEN
      LEAD(scan_code) OVER (
        PARTITION BY trace_id
        ORDER BY time_created
      )
    ELSE NULL
  END AS next_item_to_pick
FROM events;
```

**Expected Output:**
```
| event_id | scan_label | scan_code   | next_scan   | next_item_to_pick |
|----------|------------|-------------|-------------|-------------------|
| e1       | location   | ABCD 01 02  | SKU-12345   | SKU-12345         |
| e2       | item       | SKU-12345   | ABCD 01 03  | NULL              |
| e3       | location   | ABCD 01 03  | SKU-67890   | SKU-67890         |
| e4       | item       | SKU-67890   | NULL        | NULL              |
```

**Key Concepts:**
- LEAD() window function (opposite of LAG)
- Same partitioning and ordering logic

**Rubric:**
| Criteria | Points |
|----------|--------|
| Correct LEAD() syntax | 3 pts |
| Correct PARTITION BY | 3 pts |
| Correct ORDER BY | 2 pts |
| Filters to show only for locations | 2 pts |

---

## Grading Summary

| Section | Points | Passing (60%) |
|---------|--------|---------------|
| Section 1: Deduplication | 20 | 12 |
| Section 2: Joins | 20 | 12 |
| Section 3: ABC Analysis | 15 | 9 |
| Section 4: Window Functions | 20 | 12 |
| **Total** | **75** | **45** |

**Passing Score:** 45-75 points (60-100%)
