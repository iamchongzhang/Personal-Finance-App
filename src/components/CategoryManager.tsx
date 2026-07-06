import { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Tag, Popconfirm, Space, Empty, message } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { BUILTIN_CATEGORIES, isBuiltinCategory } from '../data/categories'
import type { UserCategory, Expense } from '../types/expense'

interface CategoryManagerProps {
  userCategories: UserCategory[]
  expenses: Expense[]
  loading: boolean
  onAdd: (primary: string, secondary: string) => Promise<void>
  onUpdate: (id: number, primary: string, secondary: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

interface CategoryRow {
  key: string
  primary: string
  secondary: string
  isBuiltin: boolean
  userId?: number
}

/**
 * Manages expense categories, split across two tables.
 *
 * ## Built-in categories (read-only)
 * These are the factory-default categories that ship with the app (see
 * {@link BUILTIN_CATEGORIES}). They cannot be edited or deleted — the
 * table shows a "Locked" badge for each row.
 *
 * ## User-created categories (add / edit / delete)
 * Users can create their own primary+secondary category pairs. The
 * "My Categories" table shows every custom category and provides
 * inline Edit and Delete buttons.
 *
 * ## Modal form flow
 * - **Adding** — the user clicks "Add Category", which opens a modal
 *   with empty fields. On submit the form calls `onAdd`.
 * - **Editing** — the user clicks the Edit button on a row, which
 *   pre-fills the modal and calls `onUpdate` on submit.
 * - **Validation** — the form checks that the name does not collide
 *   with a built-in category (case-sensitive match against
 *   {@link isBuiltinCategory}) and that the user isn't creating a
 *   duplicate of an existing custom category.
 */
export default function CategoryManager({
  userCategories,
  expenses,
  loading,
  onAdd,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<CategoryRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (modalOpen && editingRow) {
      form.setFieldsValue({
        primary: editingRow.primary,
        secondary: editingRow.secondary,
      })
    } else if (modalOpen) {
      form.resetFields()
    }
  }, [modalOpen, editingRow, form])

  // Build built-in rows from the static list
  const builtinRows: CategoryRow[] = []
  for (const cat of BUILTIN_CATEGORIES) {
    for (const ch of cat.children) {
      builtinRows.push({
        key: `builtin-${cat.value}-${ch.value}`,
        primary: cat.value,
        secondary: ch.value,
        isBuiltin: true,
      })
    }
  }

  // Build user rows from userCategories state
  const userRows: CategoryRow[] = userCategories.map((uc) => ({
    key: `user-${uc.id}`,
    primary: uc.primary_category,
    secondary: uc.secondary_category,
    isBuiltin: false,
    userId: uc.id,
  }))

  function getExpenseCount(primary: string, secondary: string): number {
    return expenses.filter(
      (e) => e.primary_category === primary && e.secondary_category === secondary
    ).length
  }

  /**
   * Handles the modal form submission for both adding and editing a category.
   *
   * Validation, in order:
   * 1. Both fields must be non-empty after trimming whitespace.
   * 2. The primary+secondary pair must NOT match a built-in category
   *    (checked via {@link isBuiltinCategory}). This prevents users from
   *    creating categories that would be indistinguishable from the
   *    factory defaults.
   * 3. When adding (not editing), the pair must NOT already exist in
   *    the user's custom categories — duplicates are rejected.
   *
   * If validation passes the appropriate callback (`onAdd` or `onUpdate`)
   * is called and the modal is closed on success.
   */
  async function handleFinish(values: { primary: string; secondary: string }) {
    const primary = values.primary.trim()
    const secondary = values.secondary.trim()

    if (!primary || !secondary) return

    // Reject if the name collides with a built-in category.
    // A user cannot create "Food & Dining > Groceries" because it already
    // exists in the built-in list that ships with the app.
    if (isBuiltinCategory(primary, secondary)) {
      message.error('This category name conflicts with a built-in category. Please use a different name.')
      return
    }

    setSubmitting(true)
    try {
      if (editingRow?.userId) {
        await onUpdate(editingRow.userId, primary, secondary)
        message.success('Category updated')
      } else {
        // Check for duplicate user category
        const dup = userCategories.find(
          (uc) => uc.primary_category === primary && uc.secondary_category === secondary
        )
        if (dup) {
          message.error('This category already exists.')
          setSubmitting(false)
          return
        }
        await onAdd(primary, secondary)
        message.success('Category added')
      }
      handleClose()
    } catch (err) {
      // Log the full error for debugging; show a generic user-friendly message.
      // In a more advanced version, we could check the error code and show
      // specific messages (e.g., "duplicate name" vs "database error").
      console.error('Failed to save category:', err)
      message.error('Could not save category. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(row: CategoryRow) {
    setEditingRow(row)
    setModalOpen(true)
  }

  function handleAdd() {
    setEditingRow(null)
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingRow(null)
  }

  /** Deletes a user-created category. Built-in categories cannot be deleted
   *  (the delete button is hidden for them), so we only need to check for userId. */
  async function handleDelete(row: CategoryRow) {
    if (!row.userId) return
    try {
      await onDelete(row.userId)
      message.success('Category deleted')
    } catch (err) {
      console.error('Failed to delete category:', err)
      message.error('Could not delete category. Please try again.')
    }
  }

  // Shared column definitions that both category tables use. Extracted to
  // avoid repeating the same Primary/Secondary column config twice.
  const baseColumns = [
    { title: 'Primary Category', dataIndex: 'primary', key: 'primary', width: 200 },
    { title: 'Secondary Category', dataIndex: 'secondary', key: 'secondary', width: 200 },
  ]

  // --- Column definitions for the "My Categories" (user-created) table ---
  // Each row has: primary name, secondary name, a "Custom" type tag,
  // and action buttons (Edit / Delete with a confirmation popup).
  const userColumns: ColumnsType<CategoryRow> = [
    ...baseColumns,
    {
      title: 'Type',
      key: 'type',
      width: 100,
      render: (_: unknown, _record: CategoryRow) => (
        <Tag color="orange">Custom</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: CategoryRow) => {
        const count = getExpenseCount(record.primary, record.secondary)
        return (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete category"
              description={
                count > 0
                  ? `${count} expense${count > 1 ? 's' : ''} use${count === 1 ? 's' : ''} this category. Deleting it will keep those expenses unchanged — the category will no longer appear in dropdowns.`
                  : 'Are you sure you want to delete this category?'
              }
              onConfirm={() => handleDelete(record)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  // --- Column definitions for the "Built-in Categories" (read-only) table ---
  // Same layout as the user table, but the Type column shows "Built-in"
  // instead of "Custom" and the Actions column shows a "Locked" label
  // instead of edit/delete buttons.
  const builtinColumns: ColumnsType<CategoryRow> = [
    ...baseColumns,
    {
      title: 'Type',
      key: 'type',
      width: 100,
      render: () => <Tag color="blue">Built-in</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: () => (
        <span className="text-gray-400 text-xs">
          <LockOutlined className="mr-1" />
          Locked
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-gray-500 mt-1">
            Manage expense categories. Built-in categories are locked and cannot be modified.
          </p>
        </div>
      </div>

      {/* Built-in Categories */}
      <Card
        title="Built-in Categories"
        className="mb-6"
        extra={
          <span className="text-gray-400 text-xs">
            <LockOutlined className="mr-1" />
            Read-only
          </span>
        }
      >
        <Table
          columns={builtinColumns}
          dataSource={builtinRows}
          pagination={false}
          size="small"
          loading={loading}
          locale={{ emptyText: <Empty description="No built-in categories" /> }}
        />
      </Card>

      {/* My Categories */}
      <Card
        title="My Categories"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Category
          </Button>
        }
      >
        <Table
          columns={userColumns}
          dataSource={userRows}
          pagination={false}
          size="small"
          loading={loading}
          locale={{
            emptyText: (
              <Empty description="No custom categories yet">
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  Add Your First Category
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        title={editingRow ? 'Edit Category' : 'Add Category'}
        open={modalOpen}
        onCancel={handleClose}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          <Form.Item
            name="primary"
            label="Primary Category"
            rules={[
              { required: true, message: 'Please enter a primary category name' },
              {
                validator: (_: unknown, value: string) => {
                  if (value && isBuiltinCategory(value.trim())) {
                    return Promise.reject(new Error('This name conflicts with a built-in category'))
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input placeholder="e.g. Health" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="secondary"
            label="Secondary Category"
            rules={[
              { required: true, message: 'Please enter a secondary category name' },
              {
                validator: (_: unknown, value: string) => {
                  const primary = form.getFieldValue('primary')
                  if (value && primary && isBuiltinCategory(primary.trim(), value.trim())) {
                    return Promise.reject(new Error('This name conflicts with a built-in category'))
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input placeholder="e.g. Gym" maxLength={50} />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingRow ? 'Save Changes' : 'Add Category'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
