import type { QuestionWithAnswer } from "@/lib/form-loader";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import React from "react";

interface AssessmentSubmissionEmailProps {
  candidateName: string;
  candidateEmail: string;
  role: "junior" | "mid" | "senior";
  roles?: string[];
  answers: Record<string, string | string[]>;
  timestamp: string;
  // New: structured data with questions
  formVersion?: string;
  sections?: Array<{
    title: string;
    content: string;
    questions: QuestionWithAnswer[];
  }>;
}

const roleNames: Record<string, string> = {
  junior: "Junior Implementation",
  mid: "Mid-Level Implementation",
  senior: "Senior Implementation",
};

const targetScores: Record<string, string> = {
  junior: "60-75 points",
  mid: "76-90 points",
  senior: "91+ points",
};

export default function AssessmentSubmissionEmail({
  candidateName,
  candidateEmail,
  role,
  roles,
  answers,
  timestamp,
  formVersion,
  sections,
}: AssessmentSubmissionEmailProps) {
  // Support both single role and multiple roles
  const allRoles = roles || [role];
  const roleNamesStr = allRoles.map((r) => roleNames[r] || r).join(" + ");
  const targetScoresStr = allRoles
    .map((r) => targetScores[r] || "")
    .filter(Boolean)
    .join(", ");

  // Format timestamp
  const submittedAt = new Date(timestamp).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  // Use new sections format if available, otherwise fall back to legacy format
  const useLegacyFormat = !sections || sections.length === 0;

  // Legacy: Separate candidate info from answers and group them
  const { candidate_name, candidate_email, ...actualAnswers } = answers;
  const questionGroups = useLegacyFormat
    ? groupAnswersByQuestion(actualAnswers)
    : null;

  return (
    <Html>
      <Head />
      <Preview>
        Assessment Submission: {roleNamesStr} - {candidateName}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.h1}>Assessment Submission</Heading>
            <Text style={styles.headerSubtext}>
              {roleNamesStr} - Target: {targetScoresStr}
            </Text>
            {formVersion && (
              <Text style={styles.versionBadge}>Form v{formVersion}</Text>
            )}
          </Section>

          {/* Candidate Info */}
          <Section style={styles.section}>
            <Heading style={styles.h2}>Candidate Information</Heading>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{candidateName}</Text>
              </div>
              <div style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>
                  <Link href={`mailto:${candidateEmail}`} style={styles.link}>
                    {candidateEmail}
                  </Link>
                </Text>
              </div>
              <div style={styles.infoItem}>
                <Text style={styles.infoLabel}>Submitted:</Text>
                <Text style={styles.infoValue}>{submittedAt}</Text>
              </div>
              <div style={styles.infoItem}>
                <Text style={styles.infoLabel}>Role Level(s):</Text>
                <Text style={styles.infoValue}>{roleNamesStr}</Text>
              </div>
            </div>
          </Section>

          <Hr style={styles.hr} />

          {/* Answers with Question Context (New Format) */}
          {!useLegacyFormat && sections && (
            <Section style={styles.section}>
              <Heading style={styles.h2}>Assessment Responses</Heading>
              <Text style={styles.helpText}>
                Questions and answers are shown together for easy grading. JSON
                data is attached.
              </Text>

              {sections.map((section, sIdx) => (
                <div key={sIdx} style={styles.sectionBlock}>
                  {/* Section Header */}
                  <Heading style={styles.sectionTitle}>{section.title}</Heading>

                  {/* Question Context (Markdown rendered as text) */}
                  {section.content && (
                    <div style={styles.questionContext}>
                      <Text style={styles.contextLabel}>Question Context:</Text>
                      <div style={styles.contextBox}>
                        {renderMarkdownAsText(section.content)}
                      </div>
                    </div>
                  )}

                  {/* Tasks/Answers */}
                  <div style={styles.tasksContainer}>
                    {section.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        style={
                          q.isBonus ? styles.bonusBlock : styles.questionBlock
                        }
                      >
                        {/* Task Label */}
                        <div style={styles.taskHeader}>
                          <Text style={styles.taskLabel}>
                            {q.isBonus && (
                              <span style={styles.bonusBadge}>* BONUS</span>
                            )}
                            {q.fieldLabel}
                          </Text>
                        </div>

                        {/* Answer */}
                        <div style={styles.answerBox}>
                          {renderAnswer(q.answer)}
                        </div>

                        {/* Comment if present */}
                        {q.comment && (
                          <div style={styles.commentBox}>
                            <Text style={styles.commentLabel}>
                              Additional Notes:
                            </Text>
                            <Text style={styles.commentText}>{q.comment}</Text>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Legacy Format (fallback) */}
          {useLegacyFormat && questionGroups && (
            <Section style={styles.section}>
              <Heading style={styles.h2}>Assessment Answers</Heading>
              <Text style={styles.helpText}>
                Detailed JSON data is attached. Below is a formatted view for
                quick review.
              </Text>

              {Object.entries(questionGroups).map(
                ([section, questions], idx) => (
                  <div key={idx} style={styles.questionSection}>
                    <Heading style={styles.h3}>{section}</Heading>

                    {Object.entries(questions).map(
                      ([question, answer], qIdx) => (
                        <div key={qIdx} style={styles.questionBlock}>
                          <Text style={styles.questionLabel}>{question}</Text>
                          <div style={styles.answerBox}>
                            {renderAnswer(answer)}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ),
              )}
            </Section>
          )}

          <Hr style={styles.hr} />

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              <strong>Next Steps:</strong>
            </Text>
            <ul style={styles.footerList}>
              <li>
                Review answers using the ANSWER_KEY_SAMPLE.md grading guide
              </li>
              <li>
                Score based on the rubric in IMPLEMENTATION_ROLE_QUESTIONS.md
              </li>
              <li>
                Check JSON attachment for structured data and programmatic
                analysis
              </li>
              <li>Provide feedback to candidate within 3-5 business days</li>
            </ul>

            <Text style={styles.helpText}>
              Questions? Refer to ASSESSMENT_ADMINISTRATION_GUIDE.md
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Helper: Render markdown content as plain text (simplified)
function renderMarkdownAsText(markdown: string) {
  // Split into lines and process
  const lines = markdown.split("\n");
  const elements: React.ReactElement[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];

  lines.forEach((line, idx) => {
    // Code block detection
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre key={`code-${idx}`} style={styles.codeBlock}>
            <code>{codeContent.join("\n")}</code>
          </pre>,
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <Text key={idx} style={styles.contextH3}>
          {line.replace("### ", "")}
        </Text>,
      );
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <Text key={idx} style={styles.contextH2}>
          {line.replace("## ", "")}
        </Text>,
      );
      return;
    }

    // Bold text (context labels like **Context:**)
    if (line.startsWith("**") && line.includes(":**")) {
      elements.push(
        <Text key={idx} style={styles.contextStrong}>
          {line.replace(/\*\*/g, "")}
        </Text>,
      );
      return;
    }

    // Italic text (scenario descriptions)
    if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
      elements.push(
        <Text key={idx} style={styles.contextEm}>
          {line.replace(/^\*|\*$/g, "")}
        </Text>,
      );
      return;
    }

    // Table rows (simplified - show as monospace)
    if (line.includes("|") && line.trim().startsWith("|")) {
      elements.push(
        <Text key={idx} style={styles.tableRow}>
          {line}
        </Text>,
      );
      return;
    }

    // Regular text
    if (line.trim()) {
      elements.push(
        <Text key={idx} style={styles.contextText}>
          {line}
        </Text>,
      );
    }
  });

  return elements;
}

// Helper: Group answers by question section (legacy)
function groupAnswersByQuestion(
  answers: Record<string, string | string[]>,
): Record<string, Record<string, string | string[]>> {
  const groups: Record<string, Record<string, string | string[]>> = {};

  for (const [key, value] of Object.entries(answers)) {
    // Skip empty answers and comments
    if (!value || (Array.isArray(value) && value.length === 0)) continue;
    if (key.endsWith("_comment")) continue;

    // Extract section from key (e.g., "q1_1_problem" -> "Section 1")
    const match = key.match(/^q(\d+)_/);
    if (match) {
      const sectionNum = match[1];
      const sectionKey = `Section ${sectionNum}`;

      if (!groups[sectionKey]) {
        groups[sectionKey] = {};
      }

      // Format question label from field ID
      const questionLabel = formatQuestionLabel(key);
      groups[sectionKey][questionLabel] = value;
    }
  }

  return groups;
}

// Helper: Format question label from field ID
function formatQuestionLabel(fieldId: string): string {
  // Convert "q1_1_problem" -> "Q1.1: Problem"
  const parts = fieldId.replace(/^q/, "").split("_");
  if (parts.length >= 2) {
    const questionNum = `${parts[0]}.${parts[1]}`;
    const label = parts.slice(2).join(" ");
    return `Q${questionNum}: ${label.charAt(0).toUpperCase() + label.slice(1)}`;
  }
  return fieldId;
}

// Helper: Render answer based on type
function renderAnswer(answer: string | string[]) {
  if (!answer || (Array.isArray(answer) && answer.length === 0)) {
    return <Text style={styles.noAnswer}>No answer provided</Text>;
  }

  if (Array.isArray(answer)) {
    return (
      <ul style={styles.answerList}>
        {answer.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    );
  }

  // Check if it's a SQL query (contains SELECT, WITH, etc.)
  if (answer.match(/\b(SELECT|WITH|INSERT|UPDATE|DELETE|CREATE)\b/i)) {
    return (
      <pre style={styles.codeBlock}>
        <code>{answer}</code>
      </pre>
    );
  }

  return <Text style={styles.answerText}>{answer}</Text>;
}

// Styles
const styles = {
  body: {
    backgroundColor: "#f8fafc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
  },
  header: {
    backgroundColor: "#1e40af",
    color: "#ffffff",
    padding: "32px",
    textAlign: "center" as const,
  },
  h1: {
    margin: "0 0 8px 0",
    fontSize: "32px",
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSubtext: {
    margin: 0,
    fontSize: "16px",
    color: "#dbeafe",
  },
  versionBadge: {
    display: "inline-block",
    marginTop: "12px",
    padding: "4px 12px",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#ffffff",
  },
  section: {
    padding: "32px",
  },
  h2: {
    margin: "0 0 16px 0",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#0f172a",
  },
  h3: {
    margin: "24px 0 12px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#334155",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  infoItem: {
    marginBottom: "8px",
  },
  infoLabel: {
    margin: "0 0 4px 0",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase" as const,
  },
  infoValue: {
    margin: 0,
    fontSize: "16px",
    color: "#0f172a",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "0",
  },
  helpText: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    color: "#64748b",
  },
  // New section styles
  sectionBlock: {
    marginBottom: "40px",
    paddingBottom: "24px",
    borderBottom: "2px solid #e2e8f0",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e40af",
    backgroundColor: "#eff6ff",
    padding: "12px 16px",
    borderRadius: "6px",
  },
  questionContext: {
    marginBottom: "24px",
  },
  contextLabel: {
    margin: "0 0 8px 0",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase" as const,
  },
  contextBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "16px",
  },
  contextH2: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
  },
  contextH3: {
    margin: "12px 0 8px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },
  contextStrong: {
    margin: "8px 0",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },
  contextEm: {
    margin: "8px 0",
    fontSize: "13px",
    fontStyle: "italic",
    color: "#475569",
    backgroundColor: "#fef3c7",
    padding: "8px 12px",
    borderRadius: "4px",
    borderLeft: "3px solid #f59e0b",
  },
  contextText: {
    margin: "4px 0",
    fontSize: "13px",
    color: "#475569",
  },
  tableRow: {
    margin: "0",
    fontSize: "11px",
    fontFamily: "monospace",
    color: "#475569",
    lineHeight: "1.4",
  },
  tasksContainer: {
    marginTop: "16px",
  },
  taskHeader: {
    marginBottom: "8px",
  },
  taskLabel: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  bonusBadge: {
    display: "inline-block",
    marginRight: "8px",
    padding: "2px 8px",
    backgroundColor: "#fef3c7",
    color: "#b45309",
    borderRadius: "4px",
    fontSize: "12px",
  },
  questionSection: {
    marginBottom: "24px",
  },
  questionBlock: {
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
  },
  bonusBlock: {
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
    borderLeft: "4px solid #f59e0b",
    paddingLeft: "16px",
    marginLeft: "-16px",
  },
  questionLabel: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
  },
  answerBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    padding: "12px",
  },
  answerText: {
    margin: 0,
    fontSize: "14px",
    color: "#0f172a",
    whiteSpace: "pre-wrap" as const,
  },
  answerList: {
    margin: 0,
    paddingLeft: "20px",
    fontSize: "14px",
    color: "#0f172a",
  },
  noAnswer: {
    margin: 0,
    fontSize: "14px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  codeBlock: {
    margin: 0,
    padding: "12px",
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    borderRadius: "4px",
    fontSize: "13px",
    fontFamily: "monospace",
    overflow: "auto",
    whiteSpace: "pre-wrap" as const,
  },
  commentBox: {
    marginTop: "12px",
    padding: "12px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "4px",
  },
  commentLabel: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    fontWeight: "600",
    color: "#166534",
    textTransform: "uppercase" as const,
  },
  commentText: {
    margin: 0,
    fontSize: "13px",
    color: "#166534",
  },
  footer: {
    padding: "32px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
  },
  footerText: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    color: "#334155",
  },
  footerList: {
    margin: "0 0 16px 0",
    paddingLeft: "20px",
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.6",
  },
};
