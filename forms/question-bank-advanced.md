# Advanced Question Bank

**Source:** Real production SQL patterns from warehouse operations
**Purpose:** Supplementary questions for evaluators who want harder/alternative questions

> These questions are derived from actual production queries and emphasize:
> - Problem solving with complex real-world patterns
> - Data understanding and "thinking in data"
> - Reading and debugging existing code
> - Performance awareness

---

## Junior Level Questions

### Q-J1: Reading the Data Pipeline (15 pts)

**Concept:** Understanding CTE flow and data transformation

**Given this simplified CTE chain:**
```sql
WITH raw_scans AS (
  SELECT
    TRIM(REGEXP_REPLACE(scan_code, '[\n\r\t]+', '')) AS scan_code_clean,
    *
  FROM scan_events
),
processed_scans AS (
  SELECT
    *,
    LAG(scan_code_clean) OVER (
      PARTITION BY device_serial
      ORDER BY time_received
    ) AS previous_scan
  FROM raw_scans
)
SELECT * FROM processed_scans;
```

**Tasks:**

1. **What does `REGEXP_REPLACE(scan_code, '[\n\r\t]+', '')` do?** Why might scan codes contain these characters? (5 pts)

2. **What does the LAG function return** for the very first scan of each device? (5 pts)

3. **If device "GLOVE-001" has scans at times 100, 105, 110** - what would `previous_scan` contain for each row? (5 pts)

**What this tests:** Basic understanding of string functions, window functions, NULL behavior

---

### Q-J2: The Location Lookup (15 pts)

**Concept:** Understanding JOIN behavior with lookup tables

**Given this query:**
```sql
WITH location_dims AS (
  SELECT * FROM (VALUES
    ('Bulk - 2 Deep', 96, 48, 384),
    ('CasePick - 1 Deep', 48, 42, 76)
  ) AS t (location_type, length, width, height)
)
SELECT loc.*, dims.length, dims.width, dims.height
FROM locations loc
LEFT JOIN location_dims dims ON loc.location_type = dims.location_type
```

**Tasks:**

1. **Why use LEFT JOIN instead of INNER JOIN here?** (5 pts)

2. **What will `length`, `width`, `height` contain** if `loc.location_type = 'Unknown'`? (5 pts)

3. **Write a query to find all locations that have NO matching dimension data.** (5 pts)

**What this tests:** JOIN types, NULL understanding, diagnostic queries

---

### Q-J3: Decode the Business Logic (10 pts)

**Concept:** Reading CASE statements that encode business rules

**Given this CASE statement:**
```sql
CASE
  WHEN inferred_scancode_label = 'location' THEN 'JOB_END'
  WHEN inferred_scancode_label = 'item' THEN 'PICK'
  WHEN inferred_scancode_label = 'trolley' THEN 'PUT'
  ELSE inferred_scancode_label
END AS event_type
```

**Tasks:**

1. **What does this CASE statement tell you about the warehouse process?** (4 pts)

2. **The business adds a new scan type called 'printer' that should map to 'PACK'.** How would you modify this? (3 pts)

3. **What happens if `inferred_scancode_label` is NULL?** (3 pts)

**What this tests:** Business logic comprehension, defensive coding awareness

---

## Mid Level Questions

### Q-M1: The Trolley Puzzle (20 pts)

**Concept:** Understanding FIRST_VALUE IGNORE NULLS for forward-filling

**Given this pattern from real production code:**
```sql
FIRST_VALUE(
  CASE WHEN inferred_scancode_label = 'trolley' THEN scan_code ELSE NULL END
) IGNORE NULLS OVER (
  PARTITION BY process_trace_id
  ORDER BY time_received
  ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
) AS next_trolley_scancode
```

**Sample Data:**
```
| event_id | process_trace_id | time | scan_label | scan_code |
|----------|------------------|------|------------|-----------|
| e1       | job-001          | 100  | location   | LOC-A     |
| e2       | job-001          | 105  | item       | SKU-111   |
| e3       | job-001          | 110  | item       | SKU-222   |
| e4       | job-001          | 115  | trolley    | TRL-001   |
| e5       | job-001          | 120  | item       | SKU-333   |
| e6       | job-001          | 125  | trolley    | TRL-002   |
```

**Tasks:**

1. **What will `next_trolley_scancode` be for each row?** Walk through the logic. (6 pts)

2. **Why use `ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING`** instead of the default frame? (5 pts)

3. **Why use `IGNORE NULLS`?** What would happen without it? (5 pts)

4. **BONUS:** Modify this to get the PREVIOUS trolley instead (look backward, not forward). (4 pts)

**What this tests:** Advanced window frame understanding, IGNORE NULLS behavior

