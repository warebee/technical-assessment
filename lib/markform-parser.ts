import matter from 'gray-matter';

/**
 * Markform Parser
 *
 * Parses .form.md files with Markform syntax to extract:
 * - YAML frontmatter (metadata)
 * - Field definitions (from HTML comments)
 * - Visible markdown content (scenarios, code samples)
 * - Section groups
 */

export interface MarkformField {
  id: string;
  kind: 'string' | 'single_select' | 'checkboxes' | 'table' | 'number';
  label: string;
  role: 'agent' | 'user';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  options?: Array<{ id: string; label: string; description?: string }>;
}

export interface MarkformGroup {
  id: string;
  title: string;
  fields: MarkformField[];
  content: string; // Markdown content (scenarios, code samples)
}

export interface ParsedForm {
  metadata: {
    title: string;
    description: string;
    version?: string;
    targetScore?: string;
    roles?: string[];
  };
  groups: MarkformGroup[];
}

/**
 * Parse a Markform .form.md file
 */
export function parseMarkform(content: string): ParsedForm {
  // Parse YAML frontmatter
  const { data: frontmatter, content: body } = matter(content);

  // Extract metadata from frontmatter
  const metadata = {
    title: frontmatter.markform?.title || 'Untitled Form',
    description: frontmatter.markform?.description || '',
    version: frontmatter.markform?.version,
    targetScore: frontmatter.markform?.target_score,
    roles: frontmatter.markform?.roles || ['agent'],
  };

  // Parse groups and fields
  const groups = parseGroups(body);

  return {
    metadata,
    groups,
  };
}

/**
 * Parse groups from the form body
 */
function parseGroups(body: string): MarkformGroup[] {
  const groups: MarkformGroup[] = [];

  // Regex to match group tags: <!-- group id="..." title="..." -->
  const groupRegex = /<!-- group id="([^"]+)" title="([^"]+)" -->([\s\S]*?)<!-- \/group -->/g;

  let match;
  while ((match = groupRegex.exec(body)) !== null) {
    const [, id, title, groupContent] = match;

    // Parse fields within this group
    const fields = parseFields(groupContent);

    // Extract visible markdown content (everything except field tags)
    const content = extractVisibleContent(groupContent);

    groups.push({
      id,
      title,
      fields,
      content,
    });
  }

  return groups;
}

/**
 * Parse field definitions from group content
 */
function parseFields(groupContent: string): MarkformField[] {
  const fields: MarkformField[] = [];

  // Regex to match field tags: <!-- field kind="..." id="..." ... -->
  // Use a flexible regex that captures all attributes (quoted or unquoted)
  const fieldRegex = /<!-- field\s+(.+?)\s*-->/g;

  let match;
  while ((match = fieldRegex.exec(groupContent)) !== null) {
    const attributesStr = match[1];
    const field = parseFieldAttributes(attributesStr);

    if (field) {
      fields.push(field);
    }
  }

  return fields;
}

/**
 * Parse field attributes from the field tag
 */
function parseFieldAttributes(attributesStr: string): MarkformField | null {
  // Extract attributes using regex - supports both quoted and unquoted values
  // Matches: attr="value" OR attr=value (for boolean/number values)
  const attrRegex = /(\w+)=(?:"([^"]*)"|(\S+?)(?=\s+\w+=|\s*$))/g;
  const attributes: Record<string, string> = {};

  let match;
  while ((match = attrRegex.exec(attributesStr)) !== null) {
    // match[1] is the attribute name
    // match[2] is the quoted value (if present)
    // match[3] is the unquoted value (if present)
    attributes[match[1]] = match[2] !== undefined ? match[2] : match[3];
  }

  // Validate required attributes
  if (!attributes.kind || !attributes.id || !attributes.label) {
    console.warn('Field missing required attributes:', attributesStr);
    return null;
  }

  const field: MarkformField = {
    id: attributes.id,
    kind: attributes.kind as MarkformField['kind'],
    label: attributes.label,
    role: (attributes.role as 'agent' | 'user') || 'agent',
    required: attributes.required === 'true',
  };

  // Optional numeric attributes
  if (attributes.minLength) {
    field.minLength = parseInt(attributes.minLength, 10);
  }
  if (attributes.maxLength) {
    field.maxLength = parseInt(attributes.maxLength, 10);
  }

  // Parse options for select/checkbox fields
  if (field.kind === 'single_select' || field.kind === 'checkboxes') {
    field.options = parseFieldOptions(attributesStr);
  }

  return field;
}

