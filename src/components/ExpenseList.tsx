import { useState, useMemo } from 'react'
import { Table, Button, Space, Popconfirm } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Expense, MergedCategoryNode } from '../types/expense'
import ExpenseForm from './ExpenseForm'

interface ExpenseListProps {
  expenses: Expense[]
  loading: boolean
  onAdd: (expense: Expense) => Promise<void>
  onEdit: (expense: Expense) => Promise<void>
  onDelete: (id: number) => Promise<void>
  mergedCategories: MergedCategoryNode[]
  onAddCategory: (primary: string, secondary: string) => Promise<void>
}

export default function ExpenseList({
  expenses,
  loading,
  onAdd,
  onEdit,
  onDelete,
  mergedCategories,
  onAddCategory,
}: ExpenseListProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleAdd = () => {
    setEditingExpense(null)
    setModalOpen(true)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditingExpense(null)
  }

  const handleSubmit = async (expense: Expense) => {
    try {
      if (editingExpense?.id) {
        await onEdit(expense)
      } else {
        await onAdd(expense)
      }
    } finally {
      handleClose()
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  // Build filter options from merged categories
  const primaryFilters = useMemo(
    () =>
      mergedCategories.map((c) => ({ text: c.label, value: c.value })),
    [mergedCategories]
  )

  const columns: ColumnsType<Expense> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => a.date.localeCompare(b.date),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Primary Category',
      dataIndex: 'primary_category',
      key: 'primary_category',
      width: 160,
      filters: primaryFilters,
      onFilter: (value, record) => record.primary_category === value,
    },
    {
      title: 'Secondary Category',
      dataIndex: 'secondary_category',
      key: 'secondary_category',
      width: 160,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (amount: number) => (
        <span className="font-semibold" style={{ color: '#16a34a' }}>
          <DollarOutlined className="mr-0.5" />
          {amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string) => (
        <span style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
          {note || '—'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Expense) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete this expense?"
            description="This action cannot be undone."
            onConfirm={() => {
              if (record.id != null) {
                handleDelete(record.id)
              }
            }}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={deletingId === record.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p style={{ color: 'var(--color-text-secondary, #6b7280)' }} className="text-sm">
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''} · Total{' '}
          <span className="font-semibold" style={{ color: '#16a34a' }}>
            ${totalAmount.toFixed(2)} AUD
          </span>
        </p>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Expense
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={expenses}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        size="middle"
        rowClassName={(_, index) =>
          index % 2 === 0 ? 'even-row' : 'odd-row'
        }
        locale={{
          emptyText: (
            <div className="py-12">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-lg font-medium mb-1">No expenses recorded</p>
              <p className="text-gray-400">
                Click "Add Expense" to start tracking your spending
              </p>
            </div>
          ),
        }}
      />

      <ExpenseForm
        open={modalOpen}
        editingExpense={editingExpense}
        onClose={handleClose}
        onSubmit={handleSubmit}
        mergedCategories={mergedCategories}
        onAddCategory={onAddCategory}
      />
    </div>
  )
}
