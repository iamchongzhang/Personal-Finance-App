import { describe, it, expect } from 'vitest'
import {
  BUILTIN_CATEGORIES,
  getSecondaryCategories,
  isBuiltinCategory,
  mergeCategories,
} from './categories'

describe('getSecondaryCategories', () => {
  it('should return children of a built-in primary category', () => {
    const result = getSecondaryCategories('Food & Dining')
    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ value: 'Groceries', label: 'Groceries' })
  })

  it('should return empty array for unknown primary category', () => {
    const result = getSecondaryCategories('Nonexistent Category')
    expect(result).toEqual([])
  })
})

describe('isBuiltinCategory', () => {
  it('should return true for a known primary category', () => {
    expect(isBuiltinCategory('Food & Dining')).toBe(true)
  })

  it('should return true for a known primary + secondary pair', () => {
    expect(isBuiltinCategory('Transportation', 'Fuel/Charging')).toBe(true)
  })

  it('should return false for an unknown category', () => {
    expect(isBuiltinCategory('Alien Expenses')).toBe(false)
  })

  it('should return false for a known primary but unknown secondary', () => {
    expect(isBuiltinCategory('Housing', 'Pet Rent')).toBe(false)
  })
})

describe('mergeCategories', () => {
  it('should return built-in categories when no user categories provided', () => {
    const result = mergeCategories([])
    // All built-in categories should be there
    expect(result.length).toBe(BUILTIN_CATEGORIES.length)
    expect(result[0].isBuiltin).toBe(true)
  })

  it('should append user-created categories after built-in ones', () => {
    const result = mergeCategories([
      { id: 1, primary_category: 'Pets', secondary_category: 'Dog Food' },
      { id: 2, primary_category: 'Pets', secondary_category: 'Vet' },
    ])
    // Built-in categories come first
    expect(result[0].isBuiltin).toBe(true)
    // User category "Pets" should be at the end
    const last = result[result.length - 1]
    expect(last.isBuiltin).toBe(false)
    expect(last.value).toBe('Pets')
    expect(last.children).toHaveLength(2)
  })
})
