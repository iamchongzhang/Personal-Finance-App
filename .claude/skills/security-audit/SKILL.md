---
description: Scan code for security vulnerabilities — hardcoded secrets, injection risks, config leaks, and more
argument-hint: "[file or folder path — leave empty to scan the entire project]"
allowed-tools: Read(*) Glob(*) Grep(*) Bash(git *)
---

Perform a security audit on the target file, folder, or entire project. Report every finding with a severity level, the exact file and line, the risk, and a fix.

## What to scan

- If `$ARGUMENTS` is given: scan that specific file or folder
- If `$ARGUMENTS` is empty: scan the entire project (`src/`, `src-tauri/`, config files, and any `.env` files)

---

## Check 1: Hardcoded Sensitive Information

Search for secrets that should never be in source code.

**Look for:**

| Pattern | Examples |
|---|---|
| API keys & tokens | `apiKey`, `api_key`, `token`, `secret`, `password`, `passwd` |
| Private keys | `-----BEGIN RSA PRIVATE KEY-----`, `-----BEGIN EC PRIVATE KEY-----` |
| Connection strings | `jdbc:`, `mongodb+srv://`, `postgres://`, `mysql://` with credentials |
| OAuth secrets | `client_secret`, `clientSecret` |
| Hardcoded passwords | Any string like `"admin123"`, `"password"` next to auth logic |
| Webhook URLs | Discord/Slack webhook URLs in source code |

**For each finding:** Copy the exact line. If it's a real secret (not a placeholder), mark it **CRITICAL**.

**Note:** Placeholders like `"YOUR_API_KEY"`, `"changeme"`, or `process.env.X` are fine — skip those.

## Check 2: Injection Vulnerabilities

Check for code patterns that allow untrusted input to execute commands or queries.

**SQL Injection:**
- In Rust (`src-tauri/`): raw SQL strings built with `format!()` or string concatenation using user input
- In TypeScript: Tauri SQL plugin calls using template literals with unsanitized variables
- Flag any query that concatenates user input instead of using parameterized queries (`$1`, `?`)

**Command Injection:**
- Rust: `std::process::Command` or `std::process::Command::new` using user-supplied strings
- Any `exec()`, `spawn()`, `system()` calls with concatenated input

**Path Traversal:**
- File operations using user input without path sanitization
- `../` sequences not being filtered

**For each finding:** Explain how an attacker could exploit it and show the safe alternative.

## Check 3: Configuration File Leaks

Review all config files for exposed secrets in plaintext.

**Files to check:**
- `tauri.conf.json`, `package.json`, `vite.config.ts`
- Any `.env`, `.env.local`, `.env.production` files
- `settings.json`, `settings.local.json` (`.claude/` folder)
- `Cargo.toml` — check for embedded credentials in dependencies
- CI/CD files: `.github/workflows/`, `Dockerfile`, `docker-compose.yml`

**What to flag:**
- Any real email address, password, API key, or token
- Database credentials in plaintext
- Cloud service credentials (AWS, Azure, GCP keys)
- Private IP addresses or internal hostnames (low severity)

**Skip:** `.gitignore`-protected files that are clearly meant for local development (but note if they exist and contain secrets).

## Check 4: Other Security Risks

A broader sweep for common vulnerabilities:

**Unsafe JavaScript/TypeScript patterns:**
- `eval()`, `new Function()`, `innerHTML` with user input — **HIGH**
- `dangerouslySetInnerHTML` in React without sanitization — **HIGH**
- `Math.random()` used for anything security-related (use `crypto.randomUUID()`) — **MEDIUM**
- `localStorage` or `sessionStorage` storing sensitive data — **MEDIUM**

**Unsafe Rust patterns (`src-tauri/`):**
- `unsafe { }` blocks — flag every one for manual review — **MEDIUM**
- `unwrap()` or `expect()` in error handling that could crash the app — **LOW**
- File operations with hardcoded paths — **LOW**

**Dependency risks:**
- Check `package.json` and `Cargo.toml` for known vulnerable packages (note version numbers for manual review)
- Dependencies from non-official sources or git URLs — **MEDIUM**

**CORS/CSP configuration:**
- In `tauri.conf.json`: if `csp` is set to `null`, note that CSP is disabled — **MEDIUM**
- Missing or permissive CORS settings

**Debug/development code in production:**
- `console.log` with sensitive data — **LOW**
- Debug endpoints or dev-only features visible in production code — **MEDIUM**

---

## Report Format

```
🔒 Security Audit: [target]
══════════════════════════════════════════════════

🚨 CRITICAL (fix immediately)
  src/utils/api.ts:12 — Hardcoded API key:
    const API_KEY = "sk-live-abc123..."
  → Move to environment variable: process.env.API_KEY

⚠️  HIGH (fix before next release)
  src/components/Comment.tsx:45 — dangerouslySetInnerHTML without sanitization
  → Use DOMPurify to sanitize HTML before rendering

⚡ MEDIUM (fix soon)
  src-tauri/src/db.rs:78 — SQL built with format!() + user input
  → Use parameterized query: db.execute("SELECT * FROM users WHERE id = $1", &[id])

💡 LOW (consider improving)
  src/utils/random.ts:23 — Math.random() used for ID generation
  → Use crypto.randomUUID() for unpredictable IDs

══════════════════════════════════════════════════
📊 Summary
  CRITICAL: 1   HIGH: 1   MEDIUM: 1   LOW: 1
  Total issues: 4
```

- If zero issues found, state that clearly: "✅ No security issues found."
- For each issue include: file path, line number, the problematic code snippet, why it's risky, and how to fix it — all in plain English since the user is a tech novice.
