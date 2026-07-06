---
description: Rebuild and repackage the Personal Finance App into a production installer
argument-hint: [optional: --debug for debug build, or extra cargo flags]
allowed-tools: Bash(npx tauri *) Bash(cargo *) Bash(npm *)
---

Rebuild and repackage the Personal Finance App into a production-ready installer.

## What this does

This creates a **standalone installer** (.msi/.exe on Windows) that users can install without needing Node.js, Rust, or any dev tools.

The process:
1. **TypeScript check** — `tsc -b` verifies no type errors
2. **Frontend build** — Vite bundles React into optimized static files
3. **Rust release build** — Compiles the backend with optimizations (slower compile, faster app)
4. **Bundle** — Packages everything into an installer

## Run the build

```bash
npx tauri build $ARGUMENTS
```

The installer will appear in: `src-tauri/target/release/bundle/`

## Build time

A full release build can take **several minutes** the first time (Rust compiles everything from scratch). Subsequent builds are faster since Rust caches unchanged code.

## vs /run-app

| `/run-app` | `/rebuild-app` |
|---|---|
| Dev mode (hot-reload) | Production build |
| Opens window instantly | Creates installer file |
| Unoptimized (fast compile) | Optimized (slow compile) |
| For testing while coding | For sharing with others |

## If it fails

1. **Type errors** — Fix any TypeScript errors reported by `tsc`, then try again.
2. **Rust build errors** — Try a clean rebuild:
   ```bash
   cargo clean
   ```
3. **Missing icons** — Make sure the icon files listed in `tauri.conf.json` exist under `src-tauri/icons/`.

## After the build

Tell the user where the installer was created and how big it is. If they want to test the production build before sharing: `npx tauri build --debug` creates a debug build that's faster to compile but still produces an installer.
