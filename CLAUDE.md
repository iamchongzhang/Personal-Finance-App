# Personal Finance App — Product Documentation

## 1. Project Overview

**Personal Finance App** is a desktop application for recording and tracking personal daily expenses. The app is designed for an individual user who wants a simple, reliable way to log every expense they make.

- **Target Platform**: Windows (primary)
- **Currency**: AUD ($ / Australian Dollar)
- **Language**: English — UI and data

---

## 2. Core Features

### 2.1 Expense Recording
- Record each expense with: amount (AUD), category, date, optional note/memo
- View expense history in a list/table format
- Edit and delete existing expense records

### 2.2 Category System (Two-Level)
Expenses are classified using a **Primary Category → Secondary Category** hierarchy. The user must select a primary category first, then a secondary category.

| Primary Category | Secondary Categories |
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

### 2.3 Future Features (Phase 2+)
- Monthly summary & statistics dashboard
- Expense trend charts (pie chart by category, bar chart by month)
- Budget setting & alerts
- Data export (CSV / Excel)

---

## 3. Technology Stack

| Layer | Choice | Details |
|---|---|---|
| **Desktop Framework** | Tauri 2.x | Lightweight desktop app framework (~5-10MB installer) |
| **Frontend UI** | React + TypeScript | User chose for largest ecosystem & mature tooling |
| **Component Library** | Ant Design | User chose for best-in-class table & form components |
| **CSS Framework** | Tailwind CSS | User chose for fast development & consistent design |
| **Backend/Runtime** | Rust | Used by Tauri for native system operations |
| **Data Storage** | SQLite (via Tauri SQL plugin) | User chose for speed, reliability, and single-file simplicity |

### 3.1 Frontend UI Framework ✅ DECIDED

**Chosen: React + TypeScript**

Rationale: Largest ecosystem of any frontend framework, vast component library choices, excellent tooling support via Vite, and the most examples and community resources available.

### 3.2 Data Storage ✅ DECIDED

**Chosen: SQLite** (via `tauri-plugin-sql`)

Rationale: Fast, reliable, no server setup needed. All data stored in a single `.db` file — easy to find and back up. Scales well from a few records to thousands.

### 3.3 UI Component Library ✅ DECIDED

**Chosen: Ant Design**

Rationale: Best-in-class table and form components — the core of an expense tracking app. Extensive component set with a polished, professional look. Mature documentation and massive community.

### 3.4 CSS Framework ✅ DECIDED

**Chosen: Tailwind CSS**

Rationale: Enables fast, consistent UI development. Industry standard with massive community support. Works seamlessly with React.

---

## 4. Decision-Making Rule ⚠️ CRITICAL

**The user (app owner) is non-technical and cannot provide specific technical requirements.** For every technical decision throughout the entire project, the developer (Claude) MUST:

1. **Present clear options** — List at least 2-3 viable choices for any technology, architecture, library, or implementation approach
2. **Explain in plain language** — Describe what each option means, its pros and cons, without assuming technical knowledge
3. **Let the user decide** — Wait for the user's explicit choice before proceeding with implementation
4. **Record the decision** — After the user chooses, update this `CLAUDE.md` with the decision and brief rationale

**Examples of decisions that require user choice:**
- Frontend UI framework (React vs Vue vs Svelte)
- Data storage approach (SQLite vs JSON vs IndexedDB)
- UI component library (Element Plus vs Naive UI vs PrimeVue)
- Color theme and visual style
- Any library or dependency choice
- Data backup strategy
- Feature priority ordering

---

## 5. Development Environment

- **IDE**: VS Code (Cursor)
- **Version Control**: To be set up (Git)
- **Package Manager**: To be decided (npm / pnpm / yarn)
- **Rust Toolchain**: Required for Tauri backend

---

## 6. Project Structure (Planned)

```
personal-finance-app/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/              # App pages/screens
│   ├── data/               # Category definitions & constants
│   └── styles/             # CSS/style files
├── src-tauri/              # Tauri (Rust) backend
│   ├── src/                # Rust source code
│   └── Cargo.toml          # Rust dependencies
├── public/                 # Static assets
├── package.json            # Frontend dependencies
└── CLAUDE.md               # This file — product documentation
```

---

## 7. Design Principles

1. **Simplicity first** — The app should be intuitive for a non-technical user
2. **English-only** — All UI text in English
3. **Offline-first** — No internet required; data stored locally
4. **Data safety** — Easy to find and back up the data file
5. **Fast & light** — Leverage Tauri's small footprint; app should start instantly

---

## 8. Decision Log

| Date | Decision | Choice | Rationale |
|---|---|---|---|
| 2026-07-06 | Desktop Framework | **Tauri** | User chose over Electron, Python, WPF, and Flutter for its lightweight, modern, and fast characteristics |
| 2026-07-06 | Currency | **AUD ($)** | User chose Australian Dollar as the app's currency |
| 2026-07-06 | Category Structure | Two-level (10 primary, 34 secondary) | Designed as documented in Section 2.2 |
| 2026-07-06 | Frontend Framework | **React + TypeScript** | User chose over Vue 3 for the largest ecosystem & mature tooling |
| 2026-07-06 | Data Storage | **SQLite** (Tauri SQL plugin) | User chose for speed, reliability, single-file simplicity |
| 2026-07-06 | CSS Framework | **Tailwind CSS** | User chose for fast development & consistent design |
| 2026-07-06 | UI Component Library | **Ant Design** | User chose for best-in-class table & form components |

---

*Last updated: 2026-07-06*
