# Personal Finance App

A desktop application for recording and tracking personal daily expenses — simple, fast, and works completely offline.

Built with **Tauri 2**, **React + TypeScript**, **Ant Design**, **Tailwind CSS**, and **SQLite**.

---

## Features

### 📝 Expense Tracking
- Record expenses with amount, category, date, and optional note
- Edit and delete existing records
- Browse all expenses in a searchable, filterable table
- View history sorted by date

### 🗂️ Two-Level Category System
- 10 built-in primary categories (Food & Dining, Transportation, Housing, etc.)
- 34 built-in secondary categories organized under each primary
- **Custom categories** — add, rename, and delete your own categories
- Quick-add button directly in the expense form (no need to navigate away)
- Built-in categories are locked and protected from modification

### 📊 Dashboard & Analytics
- **Dashboard** — monthly total, quick stats, and recent expenses at a glance
- **By Category** — interactive pie chart showing spending distribution (click a slice to drill into sub-categories)
- **By Month** — bar chart showing spending trends over the last 12 months
- **Top Sub-Categories** — horizontal bar chart of your highest-spend sub-categories

### 🌗 Dark & Light Mode
- One-click toggle in the sidebar
- All charts, tables, and forms adapt to the selected theme

### 📥 CSV Import & Export
- Export all expenses to a CSV file (with a save dialog)
- Import expenses from a CSV file
- CSV headers match the app's data format for round-trip compatibility

### 🔒 Offline & Private
- No internet connection required
- All data stored locally in a single SQLite database file
- Easy to find and back up — just copy the `expenses.db` file

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Framework | [Tauri 2](https://tauri.app/) — lightweight, small installer (~5-10 MB) |
| Frontend | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| UI Components | [Ant Design 6](https://ant.design/) — tables, forms, modals, cards |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) — utility-first CSS |
| Charts | [Recharts](https://recharts.org/) — pie charts, bar charts |
| Database | SQLite via [tauri-plugin-sql](https://github.com/tauri-apps/tauri-plugin-sql) |
| Backend | [Rust](https://www.rust-lang.org/) — database migrations, native file system access |

---

## Prerequisites

Before running or building the app, you'll need:

1. **Node.js** (v18 or later) — [download here](https://nodejs.org/)
2. **Rust toolchain** — [install from rustup.rs](https://rustup.rs/)
3. **Microsoft Visual C++ Build Tools** (Windows only) — included with Visual Studio or [download separately](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)

To verify everything is installed correctly, open a terminal and run:

```bash
node --version
npm --version
rustc --version
cargo --version
```

---

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the app in development mode

```bash
npx tauri dev
```

This will start the Vite dev server (frontend) and launch the Tauri desktop window (Rust backend) — both with hot-reload enabled.

### Type-check the frontend

```bash
npx tsc --noEmit
```

### Build for production

```bash
npx tauri build
```

The installer (`.msi` on Windows) will be output to `src-tauri/target/release/bundle/`.

---

## Project Structure

```
personal-finance-app/
├── src/                        # Frontend (React + TypeScript)
│   ├── components/             # UI components
│   │   ├── AppLayout.tsx       # Sidebar layout + navigation
│   │   ├── ExpenseForm.tsx     # Add / edit expense modal
│   │   ├── ExpenseList.tsx     # Expense table with filters
│   │   ├── Dashboard.tsx       # Home dashboard + recent expenses
│   │   ├── AnalyticsView.tsx   # Charts (pie, bar by month, top sub-categories)
│   │   ├── CategoryManager.tsx # Category management page
│   │   ├── StatsBar.tsx        # Summary statistics bar
│   │   └── Skeletons.tsx       # Loading placeholders
│   ├── data/
│   │   └── categories.ts       # Built-in categories + merge logic
│   ├── hooks/
│   │   └── useTheme.ts         # Dark / light theme hook
│   ├── types/
│   │   └── expense.ts          # TypeScript type definitions
│   ├── utils/
│   │   └── csv.ts              # CSV import / export utilities
│   ├── App.tsx                 # Root component (state, callbacks, routing)
│   ├── main.tsx                # React entry point
│   └── index.css               # Global styles + Tailwind
├── src-tauri/                  # Backend (Rust)
│   ├── src/
│   │   └── lib.rs              # Database setup + migrations
│   ├── capabilities/
│   │   └── default.json        # Tauri permission grants
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri app configuration
├── index.html                  # HTML entry point
├── package.json                # Frontend dependencies + scripts
├── vite.config.ts              # Vite build configuration
└── README.md                   # This file
```

---

## Data Storage

All expenses and custom categories are stored in an SQLite database file:

```
expenses.db    # Created automatically in the same folder as the app
```

**Tables:**

| Table | Purpose |
|---|---|
| `expenses` | All expense records (amount, category, date, note, timestamps) |
| `user_categories` | Custom categories created by the user (built-in categories are not stored here) |

**To back up your data**, simply copy the `expenses.db` file to a safe location. To restore, copy it back.

---

## Built-in Categories

| Primary | Secondary |
|---|---|
| Food & Dining | Groceries, Food Delivery, Restaurants, Snacks & Drinks |
| Transportation | Public Transit, Ride-hailing, Fuel/Charging, Parking |
| Housing | Rent/Mortgage, Utilities, Property Management, Maintenance |
| Shopping | Clothing, Electronics, Daily Needs, Home Goods |
| Entertainment | Movies/TV, Games, Travel, Subscriptions |
| Healthcare | Medical Visits, Medicine, Fitness |
| Education | Books, Courses & Training |
| Communication | Phone Bill, Internet |
| Finance | Insurance, Loan Interest, Investment Fees |
| Other | Gifts, Charity, Miscellaneous |

---

## License

This is a personal project. No license specified.
