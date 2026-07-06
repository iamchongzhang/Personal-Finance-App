---
description: Quality-gated git commit — runs tests and quality checks before committing. Use instead of raw git commit.
argument-hint: "[commit message — what did you change?]"
allowed-tools: Agent, Bash(git *), Bash(gh *)
---

Commit code safely by running unit tests and quality checks BEFORE the commit goes through. If anything fails, the commit is rejected.

## Step-by-step flow

### 1. Check the current state

```bash
git status
git branch --show-current
```

If there are no changes to commit, stop and tell the user. If on `main`, warn the user — it is safer to work on a feature branch.

If `$ARGUMENTS` is empty, ask the user for a commit message. Do not proceed without one.

### 2. Run quality checks (in parallel)

Spawn BOTH agents at the same time in a single batch so they run concurrently:

- `tester` — runs all unit tests with `npx vitest run`. Prompt: "Run all existing unit tests and report the results. Do not write new tests — just run what exists."
- `quality-engineer` — reviews code quality across all four dimensions. Prompt: "Review the quality of recently modified files (use git diff --name-only to find them). Check security, comments, error handling, and code simplicity."

Wait for both agents to complete before moving to step 3.

### 3. Check the verdicts

Each agent's response ends with a `VERDICT:` line. Parse both:

| Tester | Quality-Engineer | Action |
|---|---|---|
| `VERDICT: PASS` | `VERDICT: PASS` | ✅ Commit |
| `VERDICT: FAIL` | `VERDICT: PASS` | ❌ Reject — tests failed |
| `VERDICT: PASS` | `VERDICT: FAIL` | ❌ Reject — quality issues |
| `VERDICT: FAIL` | `VERDICT: FAIL` | ❌ Reject — both failed |

### 4a. If both pass: commit and push

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Quality Gate PASSED
   Tests:     ✅ All passing
   Quality:   ✅ No critical or high issues

Proceeding with commit...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then run:

```bash
git add -A
git commit -m "$ARGUMENTS"
git push
```

If this is the first push for this branch, use `git push --set-upstream origin $(git branch --show-current)`.

Show a final summary with the commit hash and a link to the repo on GitHub.

### 4b. If either fails: reject

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Quality Gate FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Report which check failed and why (include the specific test failures or quality issues). Tell the user:

- What needs to be fixed
- That the commit was NOT made — no changes were pushed
- To run `/gitcommit "message"` again after fixing the issues

**Important:** Do NOT run any git commands if the quality gate fails. The working directory stays exactly as it was.
