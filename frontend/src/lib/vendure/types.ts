export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  featuredAsset?: {
    id: string;
    preview: string;
    source: string;
  };
  variants: ProductVariant[];
  facetValues: FacetValue[];
  collections: Collection[];
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  priceWithTax: number;
  currencyCode: string;
  featuredAsset?: {
    id: string;
    preview: string;
    source: string;
  };
  stockLevel: string;
  options: Array<{
    id: string;
    code: string;
    name: string;
  }>;
}

export interface FacetValue {
  id: string;
  code: string;
  name: string;
  facet: {
    id: string;
    code: string;
    name: string;
  };
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  breadcrumbs: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  featuredAsset?: {
    id: string;
    preview: string;
    source: string;
  };
}

export interface SearchResult {
  items: Array<{
    productId: string;
    productName: string;
    slug: string;
    description: string;
    productAsset?: {
      id: string;
      preview: string;
    };
    priceWithTax: {
      min: number;
      max: number;
    } | number;
    currencyCode: string;
    facetValues: FacetValue[];
    collectionIds: string[];
  }>;
  totalItems: number;
}

export interface SearchInput {
  term?: string;
  facetValueIds?: string[];
  collectionId?: string;
  collectionSlug?: string;
  groupByProduct?: boolean;
  skip?: number;
  take?: number;
  sort?: {
    name?: 'ASC' | 'DESC';
    price?: 'ASC' | 'DESC';
  };
}

export interface OrderLine {
  id: string;
  unitPriceWithTax: number;
  linePriceWithTax: number;
  quantity: number;
  featuredAsset?: {
    id: string;
    preview: string;
  };
  productVariant: {
    id: string;
    name: string;
    sku: string;
    price: number;
    priceWithTax: number;
    product: {
      id: string;
      slug: string;
      name: string;
    };
  };
}

export interface Order {
  id: string;
  code: string;
  state: string;
  active: boolean;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  totalQuantity: number;
  currencyCode: string;
  orderPlacedAt?: string;
  lines: OrderLine[];
  shippingLines?: Array<{
    shippingMethod: {
      id: string;
      name: string;
      description?: string;
    };
    priceWithTax: number;
  }>;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
  };
  shippingAddress?: Address;
  billingAddress?: Address;
  payments?: Payment[];
}

export interface Address {
  fullName?: string;
  company?: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phoneNumber?: string;
  country?: {
    code: string;
    name: string;
  };
}

export interface Payment {
  id: string;
  transactionId?: string;
  amount: number;
  method: string;
  state: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  description?: string;
  isEligible: boolean;
  eligibilityMessage?: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
}

export interface PaymentInput {
  method: string;
  metadata: Record<string, unknown>;
}

export interface CurrentUser {
  id: string;
  identifier: string;
  channels: Array<{
    id: string;
    code: string;
    token: string;
    permissions: string[];
  }>;
}

export interface Customer {
  id: string;
  title?: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber?: string;
  customFields?: Record<string, unknown>;
}

export interface AuthenticationInput {
  google?: {
    token: string;
  };
  [key: string]: { token: string } | undefined;
}

export interface RegisterCustomerInput {
  title?: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  password?: string;
  phoneNumber?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceWithTax: number;
}

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber?: string;
}

export interface CreateAddressInput {
  fullName?: string;
  company?: string;
  streetLine1: string;
  streetLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryCode: string;
  phoneNumber?: string;
}

export type AddItemToOrderResult = Order | ErrorResult;
export type AdjustOrderLineResult = Order | ErrorResult;
export type RemoveOrderLineResult = Order | ErrorResult;
export type SetCustomerForOrderResult = Order | ErrorResult;
export type SetOrderShippingAddressResult = Order | ErrorResult;
export type SetOrderBillingAddressResult = Order | ErrorResult;
export type SetOrderShippingMethodResult = Order | ErrorResult;
export type AddPaymentToOrderResult = Order | ErrorResult;
export type TransitionOrderToStateResult = Order | ErrorResult;

export interface ErrorResult {
  errorCode: string;
  message: string;
  quantityAvailable?: number;
  maxItems?: number;
  paymentErrorMessage?: string;
  transitionError?: string;
  fromState?: string;
  toState?: string;
  eligibilityCheckerMessage?: string;
}