export interface Question {
  id: string;
  section: string;
  title: string;
  points: number;
  type: 'text' | 'sql' | 'sql_analysis';
  prompt: string;
  analysisPrompt?: string;
}

export interface Section {
  id: string;
  title: string;
  points: number;
  description?: string;
}

export const sections: Section[] = [
  {
    id: 'A',
    title: 'Data Understanding',
    points: 15,
    description: 'Testing comprehension of data relationships, schemas, and transformations'
  },
  {
    id: 'B',
    title: 'Basic SQL & Joins',
    points: 25,
    description: 'JOIN syntax, filtering, aggregation, and multi-table queries'
  },
  {
    id: 'C',
    title: 'Window Functions & Job Logic',
    points: 25,
    description: 'LAG/LEAD, partitioning, session detection, and complex analytics'
  },
  {
    id: 'D',
    title: 'Full Transformation',
    points: 20,
    description: 'Complete schema mapping from source to ActivityFeed'
  },
  {
    id: 'E',
    title: 'Root Cause Analysis',
    points: 15,
    description: 'Analytical thinking and investigation approaches'
  }
];

export const questions: Question[] = [
  // Section A: Data Understanding
  {
    id: 'A1',
    section: 'A',
    title: 'Timestamp Analysis',
    points: 5,
    type: 'text',
    prompt: `Examine the sample event data. The fields \`time_created\` and \`time_received\` are both timestamps in milliseconds.

a) Which timestamp occurs first chronologically? Explain the semantic difference.
b) What could cause them to differ by several seconds?
c) Which timestamp should be used for \`eventEndTime\` in the ActivityFeed and why?`
  },
  {
    id: 'A2',
    section: 'A',
    title: 'Scan Code Structure',
    points: 5,
    type: 'text',
    prompt: `The \`scan_code\` field contains values like \`PKL421303\` which need to be transformed to location format \`PKLF 42 13 03\`.

a) Describe the structure of the raw scan code.
b) Write the transformation logic to convert it (pseudocode or explanation).
c) What edge cases should be handled?`
  },
  {
    id: 'A3',
    section: 'A',
    title: 'Process Type Mapping',
    points: 5,
    type: 'text',
    prompt: `The source data has various \`inferred_process_type_id\` values like 'PICKING', 'REFILLING', 'RESTOCKING', 'REPLENISHMENT', 'LOADING'.

a) How would you map these to the ActivityFeed \`eventProcessType\` enum?
b) What about \`inferred_scancode_label\` values like 'location', 'item', 'sscc', 'end'?
c) How should 'unknown' values be handled?`
  },

  // Section B: Basic SQL & Joins
  {
    id: 'B1',
    section: 'B',
    title: 'Deduplication',
    points: 5,
    type: 'sql',
    prompt: `Events may have duplicates (same \`event_id\` received multiple times). Write a SQL query to deduplicate, keeping only the latest record by \`time_received\` for each \`event_id\`.`
  },
  {
    id: 'B2',
    section: 'B',
    title: 'Join with Item Master',
    points: 8,
    type: 'sql',
    prompt: `When \`inferred_scancode_label = 'item'\`, the \`scan_code\` contains an EAN barcode.
Write a query that:
1. Filters for item scans only
2. Joins with the latest \`item_set\` to get SKU and UOM
3. Handles cases where the EAN is not found in the master data
4. Returns: event_id, scan_code (as ean), sku, uom, device_serial`
  },
  {
    id: 'B3',
    section: 'B',
    title: 'Location Assignment Lookup',
    points: 7,
    type: 'sql',
    prompt: `For location scans, we need to find what SKU is assigned to that location.
Given the location format transformation (PKL421303 → PKLF 42 13 03), write a query that:
1. Transforms the scan_code to formatted location_id
2. Joins with the latest \`assignment\` table to get the assigned SKU
3. Then joins with \`item_set\` to get the UOM for that SKU
4. Returns: event_id, formatted_location_id, assigned_sku, uom`
  },
  {
    id: 'B4',
    section: 'B',
    title: 'Battery Distribution Analysis',
    points: 5,
    type: 'sql',
    prompt: `Write a query to analyze device battery levels:
1. Group devices into battery ranges: Critical (<20%), Low (20-50%), Normal (50-80%), Good (>80%)
2. Count events and unique devices per range
3. Calculate the percentage of total events per range
4. Order by severity (Critical first)`
  },

  // Section C: Window Functions & Job Logic
  {
    id: 'C1',
    section: 'C',
    title: 'Propagate Last Location',
    points: 8,
    type: 'sql',
    prompt: `In picking workflows, workers scan a location, then scan items at that location.
Item scans don't have their own location - they inherit from the previous location scan.

Write a query using window functions to:
1. For each \`inferred_process_trace_id\` (represents one work session)
2. Propagate the last scanned location to all subsequent item scans
3. Use \`LAST_VALUE ... IGNORE NULLS\` or equivalent
4. Return: event_id, scancode_label, scan_code, last_location_id`
  },
  {
    id: 'C2',
    section: 'C',
    title: 'Job Boundary Detection',
    points: 9,
    type: 'sql',
    prompt: `A "job" is a sequence of events from the same device. A new job starts when:
- It's the first event for that device, OR
- More than 5 minutes have passed since the last event

Write a query that:
1. Uses LAG to get the previous event's timestamp per device
2. Calculates time difference in minutes
3. Marks job boundaries
4. Generates a job_id in format: 'WB-{last4digits_of_device}-{timestamp}'
5. Propagates this job_id to all events in that job using LAG IGNORE NULLS`
  },
  {
    id: 'C3',
    section: 'C',
    title: 'Job Aggregation Statistics',
    points: 8,
    type: 'sql',
    prompt: `Once jobs are identified, write a query to calculate per-job statistics:
1. Job duration (first to last event)
2. Total events in job
3. Count of location scans vs item scans
4. Unique locations visited
5. Total time_lost (sum)
6. Average battery level during job
7. Filter to jobs with more than 5 events`
  },

  // Section D: Full Transformation
  {
    id: 'D1',
    section: 'D',
    title: 'Complete Schema Mapping',
    points: 12,
    type: 'sql',
    prompt: `Write a comprehensive query that transforms the source events to the ActivityFeed schema.

Requirements:
1. Deduplicate events by event_id
2. Transform scan_code to formatted location_id for location scans
3. Map process types and event types correctly:
   - PICKING/location/item → PICKING/PICK
   - REFILLING/RESTOCKING → Replenishment/PUT
   - REPLENISHMENT → REPLENISHMENT/PICK
   - 'sscc' label → JOB_START
   - 'end' label → JOB_END
4. Join with item_set for UOM lookup (via EAN for item scans)
5. Join with assignment for SKU lookup (for location scans)
6. Convert timestamps properly
7. Include: eventId, eventProcessType, eventType, locationId, sku, uom, quantity, agentType, agentId, agentUser, agentEnergy, eventEndTime
8. Filter out event_types: 'introduction', 'worker', 'scanner_state', 'telemetry', 'unknown'`
  },
  {
    id: 'D2',
    section: 'D',
    title: 'Synthetic Job Start/End Events',
    points: 8,
    type: 'sql',
    prompt: `For REPLENISHMENT processes, we need to generate synthetic JOB_START and JOB_END events.

Write a query that:
1. Identifies the first event of each job (using ROW_NUMBER ... ORDER BY ASC)
2. Identifies the last event of each job (using ROW_NUMBER ... ORDER BY DESC)
3. Creates JOB_START events 30 seconds BEFORE the first event
4. Creates JOB_END events 30 seconds AFTER the last event
5. Sets Location ID based on aisle: 
   - aisle_index < 31 → 'REPLENISHMENT-01'
   - aisle_index >= 31 → 'PACKVERSAND01'
6. UNIONs these with the regular events
7. Only for eventProcessType = 'REPLENISHMENT'`
  },

  // Section E: Root Cause Analysis
  {
    id: 'E1',
    section: 'E',
    title: 'Investigation Query',
    points: 8,
    type: 'sql_analysis',
    prompt: `**Scenario:** Operations reports that picking accuracy dropped last week. Low \`inference_confidence\` values might indicate scanning issues.

Write an investigation query that:
1. Groups by date and hour
2. Shows: total events, avg confidence, count where confidence < 0.7
3. Includes unique device count and avg battery
4. Identifies correlation between low battery and low confidence
5. Filters to the last 7 days`,
    analysisPrompt: `What patterns would you look for in the results? How would you identify if this is a device issue vs. a process issue?`
  },
  {
    id: 'E2',
    section: 'E',
    title: 'Root Cause Analysis Approach',
    points: 7,
    type: 'text',
    prompt: `Based on investigation queries, describe:

a) What patterns would indicate a device hardware issue vs. a process issue?
b) How would you distinguish between:
   - Individual device problems
   - Site-wide infrastructure issues (WiFi, lighting)
   - Process/training issues
c) What additional data would you want to join for deeper analysis?
d) How would you present findings to operations management?`
  }
];

