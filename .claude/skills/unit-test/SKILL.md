---
description: Write unit tests for code, run them, and generate a test report
argument-hint: "[file path or component name — leave empty to just run all tests]"
allowed-tools: Bash(npx vitest *) Bash(npm test *) Bash(npm run test *) Read(*) Glob(*) Grep(*) Write(*) Edit(*)
---

Write unit tests, execute them, and report the results.

## What are unit tests?

A unit test checks one small piece of code in isolation — like a single function or component. It says: "given this input, I expect this output." When tests pass, you know your code works. When they fail, you know exactly what broke and where.

This project uses **Vitest** + **React Testing Library**. Test files go next to the code they test and end in `.test.ts` or `.test.tsx`.

## Three modes

### Mode 1: Create tests (when user provides a file path)

Examples: `/unit-test src/utils/math.ts`, `/unit-test src/components/ExpenseForm.tsx`

**Step 1 — Read the code.** Read the target file and understand what functions/components it exports.

**Step 2 — Write the test file.** Create a `.test.ts` or `.test.tsx` file in the same folder. Follow these patterns:

**For a plain function** (e.g., a helper that calculates something):
```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './my-module'

describe('myFunction', () => {
  it('should return X when given Y', () => {
    const result = myFunction(input)
    expect(result).toBe(expectedOutput)
  })

  it('should handle edge case Z', () => {
    // test the edge case
  })
})
```

**For a React component**:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render the title', () => {
    render(<MyComponent title="Hello" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should call onSubmit when button clicked', async () => {
    const onSubmit = vi.fn()
    render(<MyComponent onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(onSubmit).toHaveBeenCalled()
  })
})
```

**Rules for writing good tests:**
- Test the happy path (normal usage)
- Test edge cases (empty input, very large input, null/undefined)
- Test error handling (what happens when something fails?)
- For components: test what the user sees and interacts with, not internal implementation
- Each `it()` block tests ONE thing — keep them focused
- Use descriptive names: `it('should show error message when email is invalid')` not `it('test 1')`

### Mode 2: Run tests (always do this after writing tests)

```bash
npx vitest run
```

This runs ALL tests once and shows which passed and which failed. If a test fails, read the error output carefully and fix the test or the code — do not guess.

### Mode 3: Generate report (always do this after running)

After the tests finish, summarize the results for the user:

```
📊 Test Report
─────────────────
✅ Passed: 12
❌ Failed: 0
⏭️  Skipped: 0
⏱️  Time: 1.4s
─────────────────
✅ All tests passing!
```

If there are failures, list each failing test with its error message and suggest what might be wrong.

## If the user provides no arguments

Just run all existing tests and show the report:

```bash
npx vitest run
```

Then show the report. If there are no test files yet, tell the user and suggest a file to start with.

## Running tests in watch mode

If the user wants tests to re-run automatically when code changes, use:

```bash
npx vitest
```

(without `run`). Tests re-run on every file save — useful while actively coding.

## Important notes

- Test files go NEXT TO the code they test, not in a separate folder
- Name test files after the module: `ExpenseForm.tsx` → `ExpenseForm.test.tsx`
- Use `vi.fn()` to create mock functions for callbacks and event handlers
- Ant Design components render with specific ARIA roles and text — use `screen.getByRole()` and `screen.getByText()` to find them
- Don't test Tauri APIs (`@tauri-apps/api`) — those can only run inside the desktop app. Mock them with `vi.mock()` instead
