export const testDatasetsSQL = `-- ============================================================
-- SQL ASSESSMENT - TEST DATASETS
-- ============================================================
-- Use these datasets to test your queries
-- Compatible with Trino/Presto, PostgreSQL, DuckDB
-- ============================================================

-- ============================================================
-- TABLE: events (IoT scan events)
-- ============================================================
CREATE TABLE events (
    event_id VARCHAR(100),
    event_type VARCHAR(50),
    time_created VARCHAR(20),      -- milliseconds as string
    time_received VARCHAR(20),     -- milliseconds as string
    device_serial VARCHAR(50),
    device_model VARCHAR(100),
    device_battery VARCHAR(10),
    gateway_wifi_signal_strength VARCHAR(10),
    inferred_process_type_id VARCHAR(50),
    inferred_scancode_label VARCHAR(50),
    inferred_process_trace_id VARCHAR(200),
    inference_confidence VARCHAR(30),
    scan_code VARCHAR(100),
    scan_duration VARCHAR(20),
    time_lost VARCHAR(20)
);

-- Sample data: 20+ events simulating picking & replenishment sessions
INSERT INTO events VALUES
-- Device 1: MDMR312817942 - Morning picking session
('evt-001', 'scan', '1769490000000', '1769489998500', 'MDMR312817942', 'Mark Display', '95', '-55', 'PICKING', 'location', 'MDMR312817942-27-01-27 08:00:00', '0.95', 'PKL101201', '245', '0.0'),
('evt-002', 'scan', '1769490030000', '1769490028500', 'MDMR312817942', 'Mark Display', '94', '-58', 'PICKING', 'item', 'MDMR312817942-27-01-27 08:00:00', '0.92', '4006381333931', '180', '2.5'),
('evt-003', 'scan', '1769490060000', '1769490058500', 'MDMR312817942', 'Mark Display', '94', '-52', 'PICKING', 'location', 'MDMR312817942-27-01-27 08:00:00', '0.98', 'PKL101202', '200', '0.0'),
('evt-004', 'scan', '1769490090000', '1769490088500', 'MDMR312817942', 'Mark Display', '93', '-60', 'PICKING', 'item', 'MDMR312817942-27-01-27 08:00:00', '0.88', '4006381333948', '210', '0.0'),
('evt-005', 'scan', '1769490120000', '1769490118500', 'MDMR312817942', 'Mark Display', '93', '-55', 'PICKING', 'location', 'MDMR312817942-27-01-27 08:00:00', '0.96', 'PKL101203', '190', '0.0'),
('evt-006', 'scan', '1769490150000', '1769490148500', 'MDMR312817942', 'Mark Display', '92', '-58', 'PICKING', 'item', 'MDMR312817942-27-01-27 08:00:00', '0.91', '4006381333955', '220', '1.0'),
('evt-007', 'scan', '1769490180000', '1769490178500', 'MDMR312817942', 'Mark Display', '92', '-56', 'PICKING', 'item', 'MDMR312817942-27-01-27 08:00:00', '0.89', '4006381333962', '235', '0.5'),
('evt-008', 'scan', '1769490210000', '1769490208500', 'MDMR312817942', 'Mark Display', '91', '-54', 'PICKING', 'end', 'MDMR312817942-27-01-27 08:00:00', '0.99', 'ENDE', '100', '0.0'),

-- Device 1: Gap of 10 minutes (new job should start)
('evt-009', 'scan', '1769490810000', '1769490808500', 'MDMR312817942', 'Mark Display', '90', '-50', 'PICKING', 'sscc', 'MDMR312817942-27-01-27 08:13:30', '0.97', '00340123456789012345', '150', '0.0'),
('evt-010', 'scan', '1769490840000', '1769490838500', 'MDMR312817942', 'Mark Display', '89', '-52', 'PICKING', 'location', 'MDMR312817942-27-01-27 08:13:30', '0.94', 'PKL151001', '210', '0.0'),

-- Device 2: MDMR312817999 - Replenishment session
('evt-011', 'scan', '1769490000000', '1769489998000', 'MDMR312817999', 'Mark Display', '78', '-65', 'REPLENISHMENT', 'location', 'MDMR312817999-27-01-27 08:00:00', '0.93', 'PKL250101', '230', '0.0'),
('evt-012', 'scan', '1769490030000', '1769490028000', 'MDMR312817999', 'Mark Display', '77', '-68', 'REPLENISHMENT', 'item', 'MDMR312817999-27-01-27 08:00:00', '0.85', '4006381444001', '260', '5.0'),
('evt-013', 'scan', '1769490060000', '1769490058000', 'MDMR312817999', 'Mark Display', '76', '-70', 'REPLENISHMENT', 'location', 'MDMR312817999-27-01-27 08:00:00', '0.91', 'PKL250102', '245', '0.0'),
('evt-014', 'scan', '1769490090000', '1769490088000', 'MDMR312817999', 'Mark Display', '75', '-72', 'REPLENISHMENT', 'item', 'MDMR312817999-27-01-27 08:00:00', '0.88', '4006381444018', '275', '3.0'),
('evt-015', 'scan', '1769490120000', '1769490118000', 'MDMR312817999', 'Mark Display', '74', '-65', 'REPLENISHMENT', 'location', 'MDMR312817999-27-01-27 08:00:00', '0.95', 'PKL350101', '200', '0.0'),

-- Device 3: MDMR312818001 - Low battery scenario (testing correlation)
('evt-016', 'scan', '1769490000000', '1769489998200', 'MDMR312818001', 'Mark Display', '18', '-75', 'PICKING', 'location', 'MDMR312818001-27-01-27 08:00:00', '0.65', 'PKL201501', '350', '10.0'),
('evt-017', 'scan', '1769490030000', '1769490028200', 'MDMR312818001', 'Mark Display', '17', '-78', 'PICKING', 'item', 'MDMR312818001-27-01-27 08:00:00', '0.58', '4006381555001', '420', '15.0'),
('evt-018', 'scan', '1769490060000', '1769490058200', 'MDMR312818001', 'Mark Display', '15', '-80', 'PICKING', 'location', 'MDMR312818001-27-01-27 08:00:00', '0.62', 'PKL201502', '380', '12.0'),
('evt-019', 'scan', '1769490090000', '1769490088200', 'MDMR312818001', 'Mark Display', '14', '-82', 'PICKING', 'item', 'MDMR312818001-27-01-27 08:00:00', '0.55', '4006381555018', '450', '18.0'),

-- Duplicate event (same event_id, later time_received - for deduplication test)
('evt-002', 'scan', '1769490030000', '1769490029000', 'MDMR312817942', 'Mark Display', '94', '-58', 'PICKING', 'item', 'MDMR312817942-27-01-27 08:00:00', '0.92', '4006381333931', '180', '2.5'),

-- Events to filter out
('evt-020', 'introduction', '1769489900000', '1769489898000', 'MDMR312817942', 'Mark Display', '96', '-50', 'unknown', 'unknown', 'unknown', '0.0', '', '0', '0.0'),
('evt-021', 'telemetry', '1769489950000', '1769489948000', 'MDMR312817942', 'Mark Display', '95', '-52', 'unknown', 'worker', 'unknown', '0.0', '[anonymized]', '0', '0.0');


-- ============================================================
-- TABLE: item_set (Item Master)
-- ============================================================
CREATE TABLE item_set (
    import_job_id INTEGER,
    sku VARCHAR(50),
    ean VARCHAR(20),
    uom VARCHAR(20),
    description VARCHAR(200),
    weight DECIMAL(10,3)
);

INSERT INTO item_set VALUES
-- Current import (job_id = 100) - USE THIS
(100, 'SKU-A001', '4006381333931', 'EACH', 'Widget Type A', 0.250),
(100, 'SKU-A002', '4006381333948', 'EACH', 'Widget Type B', 0.300),
(100, 'SKU-A003', '4006381333955', 'CASE', 'Widget Type C (Case of 12)', 3.600),
(100, 'SKU-A004', '4006381333962', 'EACH', 'Widget Type D', 0.180),
(100, 'SKU-B001', '4006381444001', 'PALLET', 'Bulk Material X', 500.000),
(100, 'SKU-B002', '4006381444018', 'CASE', 'Bulk Material Y (Case)', 25.000),
(100, 'SKU-C001', '4006381555001', 'EACH', 'Premium Item Alpha', 0.450),
(100, 'SKU-C002', '4006381555018', 'EACH', 'Premium Item Beta', 0.520),

-- Old import (job_id = 99) - should NOT be used
(99, 'SKU-A001-OLD', '4006381333931', 'EA', 'OLD Widget Type A', 0.240),
(99, 'SKU-A002-OLD', '4006381333948', 'EA', 'OLD Widget Type B', 0.290);


-- ============================================================
-- TABLE: assignment (Location to SKU assignments)
-- ============================================================
CREATE TABLE assignment (
    import_job_id INTEGER,
    location_id VARCHAR(20),
    sku VARCHAR(50),
    quantity INTEGER,
    zone VARCHAR(20)
);

INSERT INTO assignment VALUES
-- Current import (job_id = 200) - USE THIS
(200, 'ABCD 10 12 01', 'SKU-A001', 100, 'AMBIENT'),
(200, 'ABCD 10 12 02', 'SKU-A002', 80, 'AMBIENT'),
(200, 'ABCD 10 12 03', 'SKU-A003', 50, 'AMBIENT'),
(200, 'ABCD 15 10 01', 'SKU-A004', 120, 'AMBIENT'),
(200, 'ABCD 20 15 01', 'SKU-C001', 60, 'COLD'),
(200, 'ABCD 20 15 02', 'SKU-C002', 45, 'COLD'),
(200, 'ABCD 25 01 01', 'SKU-B001', 10, 'BULK'),
(200, 'ABCD 25 01 02', 'SKU-B002', 25, 'BULK'),
(200, 'ABCD 35 01 01', 'SKU-B001', 8, 'DISPATCH'),

-- Old import (job_id = 199) - should NOT be used
(199, 'ABCD 10 12 01', 'SKU-OLD', 50, 'AMBIENT');


-- ============================================================
-- EXPECTED RESULTS GUIDE
-- ============================================================
-- B1 Deduplication: Should return 21 rows (evt-002 deduplicated, keeping later time_received)
-- B2 Item join: 8 item scans should match with SKUs from item_set
-- B3 Location join: 8 location scans, 5 should match with assigned SKUs
-- C2 Job boundaries: Device MDMR312817942 has 2 jobs (10 min gap after evt-008)
-- D1 Full transform: ~17 valid ActivityFeed rows after filtering
`;
