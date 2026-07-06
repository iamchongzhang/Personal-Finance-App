import { useState } from 'react'
import { Card, Tabs, Empty, Statistic } from 'antd'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts'
import type { Expense } from '../types/expense'
import { ChartSkeleton } from './Skeletons'

const LIGHT_COLORS = [
  '#16a34a', '#2563eb', '#9333ea', '#ea580c', '#ca8a04',
  '#0891b2', '#be123c', '#4f46e5', '#059669', '#7c3aed',
]

const DARK_COLORS = [
  '#4ade80', '#60a5fa', '#c084fc', '#fb923c', '#facc15',
  '#22d3ee', '#fb7185', '#818cf8', '#34d399', '#a78bfa',
]

function renderPieLabel(props: PieLabelRenderProps): string {
  const name = props.name ?? ''
  const pct = props.percent ?? 0
  return `${name} ${(pct * 100).toFixed(0)}%`
}

/**
 * Renders a tooltip when the user hovers over a chart element.
 *
 * Shows the data point's name (or label for bar charts) and its dollar
 * amount formatted to two decimal places. If no data is being hovered
 * the tooltip hides itself by returning `null`.
 *
 * The `any` type is used because Recharts' {@link Tooltip} generic types
 * are complex and vary per chart type (pie vs bar), making proper typing
 * impractical for a shared tooltip component.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-lg text-sm"
      style={{
        background: 'var(--color-bg-card, #fff)',
        border: '1px solid var(--color-border, #e5e7eb)',
      }}
    >
      <p className="font-medium mb-0.5" style={{ color: 'var(--color-text-primary, #111)' }}>
        {label ?? payload[0].name}
      </p>
      <p className="font-bold" style={{ color: '#16a34a' }}>
        ${Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  )
}

interface AnalyticsViewProps {
  expenses: Expense[]
  loading?: boolean
}

/**
 * Renders charts and summary tiles that help you understand where your
 * money goes.
 *
 * ## What it shows
 * - **Summary tiles** — total spending, average per expense, and how many
 *   unique categories were used.
 * - **By Category** — a pie chart that breaks spending down by primary
 *   category. Click a slice or the legend to see sub-category detail.
 * - **By Month** — a bar chart of monthly spending over the last 12 months.
 * - **Top Sub-Categories** — a horizontal bar chart showing the 10 biggest
 *   primary+secondary category pairs.
 *
 * ## How the data is built
 * The component takes the raw {@link Expense} array and groups amounts by
 * category and by month. Each group's total is rounded to cents
 * (`Math.round(value * 100) / 100`) to avoid floating-point display
 * issues (e.g. showing $12.4000000001 instead of $12.40).
 */
export default function AnalyticsView({ expenses, loading }: AnalyticsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  if (loading) return <ChartSkeleton />

  if (expenses.length === 0) {
    return (
      <Empty
        description="No data to analyze yet"
        className="mt-20"
      />
    )
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS

  // --- Pie chart data -------------------------------------------------------
  // Group every expense by its primary category, then sum the amounts.
  // Round to cents to prevent floating-point quirks (e.g. 12.4000000001).
  const categoryTotals: Record<string, number> = {}
  expenses.forEach((e) => {
    categoryTotals[e.primary_category] =
      (categoryTotals[e.primary_category] || 0) + e.amount
  })
  const pieData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)

  // --- Bar chart data -------------------------------------------------------
  // Group expenses by calendar month (YYYY-MM). Show the most recent 12
  // months so the chart doesn't grow too wide over time.
  const monthTotals: Record<string, number> = {}
  expenses.forEach((e) => {
    const month = e.date.substring(0, 7)
    monthTotals[month] = (monthTotals[month] || 0) + e.amount
  })
  const barData = Object.entries(monthTotals)
    .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)

  // --- Summary tiles -------------------------------------------------------
  // Sum of every expense in the list (unfiltered — all-time total).
  const totalSpending = expenses.reduce((s, e) => s + e.amount, 0)
  // Average dollar value of a single expense entry.
  const avgPerExpense = expenses.length > 0 ? totalSpending / expenses.length : 0
  // How many unique primary categories appear in the data.
  const categoryCount = Object.keys(categoryTotals).length

  const pieTabContent = (
    <div>
      {selectedCategory && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--color-bg-primary, #f8fafc)' }}>
          <span className="text-sm text-gray-500">
            Sub-categories for{' '}
            <span className="font-semibold">{selectedCategory}</span>
            {' '}·{' '}
            <button
              className="text-blue-500 hover:underline"
              onClick={() => setSelectedCategory(null)}
            >
              Clear
            </button>
          </span>
        </div>
      )}
      <div className="flex gap-8">
        <ResponsiveContainer width="55%" height={380}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={140}
              label={renderPieLabel}
              // Recharts' Pie onClick callback uses `any` because the data
              // shape depends on the data array passed to the Pie component.
              // There is no generic that captures the exact payload type.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(data: any) => {
                setSelectedCategory(
                  selectedCategory === data.name ? null : data.name
                )
              }}
              style={{ cursor: 'pointer' }}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  opacity={
                    selectedCategory
                      ? pieData[index].name === selectedCategory
                        ? 1
                        : 0.3
                      : 1
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2 flex flex-col justify-center">
          {pieData.map((item, i) => (
            <button
              key={item.name}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === item.name ? null : item.name
                )
              }
              className="flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-sm flex-1 truncate">{item.name}</span>
              <span className="text-sm font-semibold">${item.value.toFixed(0)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const tabItems = [
    {
      key: 'category',
      label: 'By Category',
      children: pieTabContent,
    },
    {
      key: 'monthly',
      label: 'By Month',
      children: (
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'secondary',
      label: 'Top Sub-Categories',
      children: (
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={(() => {
            const secondaryTotals: Record<string, number> = {}
            expenses.forEach((e) => {
              const key = `${e.primary_category} > ${e.secondary_category}`
              secondaryTotals[key] = (secondaryTotals[key] || 0) + e.amount
            })
            return Object.entries(secondaryTotals)
              .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 10)
          })()} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
  ]

  return (
    <div>
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card size="small">
          <Statistic
            title="Total Spending"
            value={totalSpending}
            precision={2}
            prefix="$"
            valueStyle={{ color: '#16a34a', fontWeight: 600 }}
          />
        </Card>
        <Card size="small">
          <Statistic
            title="Avg per Expense"
            value={avgPerExpense}
            precision={2}
            prefix="$"
            valueStyle={{ color: '#2563eb', fontWeight: 600 }}
          />
        </Card>
        <Card size="small">
          <Statistic
            title="Categories Used"
            value={categoryCount}
            valueStyle={{ color: '#9333ea', fontWeight: 600 }}
          />
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  )
}
