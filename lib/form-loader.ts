import { readFileSync } from "fs";
import { join } from "path";
import { parseMarkformEnhanced, ParsedForm, buildQuestionContextMap, mergeForms } from "./markform-parser";
import { getFormFileForRole } from "./form-discovery";

/**
 * Load a form file by role ID
 * Uses auto-discovered form files from /forms directory
 */
export function loadFormByRole(roleId: string): ParsedForm | null {
  const filename = getFormFileForRole(roleId);
  if (!filename) {
    console.warn(`No form file found for role: ${roleId}`);
    return null;
  }

  try {
    const filePath = join(process.cwd(), "forms", filename);
    const content = readFileSync(filePath, "utf-8");
    return parseMarkformEnhanced(content);
  } catch (error) {
    console.error(`Failed to load form for role ${roleId}:`, error);
    return null;
  }
}

/**
 * Load and merge forms for multiple roles
 */
export function loadFormsByRoles(roles: string[]): ParsedForm | null {
  const forms: ParsedForm[] = [];

  for (const role of roles) {
    const form = loadFormByRole(role);
    if (form) {
      forms.push(form);
    }
  }

  if (forms.length === 0) return null;

  return mergeForms(forms);
}

/**
 * Get question context for submission email
 * Maps field IDs to their question context (group title, markdown content, field label)
 */
export function getQuestionContextForSubmission(roles: string[]): {
  version: string;
  questionMap: Record<string, {
    groupTitle: string;
    groupContent: string;
    fieldLabel: string;
    fieldId: string;
    isBonus: boolean;
  }>;
} | null {
  const form = loadFormsByRoles(roles);
  if (!form) return null;

  return {
    version: form.metadata.version || 'unknown',
    questionMap: buildQuestionContextMap(form),
  };
}

/**
 * Structure for email with question context
 */
export interface QuestionWithAnswer {
  groupTitle: string;
  groupContent: string;
  fieldLabel: string;
  fieldId: string;
  isBonus: boolean;
  answer: string | string[];
  comment?: string;
}

/**
 * Build structured data for email with questions and answers together
 */
export function buildEmailData(
  roles: string[],
  answers: Record<string, string | string[]>
): {
  version: string;
  sections: Array<{
    title: string;
    content: string;
    questions: QuestionWithAnswer[];
  }>;
} | null {
  const form = loadFormsByRoles(roles);
  if (!form) return null;

  // Filter out candidate_info group
  const groups = form.groups.filter(g => g.id !== 'candidate_info' && g.id !== 'submission');

  const sections = groups.map(group => {
    const questions: QuestionWithAnswer[] = group.fields.map(field => ({
      groupTitle: group.title,
      groupContent: group.content,
      fieldLabel: field.label,
      fieldId: field.id,
      isBonus: field.label.toUpperCase().includes('BONUS'),
      answer: answers[field.id] || '',
      comment: answers[`${field.id}_comment`] as string | undefined,
    })).filter(q => {
      // Include if has answer (or is bonus with answer)
      const hasAnswer = Array.isArray(q.answer) ? q.answer.length > 0 : q.answer && q.answer.trim().length > 0;
      return hasAnswer || q.comment;
    });

    return {
      title: group.title,
      content: group.content,
      questions,
    };
  }).filter(section => section.questions.length > 0);

  return {
    version: form.metadata.version || 'unknown',
    sections,
  };
}
