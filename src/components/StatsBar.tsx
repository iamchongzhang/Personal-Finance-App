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

interface StatsBarProps {
  expenses: Expense[]
  loading?: boolean
}

export default function StatsBar({ expenses, loading }: StatsBarProps) {
  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth))
    const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0)

    const prevMonthExpenses = expenses.filter((e) => e.date.startsWith(prevMonth))
    const prevMonthTotal = prevMonthExpenses.reduce((s, e) => s + e.amount, 0)

    const monthChange =
      prevMonthTotal > 0
        ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100
        : 0

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = Math.min(now.getDate(), daysInMonth)
    const avgPerDay = dayOfMonth > 0 ? monthTotal / dayOfMonth : 0

    const prevDaysInMonth = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate()
    const prevAvgPerDay = prevDaysInMonth > 0 ? prevMonthTotal / prevDaysInMonth : 0
    const avgChange =
      prevAvgPerDay > 0
        ? ((avgPerDay - prevAvgPerDay) / prevAvgPerDay) * 100
        : 0

    const categoryTotals: Record<string, number> = {}
    expenses.forEach((e) => {
      categoryTotals[e.primary_category] =
        (categoryTotals[e.primary_category] || 0) + e.amount
    })
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
