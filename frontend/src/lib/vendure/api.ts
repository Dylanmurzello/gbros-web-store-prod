import { graphqlClient, requestWithAuth } from './client';
import {
  SEARCH_PRODUCTS,
  GET_COLLECTIONS,
  GET_PRODUCT,
  GET_ACTIVE_CHANNEL,
  GET_ACTIVE_ORDER,
  GET_ORDER_BY_CODE,
  ADD_ITEM_TO_ORDER,
  ADJUST_ORDER_LINE,
  REMOVE_ORDER_LINE,
  SET_CUSTOMER_FOR_ORDER,
  SET_ORDER_SHIPPING_ADDRESS,
  SET_ORDER_BILLING_ADDRESS,
  GET_ELIGIBLE_SHIPPING_METHODS,
  SET_ORDER_SHIPPING_METHOD,
  GET_AVAILABLE_COUNTRIES,
  GET_ELIGIBLE_PAYMENT_METHODS,
  ADD_PAYMENT_TO_ORDER,
  TRANSITION_ORDER_TO_STATE,
  LOGIN,
  AUTHENTICATE,
  LOGOUT,
  ACTIVE_CUSTOMER,
  REGISTER_CUSTOMER,
  REQUEST_PASSWORD_RESET,
  GET_FEATURED_PRODUCTS
} from './queries';
import {
  SearchResult,
  SearchInput,
  Product,
  Collection,
  Order,
  ErrorResult,
  CreateCustomerInput,
  CreateAddressInput,
  ShippingMethod,
  PaymentMethod,
  PaymentInput,
  Country,
  CurrentUser,
  Customer,
  AuthenticationInput,
  RegisterCustomerInput
} from './types';

export async function searchProducts(input: SearchInput): Promise<SearchResult> {
  const data = await graphqlClient.request<{ search: SearchResult }>(SEARCH_PRODUCTS, { input });
  return data.search;
}

export async function getCollections(options?: {
  skip?: number;
  take?: number;
  topLevelOnly?: boolean;
}): Promise<{ items: Collection[]; totalItems: number }> {
  const data = await graphqlClient.request<{
    collections: { items: Collection[]; totalItems: number };
  }>(GET_COLLECTIONS, { options });
  return data.collections;
}

export async function getProduct(slugOrId: string, isId = false): Promise<Product | null> {
  const variables = isId ? { id: slugOrId } : { slug: slugOrId };
  const data = await graphqlClient.request<{ product: Product | null }>(GET_PRODUCT, variables);
  return data.product;
}

export async function getActiveChannel() {
  const data = await graphqlClient.request<{
    activeChannel: {
      id: string;
      code: string;
      currencyCode: string;
      defaultLanguageCode: string;
    };
  }>(GET_ACTIVE_CHANNEL);
  return data.activeChannel;
}

export function formatPrice(price: number, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(price / 100);
}

export type ImagePreset = 'tiny' | 'thumb' | 'small' | 'medium' | 'large' | 'detail';

export function getProductImageUrl(preview?: string, preset?: ImagePreset): string {
  if (!preview) {
    // Use a local placeholder image or one of the existing product images
    return '/images/homescreen/File 1.webp';
  }

  // ADDED: 2025-09-26 - Fallback for missing Unsplash images that cause 404 errors
  // Detects broken image URLs and provides elegant trophy placeholder instead
  if (preview.includes('unsplash') && preview.includes('__preview')) {
    console.warn(`[getProductImageUrl] Missing Unsplash image detected: ${preview}, using placeholder`);
    return '/images/homescreen/File 2.webp';
  }

  if (preview.startsWith('http')) {
    // If it's already a full URL, add preset parameter if needed
    if (preset && !preview.includes('preset=')) {
      const separator = preview.includes('?') ? '&' : '?';
      return `${preview}${separator}preset=${preset}`;
    }
    return preview;
  }

  const baseUrl = process.env.NEXT_PUBLIC_VENDURE_API_URL || 'http://localhost:3000';
  let imageUrl = `${baseUrl.replace('/shop-api', '')}${preview}`;

  // Add preset parameter for thumbnail generation
  if (preset) {
    const separator = imageUrl.includes('?') ? '&' : '?';
    imageUrl = `${imageUrl}${separator}preset=${preset}`;
  }

  return imageUrl;
}

