'use client'
import Image from 'next/image'

// This checkout page is about to be absolutely WILD with live Vendure data 🚀
// Making sure every input connects to the backend like it's 2024 fr fr

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import { logger } from '@/lib/logger' // PERFORMANCE FIX: 2025-09-30 - Proper logging + race condition fix 🏁
import { checkoutSchema, validateForm } from '@/lib/validation/schemas' // ARCHITECTURE FIX: 2025-09-30 - No more garbage data 🚫
import NavigationHeader from '@/components/NavigationHeader'
import Footer from '@/components/Footer'
import MobileMenu from '@/components/MobileMenu'
import CartDrawer from '@/components/CartDrawer'
import SquarePaymentForm from '@/components/SquarePaymentForm' // PAYMENT: 2025-09-30 - Square payment integration 💳
import { useSquarePayment } from '@/hooks/useSquarePayment' // PAYMENT: 2025-09-30 - Square tokenization hook
import { navigation, footerNavigation } from '@/data/navigation'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAvailableCountries,
  getEligibleShippingMethods,
  setCustomerForOrder,
  setOrderShippingAddress,
  setOrderBillingAddress,
  setOrderShippingMethod,
  addPaymentToOrder,
  transitionOrderToState,
  isErrorResult,
  formatPrice,
  getProductImageUrl
} from '@/lib/vendure/api'
import { Country } from '@/lib/vendure/types'

// Using consistent navigation from the main site data 🔥

