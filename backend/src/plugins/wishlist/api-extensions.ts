import gql from 'graphql-tag';

export const shopApiExtensions = gql`
    type WishlistItem {
        id: ID!
        productVariant: ProductVariant!
        addedAt: DateTime!
        notes: String
    }

    type WishlistItemList {
        items: [WishlistItem!]!
        totalItems: Int!
    }

    extend type Query {
        wishlistItems: WishlistItemList!
        isInWishlist(productVariantId: ID!): Boolean!
        wishlistCount: Int!
    }

    extend type Mutation {
        addToWishlist(productVariantId: ID!, notes: String): WishlistItem!
        removeFromWishlist(productVariantId: ID!): Boolean!
        clearWishlist: Boolean!
    }
`;

export const adminApiExtensions = gql`
    type WishlistItem {
        id: ID!
        customer: Customer!
        productVariant: ProductVariant!
        addedAt: DateTime!
        notes: String
    }

    type WishlistItemList {
        items: [WishlistItem!]!
        totalItems: Int!
    }

    extend type Query {
        customerWishlistItems(customerId: ID!): WishlistItemList!
        customerWishlistCount(customerId: ID!): Int!
    }
`;