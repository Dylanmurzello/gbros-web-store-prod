'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
// Square SDK types are loosely typed - using any is unavoidable for Square Web Payments SDK objects

import { useEffect, useRef, useState } from 'react'
import { logger } from '@/lib/logger'

// CREATED: 2025-09-30 - Square Web Payments SDK integration 💳
// Handles secure payment card input without touching actual card data
// Square hosts the form fields = PCI compliance for free fr fr

/**
 * SquarePaymentForm Component
 * 
 * Renders Square's secure payment form using Web Payments SDK
 * Card data never touches our servers = PCI compliance without the headache ✨
 * 
 * Flow:
 * 1. Load Square SDK from CDN
 * 2. Initialize payment form with app ID + location ID
 * 3. Render card input field (Square handles security)
 * 4. On submit, tokenize card data
 * 5. Return token to parent for payment processing
 * 
 * Props:
 * @param applicationId - Square Application ID (from Square Dashboard)
 * @param locationId - Square Location ID
 * @param onPaymentTokenReceived - Callback when card tokenized successfully
 */

interface SquarePaymentFormProps {
  applicationId: string
  locationId: string
  onPaymentTokenReceived: (token: string) => void
  onError?: (error: string) => void
}

export default function SquarePaymentForm({
  applicationId,
  locationId,
  onPaymentTokenReceived,
  onError,
}: SquarePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const cardRef = useRef<any>(null) // Square Card object
  const paymentsRef = useRef<any>(null) // Square Payments object
  const initializedRef = useRef(false) // Track if already initialized (prevents React strict mode double-init)

  /**
   * Load Square Web Payments SDK from CDN
   * Only loads once, then initializes payment form
   */
  useEffect(() => {
    // Check if SDK already loaded globally (prevents double-load)
    if ((window as any).Square) {
      setSdkLoaded(true)
      setIsLoading(false)
      return
    }

    // Inject Square SDK script into page (environment-aware URL)
    const script = document.createElement('script')
    const sdkUrl = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production'
      ? 'https://web.squarecdn.com/v1/square.js' // Production SDK
      : 'https://sandbox.web.squarecdn.com/v1/square.js' // Sandbox SDK
    script.src = sdkUrl
    script.async = true
    script.onload = () => {
      logger.info('Square Web Payments SDK loaded successfully', 'SquarePaymentForm')
      setSdkLoaded(true)
      setIsLoading(false)
    }
    script.onerror = () => {
      const errorMsg = 'Failed to load Square SDK - check your internet connection'
      logger.error(errorMsg, 'SquarePaymentForm')
      onError?.(errorMsg)
      setIsLoading(false)
    }

    document.body.appendChild(script)

    // Cleanup on unmount (remove script tag)
    return () => {
      document.body.removeChild(script)
    }
  }, [onError])

  /**
   * Initialize Square Payment Form
   * Creates card input field and attaches to DOM
   */
  useEffect(() => {
    if (!sdkLoaded || !applicationId || !locationId) {
      return
    }

    // Prevent double initialization (React strict mode in dev causes double mount)
    if (initializedRef.current) {
      logger.info('Square payment form already initialized, skipping', 'SquarePaymentForm')
      return
    }

    const initializeSquarePayments = async () => {
      try {
        const Square = (window as any).Square

        if (!Square) {
          throw new Error('Square SDK not loaded')
        }

        // Mark as initialized before async operations
        initializedRef.current = true

        // Initialize payments object with your Square credentials
        const payments = Square.payments(applicationId, locationId)
        paymentsRef.current = payments

        // Create card payment method
        const card = await payments.card()
        await card.attach('#card-container')
        cardRef.current = card

        logger.info('Square payment form initialized', 'SquarePaymentForm')
      } catch (error: any) {
        initializedRef.current = false // Reset on error so we can retry
        const errorMsg = `Failed to initialize Square: ${error.message}`
        logger.error(errorMsg, 'SquarePaymentForm', error)
        onError?.(errorMsg)
      }
    }

    initializeSquarePayments()

    // Cleanup on unmount
    return () => {
      if (cardRef.current) {
        try {
          cardRef.current.destroy()
          initializedRef.current = false // Reset for next mount
        } catch {
          // Ignore destroy errors - card cleanup can fail safely
        }
      }
    }
  }, [sdkLoaded, applicationId, locationId, onError])

  /**
   * Tokenize card data and send to parent
   * Called when user submits checkout form
   * Returns payment token that backend uses to charge card
   */
  const handleTokenize = async (): Promise<string | null> => {
    if (!cardRef.current) {
      const error = 'Payment form not initialized'
      logger.error(error, 'SquarePaymentForm')
      onError?.(error)
      return null
    }

    try {
      logger.info('Tokenizing card...', 'SquarePaymentForm')
      
      // Square tokenizes the card data (this is the magic moment ✨)
      const result = await cardRef.current.tokenize()

      if (result.status === 'OK') {
        // W in the chat, card tokenized successfully 🎉
        logger.info('Card tokenized successfully', 'SquarePaymentForm', { token: result.token })
        onPaymentTokenReceived(result.token)
        return result.token
      } else {
        // Square said nah, something wrong with the card
        const errors = result.errors?.map((e: any) => e.message).join(', ') || 'Unknown error'
        logger.error(`Tokenization failed: ${errors}`, 'SquarePaymentForm')
        onError?.(errors)
        return null
      }
    } catch (error: any) {
      const errorMsg = `Tokenization error: ${error.message}`
      logger.error(errorMsg, 'SquarePaymentForm', error)
      onError?.(errorMsg)
      return null
    }
  }

  // Expose tokenize method to parent component
  useEffect(() => {
    // Store reference so parent can call tokenize when needed
    ;(window as any).__squareTokenize = handleTokenize
  }, [handleTokenize])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading payment form...</span>
      </div>
    )
  }

  return (
    <div className="square-payment-form">
      {/* Square Card Container - SDK injects secure card input here */}
      <div id="card-container" className="my-4">
        {/* Square automatically renders card input field here */}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        🔒 Your payment information is securely processed by Square and never touches our servers
      </p>
    </div>
  )
}
