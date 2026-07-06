import { useState, useMemo } from 'react'
import { Table, Button, Space, Popconfirm, message } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Expense, MergedCategoryNode } from '../types/expense'
import ExpenseForm from './ExpenseForm'

/**
 * Props for the ExpenseList component.
 *
 * @param expenses         - The full list of expense records to display.
 * @param loading          - Whether expense data is still being fetched.
 * @param onAdd            - Async callback to insert a new expense into the database.
 * @param onEdit           - Async callback to update an existing expense in the database.
 * @param onDelete         - Async callback to remove an expense by its database ID.
 * @param mergedCategories - Combined list of built-in and custom categories (used to build column filter options).
 * @param onAddCategory    - Passed through to ExpenseForm for quick category creation.
 */
interface ExpenseListProps {
  expenses: Expense[]
  loading: boolean
  onAdd: (expense: Expense) => Promise<void>
  onEdit: (expense: Expense) => Promise<void>
  onDelete: (id: number) => Promise<void>
  mergedCategories: MergedCategoryNode[]
  onAddCategory: (primary: string, secondary: string) => Promise<void>
}

/**
 * A filterable, sortable table showing all recorded expenses.
 *
 * Key features the user can interact with:
 * - **Add** — opens the ExpenseForm modal in "new" mode via the "+ Add Expense" button.
 * - **Edit** — opens the ExpenseForm modal pre-filled with the selected row's data.
 * - **Delete** — shows a confirmation popover, then permanently removes the expense.
 * - **Column filters** — filter by primary category using the dropdown in the column header.
 * - **Column sorting** — sort by date or amount by clicking the column header.
 * - **Summary bar** — shows the expense count and total amount at the top.
 *
 * While data is loading from the database, an Ant Design table spinner is shown.
 * When there are no expenses, a friendly empty-state message is displayed instead.
 */
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

  /**
   * Opens the expense form modal in "add" mode (no pre-filled data).
   */
  const handleAdd = () => {
    setEditingExpense(null)
    setModalOpen(true)
  }

  /**
   * Opens the expense form modal in "edit" mode, pre-filled with the selected
   * row's data.
   */
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setModalOpen(true)
  }

  /**
   * Closes the expense form modal and clears the editing state, returning the
   * user to the table view.
   */
  const handleClose = () => {
    setModalOpen(false)
    setEditingExpense(null)
  }

  /**
   * Saves a new or edited expense to the database.
   *
   * If `editingExpense` has an id, this is an edit (UPDATE); otherwise it is a
   * new expense (INSERT). If the save fails, the modal stays open so the user
   * doesn't lose their entered data, and an error message is shown.
   */
  const handleSubmit = async (expense: Expense) => {
    try {
      if (editingExpense?.id) {
        await onEdit(expense)
      } else {
        await onAdd(expense)
      }
      handleClose()
    } catch (err) {
      console.error('Failed to save expense:', err)
      message.error('Could not save expense. Please try again.')
    }
  }

  /**
   * Removes an expense by its database ID.
   *
   * Sets a `deletingId` so the specific row's delete button shows a loading
   * spinner during the request. On failure, resets the spinner and shows an
   * error message. The `finally` block ensures the spinner always stops
   * regardless of success or failure.
   */
  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } catch (err) {
      console.error('Failed to delete expense:', err)
      message.error('Could not delete expense. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  /**
   * Build the dropdown filter options for the Primary Category column.
   *
   * Each option has a `text` (what the user sees in the dropdown) and a `value`
   * (the raw category string used for matching). These come from the merged
   * list of built-in and custom categories, so the filter always reflects the
   * categories the user actually has available.
   */
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
          {/* Edit button — opens the ExpenseForm modal pre-filled with this row */}
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          {/* Delete button wrapped in Popconfirm for safety.
              The user must click "Delete" in the popover to confirm.
              While the delete request is in flight, this specific button shows a spinner. */}
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

  // Sum all expense amounts for the summary bar at the top of the table.
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      {/* Summary bar: expense count + total amount, with an Add button on the right */}
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

      {/* The ExpenseForm modal — shared by both Add and Edit flows.
          `editingExpense` is null for Add mode, or an expense object for Edit mode.
          `modalOpen` controls visibility; `handleClose` hides it and resets state. */}
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
