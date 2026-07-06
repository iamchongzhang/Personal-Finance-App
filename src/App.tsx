import { useEffect, useState, useCallback, useRef } from 'react'
import { ConfigProvider, App as AntApp, Spin, theme as antTheme } from 'antd'
import Database from '@tauri-apps/plugin-sql'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import AppLayout from './components/AppLayout'
import Dashboard from './components/Dashboard'
import ExpenseList from './components/ExpenseList'
import AnalyticsView from './components/AnalyticsView'
import CategoryManager from './components/CategoryManager'
import SnakeGame from './components/SnakeGame'
import { useTheme } from './hooks/useTheme'
import { expensesToCsv, csvToExpenses } from './utils/csv'
import { getCurrentMonthKey } from './utils/date'
import { loadUserCategories, mergeCategories } from './data/categories'
import { COLOR_PRIMARY } from './theme/colors'
import type { Expense, UserCategory, MergedCategoryNode } from './types/expense'

let db: Database | null = null

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:expenses.db')
  }
  return db
}

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [userCategories, setUserCategories] = useState<UserCategory[]>([])
  const [mergedCategories, setMergedCategories] = useState<MergedCategoryNode[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toggleTheme, isDark } = useTheme()
  const { message } = AntApp.useApp()

  // Load expenses from DB
  const loadExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const database = await getDb()
      const rows = await database.select<Expense[]>(
        'SELECT * FROM expenses ORDER BY date DESC, id DESC'
      )
      setExpenses(rows)
    } catch (err) {
      // Log the full error for debugging but don't show technical details to the user
      console.error('Failed to load expenses:', err)
      message.error('Could not load expenses. Please restart the app.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load user categories from DB
  const refreshCategories = useCallback(async () => {
    try {
      const database = await getDb()
      const cats = await loadUserCategories(database)
      setUserCategories(cats)
      setMergedCategories(mergeCategories(cats))
    } catch (err) {
      console.error('Failed to load user categories:', err)
      message.error('Could not load categories. Please restart the app.')
    }
  }, [message])

  useEffect(() => {
    getDb()
      .then(async () => {
        setInitializing(false)
        await Promise.all([loadExpenses(), refreshCategories()])
      })
      .catch((err) => {
        console.error('Failed to initialize database:', err)
        setInitializing(false)
        setLoading(false)
      })
  }, [loadExpenses, refreshCategories])

  const handleAdd = useCallback(async (expense: Expense) => {
    try {
      const database = await getDb()
      const result = await database.execute(
        'INSERT INTO expenses (amount, primary_category, secondary_category, date, note) VALUES (?, ?, ?, ?, ?)',
        [expense.amount, expense.primary_category, expense.secondary_category, expense.date, expense.note]
      )
      const newExpense: Expense = { ...expense, id: result.lastInsertId as number }
      setExpenses((prev) => {
        const idx = prev.findIndex(
          (e) => e.date < newExpense.date || (e.date === newExpense.date && e.id! < newExpense.id!)
        )
        if (idx === -1) return [...prev, newExpense]
        return [...prev.slice(0, idx), newExpense, ...prev.slice(idx)]
      })
    } catch (err) {
      console.error('Failed to add expense:', err)
      throw err
    }
  }, [])

  const handleEdit = useCallback(async (expense: Expense) => {
    try {
      const database = await getDb()
      await database.execute(
        'UPDATE expenses SET amount = ?, primary_category = ?, secondary_category = ?, date = ?, note = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [expense.amount, expense.primary_category, expense.secondary_category, expense.date, expense.note, expense.id]
      )
      setExpenses((prev) => prev.map((e) => (e.id === expense.id ? { ...expense } : e)))
    } catch (err) {
      console.error('Failed to update expense:', err)
      throw err
    }
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    try {
      const database = await getDb()
      await database.execute('DELETE FROM expenses WHERE id = ?', [id])
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      console.error('Failed to delete expense:', err)
      throw err
    }
  }, [])

  // Category CRUD — each function shows user feedback on failure so the user
  // knows whether their action succeeded or failed.
  const handleAddCategory = useCallback(async (primary: string, secondary: string) => {
    try {
      const database = await getDb()
      await database.execute(
        'INSERT INTO user_categories (primary_category, secondary_category) VALUES (?, ?)',
        [primary, secondary]
      )
      await refreshCategories()
    } catch (err) {
      console.error('Failed to add category:', err)
      message.error('Could not add category. Please try again.')
      throw err
    }
  }, [refreshCategories, message])

  /** Updates a category and cascades the rename to all expenses that use it.
   *  Uses a database transaction so that if any step fails, ALL changes are
   *  rolled back — preventing the categories and expenses from getting out of sync. */
  const handleUpdateCategory = useCallback(async (id: number, primary: string, secondary: string) => {
    try {
      const database = await getDb()
      // Find the old values — we need these to know which expenses to cascade-update
      const rows = await database.select<{ primary_category: string; secondary_category: string }[]>(
        'SELECT primary_category, secondary_category FROM user_categories WHERE id = ?',
        [id]
      )
      if (rows.length === 0) {
        message.error('Category not found. It may have been deleted.')
        return
      }
      const oldPrimary = rows[0].primary_category
      const oldSecondary = rows[0].secondary_category

      // Update user_categories row and cascade to expenses in a transaction.
      // A transaction ensures all-or-nothing: if the cascade fails, the rename is
      // rolled back so we don't end up with orphaned categories or expenses.
      await database.execute('BEGIN TRANSACTION')
      try {
        await database.execute(
          'UPDATE user_categories SET primary_category = ?, secondary_category = ? WHERE id = ?',
          [primary, secondary, id]
        )
        // If primary category name changed, update all secondaries under the same primary
        if (oldPrimary !== primary) {
          await database.execute(
            'UPDATE user_categories SET primary_category = ? WHERE primary_category = ?',
            [primary, oldPrimary]
          )
        }
        // Cascade rename in expenses so existing entries stay linked to the category
        await database.execute(
          'UPDATE expenses SET primary_category = ?, secondary_category = ? WHERE primary_category = ? AND secondary_category = ?',
          [primary, secondary, oldPrimary, oldSecondary]
        )
        await database.execute('COMMIT')
      } catch (err) {
        await database.execute('ROLLBACK')
        throw err
      }
      await refreshCategories()
    } catch (err) {
      console.error('Failed to update category:', err)
      message.error('Could not update category. Please try again.')
      throw err
    }
  }, [refreshCategories, message])

  const handleDeleteCategory = useCallback(async (id: number) => {
    try {
      const database = await getDb()
      await database.execute('DELETE FROM user_categories WHERE id = ?', [id])
      await refreshCategories()
    } catch (err) {
      console.error('Failed to delete category:', err)
      message.error('Could not delete category. Please try again.')
      throw err
    }
  }, [refreshCategories, message])

  const handleExport = useCallback(async () => {
    try {
      const filePath = await save({
        defaultPath: `expenses_${new Date().toISOString().slice(0, 10)}.csv`,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      })
      if (!filePath) return // user cancelled
      const csv = expensesToCsv(expenses)
      await writeTextFile(filePath, csv)
      message.success(`Exported ${expenses.length} expense${expenses.length !== 1 ? 's' : ''} to CSV`)
    } catch (err) {
      console.error('Export failed:', err)
      message.error('Export failed. Check console for details.')
    }
  }, [expenses, message])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const imported = csvToExpenses(text)
      if (imported.length === 0) return

      const database = await getDb()
      for (const exp of imported) {
        await database.execute(
          'INSERT INTO expenses (amount, primary_category, secondary_category, date, note) VALUES (?, ?, ?, ?, ?)',
          [exp.amount, exp.primary_category, exp.secondary_category, exp.date, exp.note]
        )
      }
      await loadExpenses()
    } catch (err) {
      console.error('Import failed:', err)
      message.error('Could not import file. Make sure it is a valid CSV exported from this app.')
    }
    e.target.value = ''
  }, [loadExpenses])

  // Monthly total for sidebar — uses the shared date utility to avoid
  // duplicating the month-key logic across multiple components.
  const thisMonth = getCurrentMonthKey()
  const monthlyTotal = expenses
    .filter((e) => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0)

  // Shared theme configuration used by both the loading spinner and the
  // main app. Extracted to a single object so changes to colors or fonts
  // only need to be made in one place.
  const appTheme = {
    algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: COLOR_PRIMARY,
      borderRadius: 6,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
  }

  if (initializing) {
    return (
      <ConfigProvider theme={appTheme}>
        <div className="min-h-screen flex items-center justify-center" style={{ background: isDark ? '#0f0f1a' : '#f8fafc' }}>
          <Spin size="large" />
        </div>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider theme={appTheme}>
      <AntApp>
        <AppLayout
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onExport={handleExport}
          onImportClick={handleImportClick}
          activePage={page}
          onPageChange={setPage}
          monthlyTotal={monthlyTotal}
        >
          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />

          {page === 'dashboard' && (
            <Dashboard
              expenses={expenses}
              loading={loading}
              onQuickAdd={() => setPage('expenses')}
              onViewAll={() => setPage('expenses')}
            />
          )}

          {page === 'expenses' && (
            <ExpenseList
              expenses={expenses}
              loading={loading}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              mergedCategories={mergedCategories}
              onAddCategory={handleAddCategory}
            />
          )}

          {page === 'analytics' && (
            <AnalyticsView expenses={expenses} loading={loading} />
          )}

          {page === 'categories' && (
            <CategoryManager
              userCategories={userCategories}
              expenses={expenses}
              loading={loading}
              onAdd={handleAddCategory}
              onUpdate={handleUpdateCategory}
              onDelete={handleDeleteCategory}
            />
          )}

          {page === 'snake' && (
            <SnakeGame isDark={isDark} />
          )}
        </AppLayout>
      </AntApp>
    </ConfigProvider>
  )
}
