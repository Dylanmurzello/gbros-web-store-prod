/* eslint-disable @typescript-eslint/no-explicit-any */
// Square SDK types are loosely typed - using any is unavoidable for Square Web Payments SDK

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'

// CREATED: 2025-09-30 - Hook for Square payment integration
// Makes it easier to add Square payments to any checkout flow
// Handles token generation and error states like a boss 💪

/**
 * useSquarePayment Hook
 * 
 * Manages Square payment tokenization state
 * Use this in your checkout page to handle payment processing
 * 
 * Returns:
 * - paymentToken: Square payment token (send this to backend)
 * - tokenizing: Loading state during tokenization
 * - error: Error message if tokenization fails
 * - tokenizePayment: Function to trigger tokenization
 * - resetPayment: Clear token and errors
 */
export function useSquarePayment() {
  const [paymentToken, setPaymentToken] = useState<string | null>(null)
  const [tokenizing, setTokenizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Tokenize payment using Square Web Payments SDK
   * Calls global function exposed by SquarePaymentForm component
   */
  const tokenizePayment = useCallback(async (): Promise<string | null> => {
    setTokenizing(true)
    setError(null)

    try {
      // Check if Square tokenization function exists
      const tokenizeFn = (window as any).__squareTokenize
      
      if (!tokenizeFn) {
        throw new Error('Square payment form not initialized - did you forget to render <SquarePaymentForm>?')
      }

      // Call Square to tokenize the card
      const token = await tokenizeFn()

      if (!token) {
        throw new Error('Failed to tokenize payment - check card details')
      }

      logger.info('Payment tokenized successfully', 'useSquarePayment', { token })
      setPaymentToken(token)
      return token

    } catch (err: any) {
      const errorMessage = err.message || 'Payment tokenization failed'
      logger.error(errorMessage, 'useSquarePayment', err)
      setError(errorMessage)
      return null
    } finally {
      setTokenizing(false)
    }
  }, [])

  /**
   * Reset payment state (useful for retry scenarios)
   */
  const resetPayment = useCallback(() => {
    setPaymentToken(null)
    setError(null)
    setTokenizing(false)
  }, [])

  return {
    paymentToken,
    tokenizing,
    error,
    tokenizePayment,
    resetPayment,
  }
}