---

### Q-M2: Performance Red Flag (20 pts)

**Concept:** Identifying problematic subquery patterns

**From production:**
```sql
-- Calculating quantity based on trolley scan frequency
CASE
  WHEN next_trolley_scancode IN (
    SELECT trolley FROM trolleys_scanned_only_once
  ) THEN TRY_CAST(lim.units_per_lowest_uom AS INTEGER)
  ELSE TRY_CAST(quantity_total AS INTEGER)
END AS quantity
```

**Tasks:**

1. **What is this CASE statement trying to decide?** (Hint: "full trolley" vs "partial trolley") (5 pts)

2. **Why might this subquery cause performance problems on large datasets?** (5 pts)

3. **Rewrite this using a JOIN instead of `IN (SELECT ...)`** (6 pts)

4. **BONUS:** What index would help the original query perform better? (4 pts)

**What this tests:** Query optimization, understanding correlated subqueries, JOIN refactoring

---

### Q-M3: The Time Window Filter (15 pts)

**Concept:** Rolling time-based filtering

**Given this query:**
```sql
SELECT *,
       MAX(CAST(time_created AS DOUBLE)) OVER () AS max_time_created
FROM scan_events
WHERE max_time_created - CAST(time_created AS DOUBLE) <= 12 * 60 * 60 * 1000
```

**Wait, there's a problem with this query!**

**Tasks:**

1. **Can you use a window function result in the WHERE clause directly?** Why or why not? (5 pts)

2. **Rewrite this to correctly filter to the last 12 hours of data** (5 pts)

3. **The original code uses a subquery/CTE approach. Why?** (3 pts)

4. **What's the risk of using MAX() OVER () on a 100 million row table?** (2 pts)

**What this tests:** Window function evaluation order, CTE usage, scalability thinking

---

## Senior Level Questions

### Q-S1: Data Flow Trace (25 pts)

**Concept:** Tracing data through multiple CTEs

**Given this CTE chain (simplified from production):**
```sql
WITH raw_data_cleansed AS (
  SELECT TRIM(REGEXP_REPLACE(scan_code, '[\n\r\t]+', '')) AS scan_code_clean, *
  FROM raw_scans
),
processed_scans AS (
  SELECT *,
    LAG(scan_code_clean) OVER (PARTITION BY device ORDER BY time) AS prev_scan,
    FIRST_VALUE(CASE WHEN label='trolley' THEN scan_code_clean END)
      IGNORE NULLS OVER (PARTITION BY job_id ORDER BY time
        ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS next_trolley
  FROM raw_data_cleansed
),
with_subprocess AS (
  SELECT *,
    CASE
      WHEN label = 'trolley' THEN CONCAT(time, '-', scan_code_clean)
      WHEN label = 'item' AND next_trolley IS NOT NULL
        THEN CONCAT(next_trolley_time, '-', next_trolley)
      ELSE NULL
    END AS subprocess_id
  FROM processed_scans
)
SELECT * FROM with_subprocess;
```

**Tasks:**

1. **Draw a data lineage diagram** showing how `subprocess_id` is derived from raw input. (5 pts)

2. **What business problem does `subprocess_id` solve?** Why combine time + trolley code? (5 pts)

3. **Identify potential data quality issues** that could cause incorrect results. (5 pts)

4. **If this query takes 5 minutes on 10M rows,** where would you start investigating? (5 pts)

5. **BONUS:** How would you unit test this query? What edge cases would you cover? (5 pts)

**What this tests:** System thinking, debugging strategy, data quality awareness

---

### Q-S2: The Location Classification Engine (25 pts)

**Concept:** Maintaining complex business rules

**Given 50+ lines of CASE statements for area classification (excerpt):**
```sql
CASE
  WHEN template_field1 = 'CH' AND CAST(template_field2 AS INT) BETWEEN 1 AND 31 THEN 'CH 1-31'
  WHEN template_field1 = 'CH' AND CAST(template_field2 AS INT) BETWEEN 32 AND 50 THEN 'CH 32-50'
  WHEN template_field1 = 'CH' AND CAST(template_field2 AS INT) BETWEEN 53 AND 137 THEN 'CH 53-137'
  WHEN template_field1 = 'HA' AND CAST(template_field2 AS INT) BETWEEN 301 AND 310 THEN 'HA 301-310'
  WHEN template_field1 = 'HA' AND CAST(template_field2 AS INT) = 1 THEN 'HA001'
  WHEN template_field1 = 'DF' AND CAST(template_field2 AS INT) BETWEEN 1 AND 20 THEN 'DF 1-20'
  WHEN template_field1 = 'DF' AND CAST(template_field2 AS INT) BETWEEN 21 AND 45 THEN 'DF 21-45'
  -- ... 50 more conditions ...
  ELSE template_field1
END AS area
```