/**
 * Parse options for select/checkbox fields
 * Options are defined as markdown list items between field tags:
 * - [ ] Label <!-- #id -->
 */
function parseFieldOptions(fieldContent: string): Array<{ id: string; label: string; description?: string }> {
  const options: Array<{ id: string; label: string; description?: string }> = [];

  // This is a simplified parser - in practice, you'd need to extract the content
  // between <!-- field --> and <!-- /field --> tags and parse the markdown list

  // For now, return empty array - this will be populated when we extract
  // the full field content including the list items
  return options;
}

/**
 * Extract visible markdown content (excluding field tags and comments)
 */
function extractVisibleContent(groupContent: string): string {
  // Remove HTML comments (field tags, group tags, etc.)
  let content = groupContent;

  // Remove field opening and closing tags
  content = content.replace(/<!-- field\s+[^>]*-->/g, '');
  content = content.replace(/<!-- \/field -->/g, '');

  // Trim excess whitespace
  content = content.trim();

  return content;
}

/**
 * Enhanced field parser that extracts options from markdown content
 */
export function parseFieldWithOptions(
  fieldTag: string,
  contentBetweenTags: string
): MarkformField | null {
  const field = parseFieldAttributes(fieldTag);

  if (!field) return null;

  // If it's a select or checkbox field, parse options from markdown list
  if (field.kind === 'single_select' || field.kind === 'checkboxes') {
    const options = parseOptionsFromMarkdown(contentBetweenTags);
    field.options = options;
  }

  return field;
}

/**
 * Parse options from markdown checkbox list
 * Format: - [ ] Label <!-- #id -->
 */
function parseOptionsFromMarkdown(content: string): Array<{ id: string; label: string; description?: string }> {
  const options: Array<{ id: string; label: string; description?: string }> = [];

  // Regex to match checkbox list items with optional ID comment
  const optionRegex = /^- \[ \] (.+?)(?:\s*<!-- #(\w+) -->)?$/gm;

  let match;
  while ((match = optionRegex.exec(content)) !== null) {
    const label = match[1].trim();
    const id = match[2] || generateIdFromLabel(label);

    options.push({
      id,
      label,
    });
  }

  return options;
}

/**
 * Generate a field ID from a label
 */
function generateIdFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Enhanced parser that properly extracts field content including options
 */
export function parseMarkformEnhanced(content: string): ParsedForm {
  const { data: frontmatter, content: body } = matter(content);

  const metadata = {
    title: frontmatter.markform?.title || 'Untitled Form',
    description: frontmatter.markform?.description || '',
    version: frontmatter.markform?.version,
    targetScore: frontmatter.markform?.target_score,
    roles: frontmatter.markform?.roles || ['agent'],
  };

  const groups = parseGroupsEnhanced(body);

  return {
    metadata,
    groups,
  };
}

/**
 * Enhanced group parser that properly extracts field content
 */
function parseGroupsEnhanced(body: string): MarkformGroup[] {
  const groups: MarkformGroup[] = [];

  // Match group tags
  const groupRegex = /<!-- group id="([^"]+)" title="([^"]+)" -->([\s\S]*?)<!-- \/group -->/g;

  let match;
  while ((match = groupRegex.exec(body)) !== null) {
    const [, id, title, groupContent] = match;

    // Parse fields with their content
    const fields = parseFieldsEnhanced(groupContent);

    // Extract visible markdown content
    const content = extractVisibleContent(groupContent);

    groups.push({
      id,
      title,
      fields,
      content,
    });
  }

  return groups;
}

/**
 * Enhanced field parser that extracts content between field tags
 */
function parseFieldsEnhanced(groupContent: string): MarkformField[] {
  const fields: MarkformField[] = [];

  // Match field opening tag, content, and closing tag
  // Use a more flexible regex that captures all attributes (quoted or unquoted)
  const fieldRegex = /<!-- field\s+(.+?)\s*-->([\s\S]*?)<!-- \/field -->/g;

  let match;
  while ((match = fieldRegex.exec(groupContent)) !== null) {
    const [, attributesStr, fieldContent] = match;
    const field = parseFieldWithOptions(attributesStr, fieldContent);

    if (field) {
      fields.push(field);
    }
  }

  return fields;
}

/**
 * Utility: Get all field IDs from a parsed form (useful for validation)
 */
export function getAllFieldIds(form: ParsedForm): string[] {
  const ids: string[] = [];

  for (const group of form.groups) {
    for (const field of group.fields) {
      ids.push(field.id);
    }
  }

  return ids;
}

/**
 * Utility: Validate that all field IDs are unique
 */
export function validateFieldIds(form: ParsedForm): { valid: boolean; duplicates: string[] } {
  const ids = getAllFieldIds(form);
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }

  return {
    valid: duplicates.length === 0,
    duplicates,
  };
}