// Cart API Functions
export async function getActiveOrder(): Promise<Order | null> {
  try {
    const data = await requestWithAuth<{ activeOrder: Order | null }>(GET_ACTIVE_ORDER);
    return data.activeOrder;
  } catch (error) {
    console.error('Error fetching active order:', error);
    // Don't swallow the error, let it bubble up if it's a network issue
    if (error instanceof Error && error.message.includes('fetch')) {
      throw error;
    }
    return null;
  }
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  try {
    const data = await graphqlClient.request<{ orderByCode: Order | null }>(GET_ORDER_BY_CODE, { code });
    return data.orderByCode;
  } catch (error) {
    console.error('Error fetching order by code:', error);
    return null;
  }
}

export async function addItemToOrder(
  productVariantId: string,
  quantity: number
): Promise<Order | ErrorResult> {
  try {
    const data = await requestWithAuth<{ addItemToOrder: Order | ErrorResult }>(
      ADD_ITEM_TO_ORDER,
      { productVariantId, quantity }
    );
    return data.addItemToOrder;
  } catch (error) {
    console.error('Error adding item to order:', error);
    throw error;
  }
}

export async function adjustOrderLine(
  orderLineId: string,
  quantity: number
): Promise<Order | ErrorResult> {
  try {
    const data = await requestWithAuth<{ adjustOrderLine: Order | ErrorResult }>(
      ADJUST_ORDER_LINE,
      { orderLineId, quantity }
    );
    return data.adjustOrderLine;
  } catch (error) {
    console.error('Error adjusting order line:', error);
    throw error;
  }
}

export async function removeOrderLine(orderLineId: string): Promise<Order | ErrorResult> {
  try {
    const data = await requestWithAuth<{ removeOrderLine: Order | ErrorResult }>(
      REMOVE_ORDER_LINE,
      { orderLineId }
    );
    return data.removeOrderLine;
  } catch (error) {
    console.error('Error removing order line:', error);
    throw error;
  }
}

export async function setCustomerForOrder(
  input: CreateCustomerInput
): Promise<Order | ErrorResult> {
  try {
    const data = await graphqlClient.request<{ setCustomerForOrder: Order | ErrorResult }>(
      SET_CUSTOMER_FOR_ORDER,
      { input }
    );
    return data.setCustomerForOrder;
  } catch (error) {
    console.error('Error setting customer for order:', error);
    throw error;
  }
}

export async function setOrderShippingAddress(
  input: CreateAddressInput
): Promise<Order | ErrorResult> {
  try {
    const data = await graphqlClient.request<{ setOrderShippingAddress: Order | ErrorResult }>(
      SET_ORDER_SHIPPING_ADDRESS,
      { input }
    );
    return data.setOrderShippingAddress;
  } catch (error) {
    console.error('Error setting shipping address:', error);
    throw error;
  }
}

export async function getEligibleShippingMethods(): Promise<ShippingMethod[]> {
  try {
    const data = await graphqlClient.request<{ eligibleShippingMethods: ShippingMethod[] }>(
      GET_ELIGIBLE_SHIPPING_METHODS
    );
    return data.eligibleShippingMethods;
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    return [];
  }
}

export async function setOrderShippingMethod(
  shippingMethodId: string
): Promise<Order | ErrorResult> {
  try {
    const data = await graphqlClient.request<{ setOrderShippingMethod: Order | ErrorResult }>(
      SET_ORDER_SHIPPING_METHOD,
      { shippingMethodId: [shippingMethodId] }  // Convert single ID to array
    );
    return data.setOrderShippingMethod;
  } catch (error) {
    console.error('Error setting shipping method:', error);
    throw error;
  }
}

export async function setOrderBillingAddress(
  input: CreateAddressInput
): Promise<Order | ErrorResult> {
  try {
    const data = await graphqlClient.request<{ setOrderBillingAddress: Order | ErrorResult }>(
      SET_ORDER_BILLING_ADDRESS,
      { input }
    );
    return data.setOrderBillingAddress;
  } catch (error) {
    console.error('Error setting billing address:', error);
    throw error;
  }
}

