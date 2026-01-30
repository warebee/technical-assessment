/**
 * CSV Generator
 *
 * Generates CSV files from dataset definitions in datasets.ts
 */

import { testDatasetsSQL } from './datasets';

export interface DatasetInfo {
  name: string;
  tableName: string;
  description: string;
  columns: { name: string; type: string }[];
  sampleRows: string[][];
}

/**
 * Parse CREATE TABLE statement to extract column information
 */
function parseCreateTable(sql: string): { name: string; type: string }[] {
  const columns: { name: string; type: string }[] = [];

  // Match column definitions between parentheses
  const createMatch = sql.match(/CREATE TABLE[^(]+\(([\s\S]+?)\);/i);
  if (!createMatch) return columns;

  const columnDefs = createMatch[1];

  // Split by commas (but not commas inside parentheses)
  const lines = columnDefs.split('\n').map((line) => line.trim()).filter((line) => line);

  for (const line of lines) {
    // Skip constraint lines (PRIMARY KEY, FOREIGN KEY, etc.)
    if (line.toUpperCase().includes('PRIMARY KEY') ||
        line.toUpperCase().includes('FOREIGN KEY') ||
        line.toUpperCase().includes('CONSTRAINT')) {
      continue;
    }

    // Extract column name and type
    const match = line.match(/^(\w+)\s+(VARCHAR\([^)]+\)|INTEGER|DECIMAL\([^)]+\)|BOOLEAN|DATE|TIMESTAMP|\w+)/i);
    if (match) {
      columns.push({
        name: match[1],
        type: match[2],
      });
    }
  }

  return columns;
}

/**
 * Parse INSERT INTO statements to extract data rows
 */
function parseInsertValues(sql: string): string[][] {
  const rows: string[][] = [];

  // Match all INSERT INTO ... VALUES statements
  const insertMatches = Array.from(sql.matchAll(/INSERT INTO[^V]+VALUES\s*([\s\S]+?);/gi));

  for (const match of insertMatches) {
    const valuesStr = match[1];

    // Extract individual rows (each row is wrapped in parentheses)
    const rowMatches = Array.from(valuesStr.matchAll(/\(([^)]+)\)/g));

    for (const rowMatch of rowMatches) {
      const rowStr = rowMatch[1];

      // Split by commas, handling quoted strings
      const values = splitCSVRow(rowStr);
      rows.push(values);
    }
  }

  return rows;
}

/**
 * Split a row by commas, respecting quoted strings
 */
function splitCSVRow(row: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === "'" && (i === 0 || row[i - 1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current) {
    values.push(current.trim());
  }

  return values.map((v) => v.replace(/^'|'$/g, '')); // Remove surrounding quotes
}

/**
 * Get available datasets from the SQL
 */
export function getAvailableDatasets(): DatasetInfo[] {
  const datasets: DatasetInfo[] = [];

  // Split by table definitions
  const tableSections = testDatasetsSQL.split(/-- TABLE:/);

  for (let i = 1; i < tableSections.length; i++) {
    const section = tableSections[i];

    // Extract table name from comment
    const nameMatch = section.match(/^([^(]+)/);
    if (!nameMatch) continue;

    const tableName = nameMatch[1].trim();
    const description = tableName;

    // Extract CREATE TABLE statement
    const createMatch = section.match(/CREATE TABLE[\s\S]+?\);/i);
    if (!createMatch) continue;

    const columns = parseCreateTable(createMatch[0]);

    // Extract INSERT statements
    const insertMatch = section.match(/INSERT INTO[\s\S]+?(?=(?:--\s*TABLE:|--\s*=====|$))/i);
    const sampleRows = insertMatch ? parseInsertValues(insertMatch[0]) : [];

    datasets.push({
      name: tableName.replace(/\s*\([^)]*\)/, ''), // Remove description in parentheses
      tableName: extractTableName(createMatch[0]),
      description,
      columns,
      sampleRows,
    });
  }

  return datasets;
}

/**
 * Extract table name from CREATE TABLE statement
 */
function extractTableName(sql: string): string {
  const match = sql.match(/CREATE TABLE\s+(\w+)/i);
  return match ? match[1] : 'unknown';
}

/**
 * Generate CSV string from dataset
 */
export function generateDatasetCSV(datasetName: string): string {
  const datasets = getAvailableDatasets();
  const dataset = datasets.find(
    (d) => d.tableName.toLowerCase() === datasetName.toLowerCase() ||
           d.name.toLowerCase() === datasetName.toLowerCase()
  );

  if (!dataset) {
    throw new Error(`Dataset "${datasetName}" not found`);
  }

  // Build CSV header
  const header = dataset.columns.map((col) => col.name).join(',');

  // Build CSV rows
  const rows = dataset.sampleRows.map((row) =>
    row.map((value) => formatCSVValue(value)).join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Format a value for CSV output
 */
function formatCSVValue(value: string): string {
  // Handle null/empty
  if (!value || value === 'NULL') return '';

  // Quote values that contain commas, quotes, or newlines
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Get dataset schema as human-readable text
 */
export function getDatasetSchema(datasetName: string): string {
  const datasets = getAvailableDatasets();
  const dataset = datasets.find(
    (d) => d.tableName.toLowerCase() === datasetName.toLowerCase() ||
           d.name.toLowerCase() === datasetName.toLowerCase()
  );

  if (!dataset) return '';

  let schema = `Table: ${dataset.tableName}\n`;
  schema += `Description: ${dataset.description}\n\n`;
  schema += 'Columns:\n';

  for (const col of dataset.columns) {
    schema += `  ${col.name}: ${col.type}\n`;
  }

  return schema;
}
