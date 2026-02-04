'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

export function OTPInput({
  length = 8,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  className,
}: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)

  // Create array of digits, filling empty slots
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  const focusInput = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, length - 1))
    inputRefs.current[clampedIndex]?.focus()
  }

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, '').slice(-1)

    if (digit) {
      // Update the value at this index
      const newDigits = [...digits]
      newDigits[index] = digit
      onChange(newDigits.join('').trim())

      // Auto-advance to next input
      if (index < length - 1) {
        focusInput(index + 1)
      }
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    switch (e.key) {
      case 'Backspace':
        e.preventDefault()
        if (digits[index]) {
          // Clear current digit
          const newDigits = [...digits]
          newDigits[index] = ''
          onChange(newDigits.join('').trim())
        } else if (index > 0) {
          // Move to previous input and clear it
          const newDigits = [...digits]
          newDigits[index - 1] = ''
          onChange(newDigits.join('').trim())
          focusInput(index - 1)
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (index > 0) focusInput(index - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        if (index < length - 1) focusInput(index + 1)
        break
      case 'Delete':
        e.preventDefault()
        const newDigits = [...digits]
        newDigits[index] = ''
        onChange(newDigits.join('').trim())
        break
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '')
    if (pastedData) {
      const newValue = pastedData.slice(0, length)
      onChange(newValue)
      // Focus the next empty input or the last one
      const nextIndex = Math.min(newValue.length, length - 1)
      focusInput(nextIndex)
    }
  }

  const handleFocus = (index: number) => {
    setFocusedIndex(index)
    // Select the input content on focus
    inputRefs.current[index]?.select()
  }

  const handleBlur = () => {
    setFocusedIndex(null)
  }

  // Handle autoFocus
  React.useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      role="group"
      aria-label="OTP input"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          disabled={disabled}
          autoComplete="one-time-code"
          aria-label={`Digit ${index + 1} of ${length}`}
          className={cn(
            'h-12 w-10 rounded-md border bg-background text-center text-lg font-semibold transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            focusedIndex === index
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-input',
            digit ? 'border-primary/50' : '',
          )}
        />
      ))}
    </div>
  )
}
