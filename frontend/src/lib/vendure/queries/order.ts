import { gql } from 'graphql-request';

export const GET_CUSTOMER_ORDERS = gql`
  query GetCustomerOrders {
    activeCustomer {
      orders {
        items {
          id
          code
          state
          total
          totalWithTax
          createdAt
          updatedAt
          lines {
            id
            quantity
            unitPrice
            unitPriceWithTax
            linePrice
            linePriceWithTax
            productVariant {
              id
              name
              sku
              price
              priceWithTax
              product {
                id
                name
                slug
                description
                featuredAsset {
                  id
                  preview
                  source
                }
              }
              featuredAsset {
                id
                preview
                source
              }
              options {
                id
                name
                group {
                  id
                  name
                }
              }
            }
          }
          shippingAddress {
            fullName
            streetLine1
            streetLine2
            city
            province
            postalCode
            country
          }
        }
        totalItems
      }
    }
  }
`;

export const GET_ORDER_BY_CODE = gql`
  query GetOrderByCode($code: String!) {
    orderByCode(code: $code) {
      id
      code
      state
      total
      totalWithTax
      createdAt
      updatedAt
      lines {
        id
        quantity
        unitPrice
        unitPriceWithTax
        linePrice
        linePriceWithTax
        productVariant {
          id
          name
          sku
          price
          priceWithTax
          product {
            id
            name
            slug
            description
            featuredAsset {
              id
              preview
              source
            }
          }
          featuredAsset {
            id
            preview
            source
          }
          options {
            id
            name
            group {
              id
              name
            }
          }
        }
      }
      shippingAddress {
        fullName
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
      }
      payments {
        id
        method
        amount
        state
        transactionId
        createdAt
      }
    }
  }
`;