/**
 * Converts snake_case keys to camelCase recursively
 */
export function toCamelCase<T>(obj: Record<string, unknown>): T {
  if (obj === null || obj === undefined) {
    return obj as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? toCamelCase(item as Record<string, unknown>)
        : item,
    ) as T
  }

  if (typeof obj !== 'object') {
    return obj as T
  }

  const result: Record<string, unknown> = {}

  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    )
    const value = obj[key]

    if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? toCamelCase(item as Record<string, unknown>)
          : item,
      )
    } else if (typeof value === 'object' && value !== null) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>)
    } else {
      result[camelKey] = value
    }
  }

  return result as T
}

/**
 * Converts camelCase keys to snake_case
 */
export function toSnakeCase<T>(obj: Record<string, unknown>): T {
  if (obj === null || obj === undefined) {
    return obj as T
  }

  if (typeof obj !== 'object') {
    return obj as T
  }

  const result: Record<string, unknown> = {}

  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`,
    )
    const value = obj[key]

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[snakeKey] = toSnakeCase(value as Record<string, unknown>)
    } else {
      result[snakeKey] = value
    }
  }

  return result as T
}
