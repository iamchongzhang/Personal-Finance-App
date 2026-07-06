import { useMemo } from 'react'
import { Card, Statistic } from 'antd'
import {
  DollarOutlined,
  CalendarOutlined,
  RiseOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { StatsBarSkeleton } from './Skeletons'
import type { Expense } from '../types/expense'

/**
 * Props for the StatsBar component.
 *
 * @param expenses - The full list of expense records to compute stats from.
 * @param loading  - Whether data is still being fetched. Shows a skeleton when true.
 */
interface StatsBarProps {
  expenses: Expense[]
  loading?: boolean
}

/**
 * A row of four summary statistic cards displayed below the Dashboard greeting.
 *
 * Calculates and displays:
 * 1. **Total Expenses**     — grand total of ALL expenses ever recorded.
 * 2. **This Month**         — total spending in the current calendar month,
 *                             with a month-over-month percentage change tag.
 * 3. **Avg / Day**          — the average amount spent per day so far this month,
 *                             with a percentage change vs. last month's daily average.
 * 4. **Top Category**       — the primary category with the highest all-time spending.
 *
 * Each stat is wrapped in an Ant Design {@link Card} with an icon. While data
 * is loading, a {@link StatsBarSkeleton} placeholder is shown instead.
 */
export default function StatsBar({ expenses, loading }: StatsBarProps) {
  const stats = useMemo(() => {
    const now = new Date()

    // Build a "YYYY-MM" string for the current month (e.g. "2026-07").
    // getMonth() is zero-based (January = 0), so we add 1.
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Build a "YYYY-MM" string for the previous month.
    // new Date(year, month - 1, 1) handles wrapping from January back to December
    // of the previous year automatically.
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

    // ---- Totals -------------------------------------------------------
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth))
    const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0)

    const prevMonthExpenses = expenses.filter((e) => e.date.startsWith(prevMonth))
    const prevMonthTotal = prevMonthExpenses.reduce((s, e) => s + e.amount, 0)

    // ---- Month-over-month percentage change ---------------------------
    // Formula: ((new - old) / old) * 100
    // Example: old=$500, new=$600 → ((600-500)/500)*100 = +20%
    const monthChange =
      prevMonthTotal > 0
        ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100
        : 0

    // ---- Daily average ------------------------------------------------
    // daysInMonth: total days in the current month (28-31).
    // We get it by asking for day 0 of the NEXT month, which JS interprets
    // as the last day of the current month.
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    // Use today's day number, but cap it at daysInMonth for safety.
    const dayOfMonth = Math.min(now.getDate(), daysInMonth)
    // Average = total spent this month ÷ how many days have passed.
    const avgPerDay = dayOfMonth > 0 ? monthTotal / dayOfMonth : 0

    // Previous month's daily average (for the comparison trend).
    const prevDaysInMonth = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate()
    const prevAvgPerDay = prevDaysInMonth > 0 ? prevMonthTotal / prevDaysInMonth : 0
    // Same percentage change formula applied to the daily average.
    const avgChange =
      prevAvgPerDay > 0
        ? ((avgPerDay - prevAvgPerDay) / prevAvgPerDay) * 100
        : 0

    // ---- Top category -------------------------------------------------
    // Group expenses by primary_category and sum their amounts.
    const categoryTotals: Record<string, number> = {}
    expenses.forEach((e) => {
      categoryTotals[e.primary_category] =
        (categoryTotals[e.primary_category] || 0) + e.amount
    })
    // Walk through the totals to find the category with the highest sum.
    let topCategory = ''
    let topAmount = 0
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > topAmount) {
        topAmount = amt
        topCategory = cat
      }
    })

    return { total, monthTotal, avgPerDay, topCategory, monthChange, avgChange }
  }, [expenses])

  if (loading) return <StatsBarSkeleton />

  const trendTag = (pct: number) => {
    if (pct === 0) return null
    const up = pct > 0
    return (
      <span className="text-xs ml-2" style={{ color: up ? '#dc2626' : '#16a34a' }}>
        {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        {Math.abs(pct).toFixed(1)}%
      </span>
    )
  }

  const statStyle = (color: string) =>
    ({ color, fontWeight: 600 }) as React.CSSProperties

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card size="small" className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        <Statistic title="Total Expenses" value={stats.total} precision={2}
          prefix={<DollarOutlined />} suffix="AUD"
          valueStyle={statStyle('#16a34a')} />
      </Card>
      <Card size="small" className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        <Statistic title={<>{'This Month'}{trendTag(stats.monthChange)}</>}
          value={stats.monthTotal} precision={2}
          prefix={<CalendarOutlined />} suffix="AUD"
          valueStyle={statStyle('#2563eb')} />
      </Card>
      <Card size="small" className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        <Statistic title={<>{'Avg / Day'}{trendTag(stats.avgChange)}</>}
          value={stats.avgPerDay} precision={2}
          prefix={<RiseOutlined />} suffix="AUD"
          valueStyle={statStyle('#9333ea')} />
      </Card>
      <Card size="small" className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        <Statistic title="Top Category" value={stats.topCategory || '—'}
          prefix={<TrophyOutlined />}
          valueStyle={{ color: '#ea580c', fontWeight: 600, fontSize: stats.topCategory ? 16 : 20 }} />
      </Card>
    </div>
  )
}
