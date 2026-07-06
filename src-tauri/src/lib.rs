use tauri_plugin_sql::{Migration, MigrationKind};

/// Entry point for the Tauri backend.
///
/// This function sets up the desktop application shell — database migrations,
/// plugins for file dialogs and filesystem access, and optional debug logging.
/// It runs when the user launches the desktop app (not the web frontend alone).
///
/// The `expect()` at the end is intentional: if the Tauri runtime cannot start,
/// there is nothing the app can do to recover. This is standard boilerplate for
/// Tauri applications and will only fail if the system is missing required
/// libraries or the binary is corrupted.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Database schema migrations — each migration is applied in version order.
    // Tauri's SQL plugin tracks which migrations have already run, so these are
    // safe to include on every startup (they are skipped if already applied).
    let migrations = vec![
        Migration {
            version: 1,
            description: "create expenses table",
            // The expenses table stores all user transactions.
            // - `amount` is REAL (floating-point) to support decimal amounts like 12.50
            // - `date` is TEXT in "YYYY-MM-DD" format for easy sorting and filtering
            // - `note` is optional free-text the user can attach to any expense
            // - `created_at` and `updated_at` default to the current time via SQLite's datetime()
            sql: "CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                primary_category TEXT NOT NULL,
                secondary_category TEXT NOT NULL,
                date TEXT NOT NULL,
                note TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create user_categories table for custom category management",
            // User-created categories live separately from the built-in ones.
            // The UNIQUE constraint on (primary_category, secondary_category) prevents
            // duplicate entries — the app also checks for this in the UI, but the
            // database constraint is the final safety net.
            sql: "CREATE TABLE IF NOT EXISTS user_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                primary_category TEXT NOT NULL,
                secondary_category TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                UNIQUE(primary_category, secondary_category)
            );",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        // Plugin for native file open/save dialogs
        .plugin(tauri_plugin_dialog::init())
        // Plugin for reading and writing files on the user's filesystem
        .plugin(tauri_plugin_fs::init())
        // SQLite database plugin with our schema migrations. The database
        // file "expenses.db" is stored in the app's data directory — the
        // exact path depends on the operating system.
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:expenses.db", migrations)
                .build(),
        )
        // In debug builds, enable console logging so developers can see
        // what the Rust backend is doing. In release builds, logging is
        // disabled to avoid leaking internal details.
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        // Standard Tauri startup — `expect` is acceptable here because
        // failure means the app fundamentally cannot launch (missing system
        // libraries, corrupt binary, etc.). There is no graceful fallback.
        .expect("error while running tauri application");
}
