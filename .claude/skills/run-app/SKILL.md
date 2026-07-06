---
description: Build and launch the Personal Finance App so I can test changes
argument-hint: [optional: extra tauri flags like --release]
allowed-tools: Bash(npx tauri *) Bash(cargo *) Bash(npm *)
---

Launch the Personal Finance App so the user can test their changes.

## How to run

This is a **Tauri v2 desktop app** (React + Vite frontend, Rust backend).

Run the app in development mode:

```bash
npx tauri dev $ARGUMENTS
```

This command starts two things together:
1. The **Vite dev server** (frontend — React + Ant Design + Tailwind CSS)
2. The **Tauri desktop window** (backend — Rust + SQLite)

The app will open in its own desktop window. The dev server supports hot-reload: when you edit frontend code, the window updates automatically.

## If it fails

1. **First time setup** — Make sure dependencies are installed:
   ```bash
   npm install
   ```

2. **Rust not found** — You need Rust installed. Check with:
   ```bash
   rustc --version
   ```

3. **Build errors** — Try a clean rebuild:
   ```bash
   cargo clean
   ```
   Then run the launch command again.

4. **Port in use** — If port 5173 is busy, Vite will pick the next available port automatically.

## Note

The dev server runs until you stop it (Ctrl+C in the terminal) or close the app window. Type `/run-app` whenever you want to launch the app to test your latest changes.
