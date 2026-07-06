import { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
} from 'antd'
import dayjs from 'dayjs'
import { categories, getSecondaryCategories } from '../data/categories'
import type { Expense } from '../types/expense'

interface ExpenseFormProps {
  open: boolean
  editingExpense: Expense | null
  onClose: () => void
  onSubmit: (expense: Expense) => void
}

export default function ExpenseForm({
  open,
  editingExpense,
  onClose,
  onSubmit,
}: ExpenseFormProps) {
  const [form] = Form.useForm()
  const [primaryCategory, setPrimaryCategory] = useState<string | undefined>()
  const [secondaryOptions, setSecondaryOptions] = useState<
    { value: string; label: string }[]
  >([])

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        form.setFieldsValue({
          ...editingExpense,
          date: dayjs(editingExpense.date),
        })
        setPrimaryCategory(editingExpense.primary_category)
        setSecondaryOptions(
          getSecondaryCategories(editingExpense.primary_category)
        )
      } else {
        form.resetFields()
        setPrimaryCategory(undefined)
        setSecondaryOptions([])
      }
    }
  }, [open, editingExpense, form])

  const handlePrimaryChange = (value: string) => {
    setPrimaryCategory(value)
    setSecondaryOptions(getSecondaryCategories(value))
    form.setFieldValue('secondary_category', undefined)
  }

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

  return (
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
          label="Primary Category"
          rules={[{ required: true, message: 'Please select a primary category' }]}
        >
          <Select
            placeholder="Select primary category"
            options={categories}
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
            {editingExpense ? 'Save Changes' : 'Add Expense'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