**Tasks:**

1. **What are the maintenance problems with this approach?** (5 pts)

2. **Design an alternative using a lookup table.** Show the table schema and rewritten query. (7 pts)

3. **What are the trade-offs of SQL CASE vs lookup table?** (5 pts)

4. **How would you handle the need for customer-specific overrides?** (4 pts)

5. **BONUS:** The business wants to change CH 32-50 to CH 32-55. Compare the change process: current approach vs your proposed approach. (4 pts)

**What this tests:** Code maintainability, data modeling, change management

---

### Q-S3: Detecting Unscanned Trolleys (20 pts)

**Concept:** Data validation and gap analysis

**The process should be:** Location → Item(s) → Trolley → repeat

But sometimes workers forget to scan the trolley.

**Tasks:**

1. **Write a query to identify "orphan" item scans** - items that were picked but never assigned to a trolley. (6 pts)

2. **How would you distinguish between** "forgot to scan trolley" vs "job interrupted/incomplete"? (5 pts)

3. **Design a data quality alert** that runs daily to flag these issues. (5 pts)

4. **BONUS:** Calculate a "scan compliance rate" per device to identify workers who need retraining. (4 pts)

**What this tests:** Data validation design, business process understanding, quality metrics

---

### Q-S4: Time vs Time (15 pts)

**Concept:** Understanding temporal data semantics

**The system captures both:**
- `time_created` - device timestamp (when scan happened)
- `time_received` - server timestamp (when received)

**Tasks:**

1. **When would these two timestamps differ significantly?** List 3 scenarios. (4 pts)

2. **For event ordering, which timestamp should you use?** Justify your answer. (4 pts)

3. **For deduplication, which timestamp makes sense? Why?** (3 pts)

4. **A device's clock is 2 hours ahead.** What problems does this cause in the current queries? (2 pts)

5. **BONUS:** Design a query to detect devices with clock drift by comparing time_created vs time_received patterns. (2 pts)

**What this tests:** Temporal data understanding, edge case thinking, system reliability

---

## Question Selection Guide

| Level | Questions | Total Points | Focus Areas |
|-------|-----------|--------------|-------------|
| Junior | Q-J1, Q-J2, Q-J3 | 40 | Reading, basics, comprehension |
| Mid | Q-M1, Q-M2, Q-M3 | 55 | Patterns, optimization, debugging |
| Senior | Q-S1 through Q-S4 | 85 | Design, trade-offs, system thinking |

---

## Answer Key Summaries

### Q-J1 Answers
1. REGEXP_REPLACE removes newlines/tabs from scan codes. Scanner data may contain these from barcode encoding or transmission errors.
2. LAG returns NULL for the first row of each partition (no previous row exists).
3. Row 1: NULL, Row 2: (scan from row 1), Row 3: (scan from row 2)

### Q-J2 Answers
1. LEFT JOIN keeps all locations even without matching dimensions (for complete inventory reports).
2. All dimension columns will be NULL.
3. `WHERE dims.location_type IS NULL`

### Q-M1 Answers
For each row: e1=TRL-001, e2=TRL-001, e3=TRL-001, e4=TRL-001, e5=TRL-002, e6=TRL-002
- Frame looks forward to find next trolley
- IGNORE NULLS skips item scans to find actual trolley codes

### Q-M2 Answers
1. Decides quantity source: full trolley (use master data qty) vs partial trolley (use scanned qty)
2. Subquery executes for every row - O(n²) complexity
3. LEFT JOIN to pre-computed trolleys_scanned_only_once CTE

### Q-S2 Lookup Table Design
```sql
CREATE TABLE area_rules (
  rule_id INT PRIMARY KEY,
  template_field1 VARCHAR(10),
  field2_min INT,
  field2_max INT,
  area_name VARCHAR(50),
  priority INT  -- for overlapping rules
);

SELECT l.*, COALESCE(ar.area_name, l.template_field1) AS area
FROM locations l
LEFT JOIN area_rules ar ON
  l.template_field1 = ar.template_field1
  AND CAST(l.template_field2 AS INT) BETWEEN ar.field2_min AND ar.field2_max
ORDER BY ar.priority;
```

---

## Usage Notes for Evaluators

1. **These are harder than the standard assessment** - use for candidates who breeze through the main questions
2. **Open-ended questions** - multiple valid approaches exist; evaluate reasoning quality
3. **Partial credit encouraged** - especially for Q-S questions where design thinking matters
4. **Time guidance:** Junior: 30 min, Mid: 45 min, Senior: 60 min
