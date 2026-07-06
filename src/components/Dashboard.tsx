import { useMemo } from 'react'
import { Card, Table, Button } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import StatsBar from './StatsBar'
import { DashboardSkeleton } from './Skeletons'
import type { Expense } from '../types/expense'

interface DashboardProps {
  expenses: Expense[]
  loading: boolean
  onQuickAdd: () => void
  onViewAll: () => void
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard({
  expenses,
  loading,
  onQuickAdd,
  onViewAll,
}: DashboardProps) {
  const greeting = getGreeting()

  const recentExpenses = useMemo(
    () => expenses.slice(0, 5),
    [expenses]
  )

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthTotal = expenses
    .filter((e) => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0)

  if (loading) {
    return <DashboardSkeleton />
  }

  const recentColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 100 },
    { title: 'Category', dataIndex: 'primary_category', key: 'cat', width: 140 },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (v: number) => (
        <span className="font-semibold">${v.toFixed(2)}</span>
      ),
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (v: string) => v || '—',
    },
  ]

  return (
    <div>
      {/* Greeting */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}
            <span className="ml-2">👋</span>
          </h1>
          <p className="text-gray-500 mt-1">
            Here's your spending summary for{' '}
            {now.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">This Month</div>
          <div className="text-3xl font-bold" style={{ color: '#16a34a' }}>
            ${monthTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsBar expenses={expenses} />

      {/* Quick add button */}
      <div className="flex gap-4 mb-6">
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={onQuickAdd}>
          Add Expense
        </Button>
        <Button icon={<EyeOutlined />} size="large" onClick={onViewAll}>
          View All Expenses
        </Button>
      </div>

      {/* Recent expenses */}
      <Card
        title="Recent Expenses"
        extra={
          <Button type="link" onClick={onViewAll}>
            View All
          </Button>
        }
      >
        {recentExpenses.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg font-medium mb-1">No expenses yet</p>
            <p>Click "Add Expense" to start tracking your spending</p>
          </div>
        ) : (
          <Table
            columns={recentColumns}
            dataSource={recentExpenses}
            rowKey="id"
            pagination={false}
            size="small"
            showHeader={false}
          />
        )}
      </Card>
    </div>
  )
}