export const sampleEventData = `{
  "event_id": "a726c6c6-7bf6-47f8-8ebb-afc3acf25e1b",
  "event_type": "scan",
  "time_created": "1769490868295",
  "time_received": "1769490866530",
  "device_serial": "MDMR312817942",
  "device_battery": "93",
  "device_model": "Mark Display",
  "gateway_wifi_signal_strength": "-55",
  "inferred_process_type_id": "PICKING",
  "inferred_scancode_label": "location",
  "inferred_process_trace_id": "MDMR312817942-27-01-27 05:06:47",
  "inference_confidence": "0.9354838709677419",
  "scan_code": "PKL421303",
  "scan_duration": "245",
  "time_lost": "0.0"
}`;

export const activityFeedSchema = `// Target ActivityFeed Schema (required fields marked with *)
{
  eventId*: string,          // Unique event identifier
  eventProcessType*: enum,   // PICKING, REPLENISHMENT, PUTAWAY, etc.
  eventType*: enum,          // PICK, PUT, JOB_START, JOB_END, etc.
  locationId*: string,       // Format: "PKLF 42 13 03"
  agentType*: string,        // Device model
  eventEndTime*: datetime,   // Timestamp
  jobId*: string,            // Groups related events
  
  sku?: string,              // Item code
  uom?: string,              // Unit of measure
  quantity?: number,         // Quantity handled
  agentId?: string,          // Device serial
  agentUser?: string,        // Username/identifier
  agentEnergy?: number       // Battery level
}`;
