import { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Space,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getSecondaryCategories, isBuiltinCategory } from '../data/categories'
import type { Expense, MergedCategoryNode } from '../types/expense'

/**
 * Props for the ExpenseForm component.
 *
 * @param open             - Whether the modal is visible.
 * @param editingExpense   - The expense being edited, or null when adding a new one.
 * @param onClose          - Callback to close the modal without saving.
 * @param onSubmit         - Callback fired when the form is submitted (handles both add and edit).
 * @param mergedCategories - Combined list of built-in and custom categories for the dropdowns.
 * @param onAddCategory    - Callback to persist a newly created custom category.
 */
interface ExpenseFormProps {
  open: boolean
  editingExpense: Expense | null
  onClose: () => void
  onSubmit: (expense: Expense) => void
  mergedCategories: MergedCategoryNode[]
  onAddCategory: (primary: string, secondary: string) => Promise<void>
}

/**
 * A modal form for adding a new expense or editing an existing one.
 *
 * When `editingExpense` is provided, the form is pre-filled with that expense's
 * data and the title changes to "Edit Expense." When it is `null`, the form
 * starts blank and the title reads "Add Expense."
 *
 * Includes a **Quick Create** secondary modal that lets the user create a new
 * custom category without leaving the expense form. After creating the category,
 * it is automatically selected in the primary and secondary dropdowns.
 */
export default function ExpenseForm({
  open,
  editingExpense,
  onClose,
  onSubmit,
  mergedCategories,
  onAddCategory,
}: ExpenseFormProps) {
  const [form] = Form.useForm()
  const [quickForm] = Form.useForm()
  const [primaryCategory, setPrimaryCategory] = useState<string | undefined>()
  const [secondaryOptions, setSecondaryOptions] = useState<
    { value: string; label: string }[]
  >([])
  const [quickModalOpen, setQuickModalOpen] = useState(false)
  const [quickSubmitting, setQuickSubmitting] = useState(false)

  // When the modal opens, either pre-fill the form with the expense being
  // edited, or reset it to blank defaults for a new entry.
  useEffect(() => {
    if (open) {
      if (editingExpense) {
        form.setFieldsValue({
          ...editingExpense,
          date: dayjs(editingExpense.date),
        })
        setPrimaryCategory(editingExpense.primary_category)
        setSecondaryOptions(
          getSecondaryCategories(editingExpense.primary_category, mergedCategories)
        )
      } else {
        form.resetFields()
        setPrimaryCategory(undefined)
        setSecondaryOptions([])
      }
    }
  }, [open, editingExpense, form])

  // Re-compute secondary options when mergedCategories updates
  useEffect(() => {
    if (primaryCategory) {
      setSecondaryOptions(getSecondaryCategories(primaryCategory, mergedCategories))
    }
  }, [mergedCategories, primaryCategory])

  /**
   * Called when the user picks a different primary category in the dropdown.
   *
   * Loads the matching secondary-category options and clears any previously
   * selected secondary category so the user cannot leave a stale value.
   */
  const handlePrimaryChange = (value: string) => {
    setPrimaryCategory(value)
    setSecondaryOptions(getSecondaryCategories(value, mergedCategories))
    form.setFieldValue('secondary_category', undefined)
  }

  /**
   * Called when the user submits the expense form (Add or Edit).
   *
   * Converts the Ant Design form values (which use a dayjs object for the date)
   * into a plain {@link Expense} object with an ISO date string (`YYYY-MM-DD`).
   * If `editingExpense` has an id, it is included so the backend knows to UPDATE
   * instead of INSERT.
   */
  const handleFinish = (values: {
    amount: number
    primary_category: string
    secondary_category: string
    date: dayjs.Dayjs
    note: string
  }) => {
    onSubmit({
      ...(editingExpense?.id ? { id: editingExpense.id } : {}),
      amount: values.amount,
      primary_category: values.primary_category,
      secondary_category: values.secondary_category,
      date: values.date.format('YYYY-MM-DD'),
      note: values.note || '',
    })
  }

  /**
   * Called when the user submits the quick-create category modal.
   *
   * Validates the new category names (must not be empty, must not conflict with
   * built-in categories), calls `onAddCategory` to persist them to the database,
   * and then auto-selects the newly created category in the parent expense form's
   * dropdowns so the user can continue without interruption.
   */
  const handleQuickCreate = async (values: { primary: string; secondary: string }) => {
    const primary = values.primary.trim()
    const secondary = values.secondary.trim()
    if (!primary || !secondary) return

    if (isBuiltinCategory(primary, secondary)) {
      message.error('This name conflicts with a built-in category.')
      return
    }

    setQuickSubmitting(true)
    try {
      await onAddCategory(primary, secondary)
      // Auto-select the newly created category
      form.setFieldsValue({ primary_category: primary, secondary_category: secondary })
      setPrimaryCategory(primary)
      setSecondaryOptions(getSecondaryCategories(primary, mergedCategories))
      message.success('Category created')
      setQuickModalOpen(false)
    } catch {
      message.error('Failed to create category')
    } finally {
      setQuickSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            amount: undefined,
            primary_category: undefined,
            secondary_category: undefined,
            date: dayjs(),
            note: '',
          }}
        >
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount (AUD $)"
            rules={[{ required: true, message: 'Please enter an amount' }]}
          >
            <InputNumber
              className="w-full"
              min={0.01}
              step={0.01}
              precision={2}
              prefix="$"
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="primary_category"
            label={
              <Space>
                <span>Primary Category</span>
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setQuickModalOpen(true)}
                  title="Quick create a new category"
                >
                  New
                </Button>
              </Space>
            }
            rules={[{ required: true, message: 'Please select a primary category' }]}
          >
            <Select
              placeholder="Select primary category"
              options={mergedCategories}
              onChange={handlePrimaryChange}
            />
          </Form.Item>

          <Form.Item
            name="secondary_category"
            label="Secondary Category"
            rules={[
              { required: true, message: 'Please select a secondary category' },
            ]}
          >
            <Select
              placeholder="Select secondary category"
              options={secondaryOptions}
              disabled={!primaryCategory}
            />
          </Form.Item>

          <Form.Item name="note" label="Note">
            <Input.TextArea rows={2} placeholder="Optional note..." />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Button onClick={onClose} className="mr-2">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {/* Button label changes depending on whether we are adding or editing */}
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Quick-create category modal */}
      <Modal
        title="New Category"
        open={quickModalOpen}
        onCancel={() => setQuickModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={quickForm}
          layout="vertical"
          onFinish={handleQuickCreate}
        >
          <Form.Item
            name="primary"
            label="Primary Category Name"
            rules={[
              { required: true, message: 'Please enter a primary category name' },
              {
                validator: (_: unknown, value: string) => {
                  if (value && isBuiltinCategory(value.trim())) {
                    return Promise.reject(new Error('Conflicts with a built-in category'))
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
            label="Secondary Category Name"
            rules={[
              { required: true, message: 'Please enter a secondary category name' },
            ]}
          >
            <Input placeholder="e.g. Gym" maxLength={50} />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setQuickModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={quickSubmitting}>
              Create
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  )
}
