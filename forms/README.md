# Assessment Forms Guide

## Overview

This directory contains Markform-based assessment forms for evaluating Implementation Role candidates at different experience levels. Each form is designed as an interactive questionnaire that candidates complete in a web UI, with results automatically emailed to the evaluation team.

## Available Forms

### 1. Junior Implementation ([junior-implementation.form.md](./junior-implementation.form.md))
- **Target Audience:** 0-2 years of experience
- **Target Score:** 60-75 points
- **Duration:** Approximately 90-120 minutes
- **Sections Covered:**
  - Section 1: Data Quality & Deduplication (Q1.1)
  - Section 2: Data Joins & Enrichment (Q2.1)
  - Section 3: ABC Analysis & Statistics (Q3.1)
  - Section 4: Window Functions (Q4.1 - partial, tasks 1-2 only)

**Skills Assessed:**
- Basic SQL syntax and query structure
- Simple joins and deduplication
- Window functions (LAG/LEAD)
- Basic ABC analysis
- Problem-solving approach

### 2. Mid-Level Implementation ([mid-implementation.form.md](./mid-implementation.form.md))
- **Target Audience:** 2-5 years of experience
- **Target Score:** 76-90 points
- **Duration:** Approximately 150-180 minutes
- **Sections Covered:**
  - Section 1: Multi-Column Deduplication (Q1.2 + BONUS)
  - Section 2: Complex Joins (Q2.2 + BONUS)
  - Section 3: ABC with PARTITION BY (Q3.2 + BONUS)
  - Section 4: Window Functions (Q4.1 - all tasks + BONUS)
  - Section 5: Root Cause Analysis (Q5.1 + BONUS)
  - Section 6: Performance Optimization (Q6.1 - BONUS section)

**Skills Assessed:**
- Advanced window functions
- Complex join strategies
- Multi-tenant data patterns
- Root cause analysis
- Performance considerations
- BONUS tasks test edge case handling

### 3. Senior Implementation ([senior-implementation.form.md](./senior-implementation.form.md))
- **Target Audience:** 5+ years of experience
- **Target Score:** 91+ points
- **Duration:** Approximately 240-300 minutes
- **Sections Covered:**
  - All core sections (1-5) with advanced questions
  - All bonus sections (6-8)
  - Includes alternative approaches and performance analysis

**Skills Assessed:**
- Mastery of SQL and window functions
- Query optimization and performance tuning
- Data validation and quality assurance
- Systematic troubleshooting
- Alternative solution analysis
- Trade-off evaluation

## How to Use

### For Candidates

1. **Select Your Form**
   - Navigate to `/assessment/junior`, `/assessment/mid`, or `/assessment/senior`
   - Choose based on your years of experience

2. **Complete Candidate Information**
   - Provide your full name and email address
   - This information is used to identify your submission

3. **Answer All Questions**
   - Required fields are marked and must be completed
   - BONUS tasks are optional but demonstrate advanced expertise
   - SQL queries should be properly formatted and executable
   - Explanations should be clear and concise

4. **Review Before Submitting**
   - Check all answers for completeness
   - Ensure SQL syntax is correct
   - Review explanations for clarity

5. **Submit**
   - Click the submit button
   - You'll receive a confirmation message
   - Results are automatically emailed to the evaluation team

### For Evaluators

1. **Receive Submission Email**
   - Automated email contains candidate information
   - All questions and answers are formatted for easy review
   - JSON attachment included for structured data

2. **Grade Using Answer Key**
   - Reference: `../ANSWER_KEY_SAMPLE.md`
   - Follow partial credit guidelines
   - Use scoring rubric from `../IMPLEMENTATION_ROLE_QUESTIONS.md`

3. **Document Scoring**
   - Core questions: Points out of 100
   - Bonus questions: Additional points (up to 40)
   - Note strong areas and areas for improvement

4. **Provide Feedback**
   - Share results with candidate
   - Highlight strengths
   - Suggest areas for growth
   - Make hire/no-hire recommendation

## Scoring Guidelines

### Point Allocation

**Core Questions (Required):**
- Section 1: Data Quality & Deduplication = 20 points
- Section 2: Data Joins & Enrichment = 20 points
- Section 3: ABC Analysis & Statistics = 15 points
- Section 4: Window Functions & Sequence Analysis = 20 points
- Section 5: Root Cause Analysis = 25 points
- **Total Core:** 100 points

**Bonus Questions (Optional):**
- Section 6: Performance & Optimization = 15 points
- Section 7: Practical Scenarios = 15 points
- Section 8: Data Validation & Quality = 10 points
- **Total Bonus:** 40 points

### Passing Thresholds