export async function getAvailableCountries(): Promise<Country[]> {
  try {
    const data = await graphqlClient.request<{ availableCountries: Country[] }>(
      GET_AVAILABLE_COUNTRIES
    );
    return data.availableCountries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

export async function getEligiblePaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const data = await graphqlClient.request<{ eligiblePaymentMethods: PaymentMethod[] }>(
      GET_ELIGIBLE_PAYMENT_METHODS
    );
    return data.eligiblePaymentMethods;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
}

export async function addPaymentToOrder(
  input: PaymentInput
): Promise<Order | ErrorResult> {
  try {
    const data = await graphqlClient.request<{ addPaymentToOrder: Order | ErrorResult }>(
      ADD_PAYMENT_TO_ORDER,
      { input }
    );
    return data.addPaymentToOrder;
  } catch (error) {
    console.error('Error adding payment to order:', error);
    throw error;
  }
}

export async function transitionOrderToState(
  state: string
): Promise<Order | ErrorResult> {
  try {
    const data = await graphqlClient.request<{ transitionOrderToState: Order | ErrorResult }>(
      TRANSITION_ORDER_TO_STATE,
      { state }
    );
    return data.transitionOrderToState;
  } catch (error) {
    console.error('Error transitioning order state:', error);
    throw error;
  }
}

// Helper function to check if result is an error
export function isErrorResult(result: unknown): result is ErrorResult {
  return result !== null && typeof result === 'object' && 'errorCode' in result && 'message' in result;
}

// Authentication Functions
export async function login(
  email: string,
  password: string,
  rememberMe?: boolean
): Promise<CurrentUser | ErrorResult> {
  try {
    const data = await requestWithAuth<{ login: CurrentUser | ErrorResult }>(LOGIN, {
      email,
      password,
      rememberMe
    });
    return data.login;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

export async function authenticate(
  input: AuthenticationInput
): Promise<CurrentUser | ErrorResult> {
  try {
    const data = await graphqlClient.request<{ authenticate: CurrentUser | ErrorResult }>(
      AUTHENTICATE,
      { input }
    );
    return data.authenticate;
  } catch (error) {
    console.error('Error during authentication:', error);
    throw error;
  }
}

export async function logout(): Promise<boolean> {
  try {
    const data = await graphqlClient.request<{ logout: { success: boolean } }>(LOGOUT);
    return data.logout.success;
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
}

export async function getActiveCustomer(): Promise<Customer | null> {
  try {
    const data = await requestWithAuth<{ activeCustomer: Customer | null }>(ACTIVE_CUSTOMER);
    return data.activeCustomer;
  } catch (error) {
    console.error('Error fetching active customer:', error);
    return null;
  }
}

export async function registerCustomer(
  input: RegisterCustomerInput
): Promise<boolean | ErrorResult> {
  try {
    const data = await requestWithAuth<{ registerCustomerAccount: { success: boolean } | ErrorResult }>(
      REGISTER_CUSTOMER,
      { input }
    );
    if ('success' in data.registerCustomerAccount) {
      return data.registerCustomerAccount.success;
    }
    return data.registerCustomerAccount;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}

export async function requestPasswordReset(email: string): Promise<boolean | ErrorResult> {
  try {
    const data = await graphqlClient.request<{ requestPasswordReset: { success: boolean } | ErrorResult }>(
      REQUEST_PASSWORD_RESET,
      { email }
    );
    if ('success' in data.requestPasswordReset) {
      return data.requestPasswordReset.success;
    }
    return data.requestPasswordReset;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
}

// Get featured products for the "our favorites" section - these are gonna be fire 🔥
export async function getFeaturedProducts(limit = 3): Promise<SearchResult> {
  const input: SearchInput = {
    take: limit,
    skip: 0,
    term: '', // Get all products
    sort: {
      name: 'ASC' // Could be changed to createdAt DESC for newest first
    }
  };
  
  const data = await graphqlClient.request<{ search: SearchResult }>(GET_FEATURED_PRODUCTS, { input });
  return data.search;
}