/**
 * Utility: Get form statistics
 */
export function getFormStats(form: ParsedForm) {
  let totalFields = 0;
  let requiredFields = 0;
  let optionalFields = 0;

  for (const group of form.groups) {
    totalFields += group.fields.length;

    for (const field of group.fields) {
      if (field.required) {
        requiredFields++;
      } else {
        optionalFields++;
      }
    }
  }

  return {
    totalGroups: form.groups.length,
    totalFields,
    requiredFields,
    optionalFields,
  };
}

/**
 * Build a lookup map from field ID to question context
 * Returns { fieldId: { groupTitle, groupContent, fieldLabel, fieldId } }
 */
export function buildQuestionContextMap(form: ParsedForm): Record<string, {
  groupTitle: string;
  groupContent: string;
  fieldLabel: string;
  fieldId: string;
  isBonus: boolean;
}> {
  const map: Record<string, {
    groupTitle: string;
    groupContent: string;
    fieldLabel: string;
    fieldId: string;
    isBonus: boolean;
  }> = {};

  for (const group of form.groups) {
    for (const field of group.fields) {
      map[field.id] = {
        groupTitle: group.title,
        groupContent: group.content,
        fieldLabel: field.label,
        fieldId: field.id,
        isBonus: field.label.toUpperCase().includes('BONUS'),
      };
    }
  }

  return map;
}

/**
 * Merge multiple forms into one (for multi-role assessments)
 */
export function mergeForms(forms: ParsedForm[]): ParsedForm {
  if (forms.length === 0) {
    return {
      metadata: { title: 'Empty', description: '' },
      groups: [],
    };
  }

  if (forms.length === 1) {
    return forms[0];
  }

  // Merge metadata
  const versions = forms.map(f => f.metadata.version).filter(Boolean);
  const titles = forms.map(f => f.metadata.title);

  // Merge groups (deduplicate by id)
  const groupMap = new Map<string, MarkformGroup>();
  for (const form of forms) {
    for (const group of form.groups) {
      if (!groupMap.has(group.id)) {
        groupMap.set(group.id, group);
      }
    }
  }

  return {
    metadata: {
      title: titles.join(' + '),
      description: forms[0].metadata.description,
      version: versions.join(', '),
      targetScore: forms.map(f => f.metadata.targetScore).filter(Boolean).join(', '),
      roles: [...new Set(forms.flatMap(f => f.metadata.roles || []))],
    },
    groups: Array.from(groupMap.values()),
  };
}