// Basic checkout form interface - keeping it clean but comprehensive
interface CheckoutForm {
  email: string
  firstName: string
  lastName: string
  company?: string
  streetLine1: string
  streetLine2?: string
  city: string
  province: string
  postalCode: string
  countryCode: string
  phoneNumber?: string
  billingDifferent: boolean
  // Billing fields (optional if same as shipping)
  billingFirstName?: string
  billingLastName?: string
  billingCompany?: string
  billingStreetLine1?: string
  billingStreetLine2?: string
  billingCity?: string
  billingProvince?: string
  billingPostalCode?: string
  billingCountryCode?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, loading: cartLoading, refreshCart, clearCart } = useCart()
  const { customer } = useAuth() // Get auth state properly 💀
  const { error: paymentError, tokenizePayment } = useSquarePayment() // PAYMENT: Square tokenization
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [orderCompleted, setOrderCompleted] = useState(false) // Track order completion state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({}) // ARCHITECTURE FIX: 2025-09-30 - Track validation errors
  
  // Checkout data from Vendure
  const [countries, setCountries] = useState<Country[]>([])
  
  // Form state - this is where the magic happens ✨
  const [form, setForm] = useState<CheckoutForm>({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    province: '',
    postalCode: '',
    countryCode: '',
    phoneNumber: '',
    billingDifferent: false,
  })

  // Load countries and payment methods when component mounts
  // Because we're not peasants, we load everything async like pros 💪
  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        const countryData = await getAvailableCountries()

        setCountries(countryData)
        // Payment methods will be handled separately when needed

        // Set default country to US if available
        const defaultCountry = countryData.find(c => c.code === 'US') || countryData[0]
        if (defaultCountry) {
          setForm(prev => ({ ...prev, countryCode: defaultCountry.code }))
        }
      } catch (err) {
        console.error('Failed to load checkout data:', err)
        setError('Failed to load checkout data. Please refresh the page.')
      }
    }

    loadCheckoutData()
  }, [])

  // Pre-populate form with customer data if available
  useEffect(() => {
    // If cart has customer info, use it (for logged-in users)
    if (cart?.customer) {
      setForm(prev => ({
        ...prev,
        email: cart.customer?.emailAddress || prev.email,
        firstName: cart.customer?.firstName || prev.firstName,
        lastName: cart.customer?.lastName || prev.lastName,
      }))
    }
    // Otherwise if user is logged in via auth context, use that
    else if (customer) {
      setForm(prev => ({
        ...prev,
        email: customer.emailAddress || prev.email,
        firstName: customer.firstName || prev.firstName,
        lastName: customer.lastName || prev.lastName,
      }))
    }
  }, [cart?.customer, customer])

  // No shipping method selection needed - Vendure will auto-apply the default shipping method
  // configured in admin (local pickup)

  // Handle form field changes - keeping it smooth like butter 🧈
  const handleInputChange = (field: keyof CheckoutForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError(null) // Clear errors when user starts typing
    // Clear validation error for this specific field (instant feedback)
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  // Removed handleShippingMethodChange since we're using auto-selection now
  // Shipping method is set during form submission, not as user types

  // The main event - processing the checkout! 🎯
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cart || cart.lines.length === 0) {
      setError('Your cart is empty!')
      return
    }
    
    // ARCHITECTURE FIX: 2025-09-30 - Validate ALL fields before API submission 🛡️
    const validation = validateForm(checkoutSchema, form);
    
    if (!validation.success) {
      setValidationErrors(validation.errors || {});
      setError('Please fix the errors in the form before submitting');
      logger.warn('Checkout form validation failed', 'CheckoutPage', validation.errors);
      
      // Scroll to top so user sees the errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return; // STOP submission if validation fails
    }
    
    setValidationErrors({});
    setLoading(true)
    setError(null)
    
    try {
      // Check if order is already in ArrangingPayment (payment retry scenario)
      // If payment failed before, order stays in ArrangingPayment state - we just retry payment
      const isPaymentRetry = cart?.state === 'ArrangingPayment';
      
      if (!isPaymentRetry) {
        // FIRST-TIME CHECKOUT - Set up all order details
        
        // Step 1: Set customer info ONLY if the order doesn't already have one
        if (!customer) {
        const customerResult = await setCustomerForOrder({
          firstName: form.firstName,
          lastName: form.lastName,
          emailAddress: form.email,
          phoneNumber: form.phoneNumber,
        })

        if (isErrorResult(customerResult)) {
          throw new Error(customerResult.message)
        }
      }

      // Step 2: Set shipping address (do this before billing to establish the shipping context)
      const shippingResult = await setOrderShippingAddress({
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        company: form.company || undefined,
        streetLine1: form.streetLine1,
        streetLine2: form.streetLine2 || undefined,
        city: form.city,
        province: form.province || undefined,
        postalCode: form.postalCode || undefined,
        countryCode: form.countryCode,
        phoneNumber: form.phoneNumber || undefined,
      })

      if (isErrorResult(shippingResult)) {
        throw new Error(shippingResult.message || 'Failed to set shipping address')
      }

      // Step 3: Set billing address ONLY if different from shipping
      // If same as shipping, Vendure will use shipping address automatically
      if (form.billingDifferent) {
        const billingResult = await setOrderBillingAddress({
          fullName: `${form.billingFirstName} ${form.billingLastName}`.trim(),
          company: form.billingCompany || undefined,
          streetLine1: form.billingStreetLine1!,
          streetLine2: form.billingStreetLine2 || undefined,
          city: form.billingCity!,
          province: form.billingProvince || undefined,
          postalCode: form.billingPostalCode || undefined,
          countryCode: form.billingCountryCode!,
        })
        
        if (isErrorResult(billingResult)) {
          throw new Error(billingResult.message)
        }
      }
      // If billing is same as shipping, don't set it - Vendure handles this automatically

      // Step 4: Get and set shipping method (required before ArrangingPayment transition)
      const shippingMethods = await getEligibleShippingMethods()
      if (shippingMethods.length === 0) {
        throw new Error('No shipping methods available for your address')
      }
      
      // Auto-select first shipping method (local pickup)
      const shippingMethodResult = await setOrderShippingMethod(shippingMethods[0].id)
      if (isErrorResult(shippingMethodResult)) {
        throw new Error(shippingMethodResult.message || 'Failed to set shipping method')
      }

        // Step 5: Transition to ArrangingPayment state
        const transitionResult = await transitionOrderToState('ArrangingPayment')
        if (isErrorResult(transitionResult)) {
          throw new Error(transitionResult.message || 'Failed to prepare order for payment')
        }
      } // End of first-time checkout setup
      
      // PAYMENT STEP - Works for both first-time and retry
      // Step 6: Tokenize payment with Square (card data never touches our servers) 🔒
      const token = await tokenizePayment()
      if (!token) {
        throw new Error(paymentError || 'Failed to process payment - please check your card details')
      }

      // Step 7: Add payment to order with Square token
      const paymentResult = await addPaymentToOrder({
        method: 'square-payment', // Square payment handler we just built 💸
        metadata: {
          sourceId: token, // Square payment token from Web SDK
        }
      })
      
      if (isErrorResult(paymentResult)) {
        throw new Error(paymentResult.message || 'Payment failed')
      }

      setSuccess('Order placed successfully! Redirecting to confirmation...')

      // Mark order as completed to prevent empty cart message
      setOrderCompleted(true)

      // Clear the cart after successful order - no more zombie items! 🧟‍♂️
      clearCart()

      // Redirect to order confirmation page with order code
      // paymentResult is an Order object when successful
      const orderCode = paymentResult.code
      setTimeout(() => {
        router.push(`/order-confirmation?order=${orderCode}`)
      }, 1500) // Reduced delay for better UX
      
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during checkout')
    } finally {
      setLoading(false)
    }
  }

  // Redirect if no cart - using useEffect to avoid render-time side effects
  useEffect(() => {
    // Don't redirect if:
    // - Order was just completed
    // - Order is in ArrangingPayment state (allow payment retry)
    const isRetryingPayment = cart?.state === 'ArrangingPayment';
    
    if (!cartLoading && (!cart || cart.lines.length === 0) && !orderCompleted && !isRetryingPayment) {
      router.push('/cart')
    }
  }, [cartLoading, cart, router, orderCompleted])

  // Memoize Square Payment Form to prevent re-renders on every keystroke
  // This prevents the card fields from flickering as user types in address fields
  const squareForm = useMemo(() => (
    <SquarePaymentForm
      applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
      locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
      onPaymentTokenReceived={() => {
        logger.info('Payment token received', 'CheckoutPage')
      }}
      onError={(error) => {
        setError(error)
        logger.error(error, 'CheckoutPage - Square Payment')
      }}
    />
  ), []) // Empty deps - only create once, never re-render

  // Allow page to render if order is in ArrangingPayment (payment retry scenario)
  const isRetryingPayment = cart?.state === 'ArrangingPayment';
  
  if (cartLoading || ((!cart || cart.lines.length === 0) && !orderCompleted && !isRetryingPayment)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">
          {cartLoading ? 'Loading checkout...' : 'Redirecting to cart...'}
        </div>
      </div>
    )
  }

  // Show success message during order completion transition
  if (orderCompleted && success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <div className="text-2xl font-semibold text-gray-900 mb-2">{success}</div>
          <div className="text-gray-600">Please wait while we redirect you...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />
      <CartDrawer />

      <header className="relative overflow-hidden">
        <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <h1 className="sr-only">Checkout</h1>

          {/* Error/Success Messages */}
          {/* Payment retry message */}
          {cart?.state === 'ArrangingPayment' && !success && !error && (
            <div className="mb-6 rounded-md bg-blue-50 p-4">
              <div className="text-sm text-blue-800">
                Payment required to complete your order. Please enter your payment details below.
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-800">{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
            {/* Validation Errors Alert - NO MORE GARBAGE DATA 🚫 */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="lg:col-span-2 mb-6 rounded-md bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Please fix these errors before submitting:
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc space-y-1 pl-5">
                        {Object.entries(validationErrors).map(([field, message]) => (
                          <li key={field}>
                            <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>: {message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              {/* Contact Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900">Contact information</h2>

                <div className="mt-4">
                  <label htmlFor="email-address" className="block text-sm/6 font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      id="email-address"
                      name="email-address"
                      type="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!!cart?.customer} // Disable if order already has customer
                      className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${cart?.customer ? 'bg-gray-100' : 'bg-white'}`}
                    />
                    {cart?.customer && (
                      <p className="mt-1 text-sm text-gray-500">
                        Order will be associated with {cart.customer.emailAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="mt-10 border-t border-gray-200 pt-10">
                <h2 className="text-lg font-medium text-gray-900">Shipping information</h2>

                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-700">
                      First name
                    </label>
                    <div className="mt-2">
                      <input
                        id="first-name"
                        name="first-name"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={form.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-700">
                      Last name
                    </label>
                    <div className="mt-2">
                      <input
                        id="last-name"
                        name="last-name"
                        type="text"
                        autoComplete="family-name"
                        required
                        value={form.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="company" className="block text-sm/6 font-medium text-gray-700">
                      Company (optional)
                    </label>
                    <div className="mt-2">
                      <input
                        id="company"
                        name="company"
                        type="text"
                        value={form.company || ''}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm/6 font-medium text-gray-700">
                      Address
                    </label>
                    <div className="mt-2">
                      <input
                        id="address"
                        name="address"
                        type="text"
                        autoComplete="street-address"
                        required
                        value={form.streetLine1}
                        onChange={(e) => handleInputChange('streetLine1', e.target.value)}
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="apartment" className="block text-sm/6 font-medium text-gray-700">
                      Apartment, suite, etc. (optional)
                    </label>
                    <div className="mt-2">
                      <input
                        id="apartment"
                        name="apartment"
                        type="text"
                        value={form.streetLine2 || ''}
                        onChange={(e) => handleInputChange('streetLine2', e.target.value)}
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm/6 font-medium text-gray-700">
                      City
                    </label>
                    <div className="mt-2">
                      <input
                        id="city"
                        name="city"
                        type="text"
                        autoComplete="address-level2"
                        required
                        value={form.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm/6 font-medium text-gray-700">
                      Country
                    </label>
                    <div className="mt-2 grid grid-cols-1">
                      <select
                        id="country"
                        name="country"
                        autoComplete="country-name"
                        required
                        value={form.countryCode}
                        onChange={(e) => handleInputChange('countryCode', e.target.value)}
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      >
                        <option value="">Select a country</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500 sm:size-4"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="region" className="block text-sm/6 font-medium text-gray-700">
                      State / Province
                    </label>
                    <div className="mt-2">
                      <input
                        id="region"
                        name="region"
                        type="text"
                        autoComplete="address-level1"
                        value={form.province}
                        onChange={(e) => handleInputChange('province', e.target.value)}
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="postal-code" className="block text-sm/6 font-medium text-gray-700">
                      Postal code
                    </label>
                    <div className="mt-2">
                      <input
                        id="postal-code"
                        name="postal-code"
                        type="text"
                        autoComplete="postal-code"
                        value={form.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="phone" className="block text-sm/6 font-medium text-gray-700">
                      Phone (optional)
                    </label>
                    <div className="mt-2">
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phoneNumber || ''}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Method - Simple placeholder for local pickup */}
              <div className="mt-10 border-t border-gray-200 pt-10">
                <h2 className="text-lg font-medium text-gray-900">Delivery method</h2>
                
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Local Pickup</p>
                      <p className="mt-1 text-sm text-gray-500">Pick up at store location</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(0, cart?.currencyCode || 'USD')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address Toggle */}
              <div className="mt-10 border-t border-gray-200 pt-10">
                <div className="flex items-center">
                  <input
                    id="billing-different"
                    type="checkbox"
                    checked={form.billingDifferent}
                    onChange={(e) => handleInputChange('billingDifferent', e.target.checked)}
                    className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label htmlFor="billing-different" className="ml-2 block text-sm text-gray-900">
                    Billing address is different from shipping address
                  </label>
                </div>

                {/* Billing Address Fields - only show if different */}
                {form.billingDifferent && (
                  <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    <div>
                      <label htmlFor="billing-first-name" className="block text-sm/6 font-medium text-gray-700">
                        First name
                      </label>
                      <div className="mt-2">
                        <input
                          id="billing-first-name"
                          name="billing-first-name"
                          type="text"
                          required={form.billingDifferent}
                          value={form.billingFirstName || ''}
                          onChange={(e) => handleInputChange('billingFirstName', e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="billing-last-name" className="block text-sm/6 font-medium text-gray-700">
                        Last name
                      </label>
                      <div className="mt-2">
                        <input
                          id="billing-last-name"
                          name="billing-last-name"
                          type="text"
                          required={form.billingDifferent}
                          value={form.billingLastName || ''}
                          onChange={(e) => handleInputChange('billingLastName', e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    {/* Add more billing fields as needed - keeping it short for demo */}
                    <div className="sm:col-span-2">
                      <label htmlFor="billing-address" className="block text-sm/6 font-medium text-gray-700">
                        Address
                      </label>
                      <div className="mt-2">
                        <input
                          id="billing-address"
                          name="billing-address"
                          type="text"
                          required={form.billingDifferent}
                          value={form.billingStreetLine1 || ''}
                          onChange={(e) => handleInputChange('billingStreetLine1', e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Section - Square Integration */}
              <div className="mt-10 border-t border-gray-200 pt-10">
                <h2 className="text-lg font-medium text-gray-900">Payment</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Secure payment processing powered by Square
                </p>

                {/* Square Payment Form - memoized to prevent re-renders on keystroke */}
                {squareForm}

                {/* Show payment errors */}
                {paymentError && (
                  <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-800">{paymentError}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Order summary - right column */}
            <div className="mt-10 lg:mt-0">
              <h2 className="text-lg font-medium text-gray-900">Order summary</h2>

              <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                <h3 className="sr-only">Items in your cart</h3>
                <ul role="list" className="divide-y divide-gray-200">
                  {cart?.lines.map((line) => (
                    <li key={line.id} className="flex px-4 py-6 sm:px-6">
                      <div className="shrink-0">
                        <Image
                width={400}
                height={400}
                          alt={line.productVariant.product.name}
                          src={getProductImageUrl(line.featuredAsset?.preview, 'thumb')}
                          className="w-20 h-20 rounded-md object-cover"
                        />
                      </div>

                      <div className="ml-6 flex flex-1 flex-col">
                        <div className="flex">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm">
                              <a 
                                href={`/shop/${line.productVariant.product.slug}`} 
                                className="font-medium text-gray-700 hover:text-gray-800"
                              >
                                {line.productVariant.product.name}
                              </a>
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">{line.productVariant.name}</p>
                            <p className="mt-1 text-sm text-gray-500">SKU: {line.productVariant.sku}</p>
                          </div>
                        </div>

                        <div className="flex flex-1 items-end justify-between pt-2">
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {formatPrice(line.linePriceWithTax, cart.currencyCode)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">Qty: {line.quantity}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {/* Order totals */}
                <dl className="space-y-6 border-t border-gray-200 px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm">Subtotal</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatPrice(cart?.subTotalWithTax || 0, cart?.currencyCode || 'USD')}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm">Shipping</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatPrice(cart?.shippingWithTax || 0, cart?.currencyCode || 'USD')}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                    <dt className="text-base font-medium">Total</dt>
                    <dd className="text-base font-medium text-gray-900">
                      {formatPrice(cart?.totalWithTax || 0, cart?.currencyCode || 'USD')}
                    </dd>
                  </div>
                </dl>

                <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                  <button
                    type="submit"
                    disabled={loading || !cart || cart.lines.length === 0}
                    className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>

                  {/* Cancel Order button - only shows if stuck in ArrangingPayment 🚨 */}
                  {/* UX FIX: 2025-10-01 - Let customer escape stuck payment state */}
                  {cart?.state === 'ArrangingPayment' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          setError(null);
                          
                          // Cancel the order via API
                          const result = await transitionOrderToState('Cancelled');
                          
                          if (isErrorResult(result)) {
                            setError('Failed to cancel order. Please try again.');
                            return;
                          }
                          
                          // Clear cart state and refresh
                          clearCart();
                          await refreshCart();
                          
                          // Show success and redirect to shop
                          setSuccess('Order cancelled successfully!');
                          setTimeout(() => {
                            router.push('/shop');
                          }, 1000);
                        } catch (err) {
                          console.error('Error cancelling order:', err);
                          setError('Failed to cancel order. Please refresh and try again.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="mt-3 w-full rounded-md border-2 border-red-600 bg-white px-4 py-3 text-base font-medium text-red-600 shadow-sm hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Cancelling...' : 'Cancel Order & Start Over'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer navigation={footerNavigation} />
    </div>
  )
}
