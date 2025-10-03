export const SEARCH_PRODUCTS = `
  query SearchProducts($input: SearchInput!) {
    search(input: $input) {
      totalItems
      items {
        productId
        productName
        slug
        description
        productAsset {
          id
          preview
        }
        priceWithTax {
          ... on SinglePrice {
            value
          }
          ... on PriceRange {
            min
            max
          }
        }
        currencyCode
      facetValueIds
      collectionIds
    }
    # DISABLED 2025-10-02: This facetValues block was causing 25 second load times with 9000+ facets
    # Only enable this when you're ready to implement filters and load it separately/lazily
    # See: https://github.com/vendure-ecommerce/vendure/issues/1257
    # facetValues {
    #   count
    #   facetValue {
    #     id
    #     code
    #     name
    #     facet {
    #       id
    #       code
    #       name
    #     }
    #   }
    # }
  }
}
`;

export const GET_COLLECTIONS = `
  query GetCollections($options: CollectionListOptions) {
    collections(options: $options) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
          source
        }
        parent {
          id
          name
          slug
        }
      }
      totalItems
    }
  }
`;

export const GET_PRODUCT = `
  query GetProduct($slug: String, $id: ID) {
    product(slug: $slug, id: $id) {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
        source
      }
      assets {
        id
        preview
        source
      }
      variants {
        id
        name
        sku
        price
        priceWithTax
        currencyCode
        featuredAsset {
          id
          preview
          source
        }
        stockLevel
        options {
          id
          code
          name
          group {
            id
            code
            name
          }
        }
      }
      facetValues {
        id
        code
        name
        facet {
          id
          code
          name
        }
      }
      collections {
        id
        name
        slug
        breadcrumbs {
          id
          name
          slug
        }
      }
    }
  }
`;

export const GET_AVAILABLE_COUNTRIES = `
  query GetAvailableCountries {
    availableCountries {
      id
      code
      name
    }
  }
`;

export const GET_ACTIVE_CHANNEL = `
  query GetActiveChannel {
    activeChannel {
      id
      code
      currencyCode
      defaultLanguageCode
    }
  }
`;

export const GET_ACTIVE_ORDER = `
  query GetActiveOrder {
    activeOrder {
      id
      code
      state
      active
      subTotalWithTax
      shippingWithTax
      totalWithTax
      totalQuantity
      currencyCode
      lines {
        id
        unitPriceWithTax
        linePriceWithTax
        quantity
        featuredAsset {
          id
          preview
        }
        productVariant {
          id
          name
          sku
          price
          priceWithTax
          product {
            id
            slug
            name
          }
        }
      }
      shippingLines {
        shippingMethod {
          id
          name
          description
        }
        priceWithTax
      }
      customer {
        id
        firstName
        lastName
        emailAddress
        phoneNumber
      }
      shippingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
        phoneNumber
      }
      billingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
      }
      payments {
        id
        createdAt
        state
        amount
        method
        metadata
      }
    }
  }
`;

export const GET_ORDER_BY_CODE = `
  query GetOrderByCode($code: String!) {
    orderByCode(code: $code) {
      id
      code
      state
      createdAt
      updatedAt
      subTotalWithTax
      shippingWithTax
      totalWithTax
      totalQuantity
      currencyCode
      lines {
        id
        unitPriceWithTax
        linePriceWithTax
        quantity
        featuredAsset {
          id
          preview
        }
        productVariant {
          id
          name
          sku
          price
          priceWithTax
          product {
            id
            slug
            name
            description
          }
        }
      }
      shippingLines {
        shippingMethod {
          id
          name
          description
        }
        priceWithTax
      }
      customer {
        id
        firstName
        lastName
        emailAddress
        phoneNumber
      }
      shippingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
        phoneNumber
      }
      billingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
      }
      payments {
        id
        createdAt
        state
        amount
        method
        metadata
      }
    }
  }
`;

export const ADD_ITEM_TO_ORDER = `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
        id
        code
        state
        active
        subTotalWithTax
        shippingWithTax
        totalWithTax
        totalQuantity
        currencyCode
        lines {
          id
          unitPriceWithTax
          linePriceWithTax
          quantity
          featuredAsset {
            id
            preview
          }
          productVariant {
            id
            name
            sku
            price
            priceWithTax
            product {
              id
              slug
              name
            }
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on InsufficientStockError {
        errorCode
        message
        quantityAvailable
      }
      ... on NegativeQuantityError {
        errorCode
        message
      }
      ... on OrderModificationError {
        errorCode
        message
      }
      ... on OrderLimitError {
        errorCode
        message
        maxItems
      }
    }
  }
`;

export const ADJUST_ORDER_LINE = `
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ... on Order {
        id
        code
        state
        active
        subTotalWithTax
        shippingWithTax
        totalWithTax
        totalQuantity
        currencyCode
        lines {
          id
          unitPriceWithTax
          linePriceWithTax
          quantity
          featuredAsset {
            id
            preview
          }
          productVariant {
            id
            name
            sku
            price
            priceWithTax
            product {
              id
              slug
              name
            }
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on InsufficientStockError {
        errorCode
        message
        quantityAvailable
      }
      ... on NegativeQuantityError {
        errorCode
        message
      }
      ... on OrderModificationError {
        errorCode
        message
      }
      ... on OrderLimitError {
        errorCode
        message
        maxItems
      }
    }
  }
`;

