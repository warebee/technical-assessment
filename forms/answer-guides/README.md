# Answer Guides for Evaluators

This directory contains comprehensive answer guides for grading technical assessments.

## Files

| File | Role Level | Questions Covered |
|------|------------|-------------------|
| `junior-answers.md` | Junior (0-2 yrs) | Q1.1, Q2.1, Q3.1, Q4.1 |
| `mid-answers.md` | Mid (2-5 yrs) | Q1.2, Q2.2, Q3.2, Q4.1+, Q5.1, Q6.1 |
| `senior-answers.md` | Senior (5+ yrs) | All sections + Q4.2, Q5.2, Q6.2, Q7, Q8 |

## How to Use These Guides

### During Evaluation

1. **Review the candidate's answer** against the sample solution
2. **Apply the rubric** - partial credit is encouraged for valid approaches
3. **Check for common mistakes** listed under each question
4. **Accept alternative approaches** if they produce correct results

### Scoring Guidelines

Each question has a rubric with point allocations:

| Criteria | Weight | Notes |
|----------|--------|-------|
| SQL Correctness | 40% | Query runs, returns expected results |
| Approach & Logic | 30% | Well-structured, appropriate SQL features |
| Edge Case Handling | 15% | NULL handling, empty sets, boundary conditions |
| Explanation Quality | 15% | Clear reasoning, demonstrates understanding |

### Red Flags

Watch for these patterns that indicate fundamental misunderstanding:
- Using `GROUP BY` without aggregation functions
- Confusing `INNER JOIN` and `LEFT JOIN` behavior
- Not understanding `NULL` comparisons
- Using `DISTINCT` to "fix" duplicate issues from bad joins

### Partial Credit

Award partial credit when:
- The approach is correct but syntax has minor errors
- The solution handles the main case but misses edge cases
- The explanation shows understanding even if code is incomplete

## Updating These Guides

When updating questions in the form files, remember to:
1. Update the corresponding answer guide
2. Verify point totals still match
3. Check that question IDs are consistent