| Role Level | Minimum Score | Expected Range | Ideal Score |
|------------|---------------|----------------|-------------|
| Junior | 60 points | 60-75 points | 70+ points |
| Mid-Level | 76 points | 76-90 points | 85+ points |
| Senior | 91 points | 91-120 points | 105+ points |

### Evaluation Criteria

For each answer, grade based on:

1. **SQL Correctness (40%)**
   - Does the query run without errors?
   - Returns correct results for all test cases?
   - Handles edge cases appropriately?

2. **Approach & Logic (30%)**
   - Is the solution well-structured?
   - Uses appropriate SQL features?
   - Demonstrates clear thinking?

3. **Edge Case Handling (15%)**
   - Considers NULL values?
   - Handles empty sets?
   - Accounts for data quality issues?

4. **Explanation Quality (15%)**
   - Can the candidate explain their reasoning?
   - Demonstrates understanding of trade-offs?
   - Communicates clearly?

## Technical Setup

### Markform Structure

Each `.form.md` file uses Markform syntax with:

- **YAML frontmatter** - Form metadata
- **HTML comments** - Field definitions (invisible on GitHub)
- **Markdown content** - Visible questions and scenarios
- **Field types** - string, single_select, checkboxes

### Field Validation

All fields include validation rules:
- `required=true` - Must be filled out
- `minLength` - Minimum character count
- `maxLength` - Maximum character count
- `role="agent"` - Filled by candidate (or AI agent)

### Email Integration

Form submission triggers automated email with:
- Candidate name and email
- Role level (Junior/Mid/Senior)
- Submission timestamp
- All questions and answers (formatted HTML)
- JSON attachment (for programmatic processing)

## File Structure

```
forms/
├── README.md                          # This file
├── junior-implementation.form.md     # Junior role assessment
├── mid-implementation.form.md        # Mid-level role assessment
└── senior-implementation.form.md     # Senior role assessment
```

## Related Resources

- **Answer Key:** `../ANSWER_KEY_SAMPLE.md`
  - Correct solutions for all questions
  - Partial credit guidelines
  - Common mistakes to watch for

- **Question Bank:** `../IMPLEMENTATION_ROLE_QUESTIONS.md`
  - Full question reference
  - Detailed scoring rubric
  - Skills assessed per question

- **Administration Guide:** `../ASSESSMENT_ADMINISTRATION_GUIDE.md`
  - Interview facilitation tips
  - Scoring calibration guidance
  - Red flags by question type

## FAQ

### Can candidates use online resources during the assessment?
**Yes**, this is an open-book assessment. We evaluate problem-solving approach and code quality, not memorization. However, copy-pasting without understanding will be evident in explanations.

### What SQL dialect should candidates use?
**Standard SQL (ANSI SQL) or Presto/Trino syntax** is preferred, but candidates can specify if they're using a different dialect (PostgreSQL, MySQL, etc.). The focus is on logic and approach rather than dialect-specific syntax.

### How long do candidates have to complete the assessment?
There is **no strict time limit**, but we provide estimated durations:
- Junior: 90-120 minutes
- Mid-Level: 150-180 minutes
- Senior: 240-300 minutes

Candidates can save progress and return if needed.

### What happens if a candidate doesn't complete all sections?
Partial submissions are accepted and graded based on completed sections. However, incomplete core sections may result in a below-passing score.

### Are BONUS questions required?
**No**, BONUS questions are optional. They provide additional points above the 100-point core maximum and demonstrate advanced expertise. Mid-level and senior candidates are encouraged to attempt BONUS questions.

### How are SQL queries validated?
Queries are **manually graded** by evaluators using the answer key. We look for:
- Logical correctness (would it work?)
- Proper use of SQL features
- Edge case handling
- Code quality and readability

Queries don't need to be executed, but should be syntactically correct.

### Can candidates include comments in their SQL?
**Yes**, comments are encouraged for complex queries. They help demonstrate understanding and make grading easier.

### What if a candidate finds a better solution than the answer key?
**Great!** The answer key provides reference solutions, but alternative valid approaches are accepted and may earn full credit or even bonus recognition for creativity.

## Support

For technical issues or questions about the assessment:
- **Forms/UI Issues:** Contact development team
- **Question Clarification:** Contact hiring manager
- **Scoring Questions:** Reference `ANSWER_KEY_SAMPLE.md` or escalate to team lead

## Version History

- **v1.0** (2026-01-27) - Initial release with Junior, Mid-Level, and Senior forms
  - Converted from `IMPLEMENTATION_ROLE_QUESTIONS.md`
  - Markform-based interactive forms
  - Automated email submission