export const REMOVE_ORDER_LINE = `
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
        id
        code
        state
        active
        subTotalWithTax
        shippingWithTax
        totalWithTax
        totalQuantity
        currencyCode
        lines {
          id
          unitPriceWithTax
          linePriceWithTax
          quantity
          featuredAsset {
            id
            preview
          }
          productVariant {
            id
            name
            sku
            price
            priceWithTax
            product {
              id
              slug
              name
            }
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on OrderModificationError {
        errorCode
        message
      }
    }
  }
`;

export const SET_CUSTOMER_FOR_ORDER = `
  mutation SetCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      ... on Order {
        id
        customer {
          id
          firstName
          lastName
          emailAddress
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on EmailAddressConflictError {
        errorCode
        message
      }
    }
  }
`;

export const SET_ORDER_SHIPPING_ADDRESS = `
  mutation SetOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ... on Order {
        id
        shippingAddress {
          fullName
          company
          streetLine1
          streetLine2
          city
          province
          postalCode
          country
          phoneNumber
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GET_ELIGIBLE_SHIPPING_METHODS = `
  query GetEligibleShippingMethods {
    eligibleShippingMethods {
      id
      name
      description
      price
      priceWithTax
    }
  }
`;

export const SET_ORDER_SHIPPING_METHOD = `
  mutation SetOrderShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      ... on Order {
        id
        shippingWithTax
        shippingLines {
          shippingMethod {
            id
            name
          }
          priceWithTax
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on IneligibleShippingMethodError {
        errorCode
        message
      }
    }
  }
`;

export const SET_ORDER_BILLING_ADDRESS = `
  mutation SetOrderBillingAddress($input: CreateAddressInput!) {
    setOrderBillingAddress(input: $input) {
      ... on Order {
        id
        billingAddress {
          fullName
          company
          streetLine1
          streetLine2
          city
          province
          postalCode
          country
          phoneNumber
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GET_ELIGIBLE_PAYMENT_METHODS = `
  query GetEligiblePaymentMethods {
    eligiblePaymentMethods {
      id
      code
      name
      description
      isEligible
      eligibilityMessage
    }
  }
`;

export const ADD_PAYMENT_TO_ORDER = `
  mutation AddPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      ... on Order {
        id
        code
        state
        active
        subTotalWithTax
        shippingWithTax
        totalWithTax
        currencyCode
        payments {
          id
          transactionId
          amount
          method
          state
          metadata
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on PaymentFailedError {
        errorCode
        message
        paymentErrorMessage
      }
      ... on PaymentDeclinedError {
        errorCode
        message
        paymentErrorMessage
      }
      ... on OrderStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
      ... on IneligiblePaymentMethodError {
        errorCode
        message
        eligibilityCheckerMessage
      }
    }
  }
`;

export const TRANSITION_ORDER_TO_STATE = `
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      ... on Order {
        id
        code
        state
        active
        orderPlacedAt
        subTotalWithTax
        shippingWithTax
        totalWithTax
        currencyCode
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on OrderStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
`;

export const LOGIN = `
  mutation Login($email: String!, $password: String!, $rememberMe: Boolean) {
    login(username: $email, password: $password, rememberMe: $rememberMe) {
      ... on CurrentUser {
        id
        identifier
        channels {
          id
          code
          token
          permissions
        }
      }
      ... on InvalidCredentialsError {
        errorCode
        message
        authenticationError
      }
      ... on NotVerifiedError {
        errorCode
        message
      }
      ... on NativeAuthStrategyError {
        errorCode
        message
      }
    }
  }
`;

export const AUTHENTICATE = `
  mutation Authenticate($input: AuthenticationInput!) {
    authenticate(input: $input) {
      ... on CurrentUser {
        id
        identifier
        channels {
          id
          code
          token
          permissions
        }
      }
      ... on InvalidCredentialsError {
        errorCode
        message
        authenticationError
      }
      ... on NotVerifiedError {
        errorCode
        message
      }
    }
  }
`;

export const LOGOUT = `
  mutation Logout {
    logout {
      success
    }
  }
`;

export const ACTIVE_CUSTOMER = `
  query ActiveCustomer {
    activeCustomer {
      id
      title
      firstName
      lastName
      emailAddress
      phoneNumber
      customFields
    }
  }
`;

export const REGISTER_CUSTOMER = `
  mutation RegisterCustomer($input: RegisterCustomerInput!) {
    registerCustomerAccount(input: $input) {
      ... on Success {
        success
      }
      ... on MissingPasswordError {
        errorCode
        message
      }
      ... on PasswordValidationError {
        errorCode
        message
        validationErrorMessage
      }
      ... on NativeAuthStrategyError {
        errorCode
        message
      }
    }
  }
`;

export const REQUEST_PASSWORD_RESET = `
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(emailAddress: $email) {
      ... on Success {
        success
      }
      ... on NativeAuthStrategyError {
        errorCode
        message
      }
    }
  }
`;

// Featured products query - for that "our favorites" section that hits different
export const GET_FEATURED_PRODUCTS = `
  query GetFeaturedProducts($input: SearchInput!) {
    search(input: $input) {
      totalItems
      items {
        productId
        productName
        slug
        description
        productAsset {
          id
          preview
        }
        priceWithTax {
          ... on SinglePrice {
            value
          }
          ... on PriceRange {
            min
            max
          }
        }
        currencyCode
      }
    }
  }
`;