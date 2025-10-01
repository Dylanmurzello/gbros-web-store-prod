// 🛠️ WISHLIST SERVICE - Business logic for wishlist operations
// Created: 2025-09-26 - Handles CRUD operations for customer wishlists
// Operations: Add/remove items, fetch by customer, manage wishlist state
// The brain behind the "I'll buy it later" functionality (spoiler: they won't) 😂

import { Injectable } from '@nestjs/common';
import {
    RequestContext,
    TransactionalConnection,
    ID,
    ProductVariant,
    Customer,
    ListQueryBuilder,
    PaginatedList,
    ListQueryOptions,
} from '@vendure/core';
import { WishlistItem } from './wishlist.entity';

@Injectable()
export class WishlistService {
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
    ) {}

    async getWishlistItems(
        ctx: RequestContext,
        customerId: ID,
        options?: ListQueryOptions<WishlistItem>
    ): Promise<PaginatedList<WishlistItem>> {
        return this.listQueryBuilder
            .build(WishlistItem, options, { ctx })
            .andWhere('wishlistitem.customerId = :customerId', { customerId })
            .getManyAndCount()
            .then(([items, totalItems]) => ({
                items,
                totalItems,
            }));
    }

    async addToWishlist(
        ctx: RequestContext,
        customerId: ID,
        productVariantId: ID,
        notes?: string
    ): Promise<WishlistItem> {
        const existing = await this.connection
            .getRepository(ctx, WishlistItem)
            .findOne({
                where: {
                    customer: { id: customerId },
                    productVariant: { id: productVariantId },
                },
            });

        if (existing) {
            // Update notes if item already exists
            if (notes !== undefined) {
                existing.notes = notes;
                return this.connection.getRepository(ctx, WishlistItem).save(existing);
            }
            return existing;
        }

        const wishlistItem = new WishlistItem({
            customer: { id: customerId } as Customer,
            productVariant: { id: productVariantId } as ProductVariant,
            notes,
        });

        return this.connection.getRepository(ctx, WishlistItem).save(wishlistItem);
    }

    async removeFromWishlist(
        ctx: RequestContext,
        customerId: ID,
        productVariantId: ID
    ): Promise<boolean> {
        const result = await this.connection
            .getRepository(ctx, WishlistItem)
            .delete({
                customer: { id: customerId },
                productVariant: { id: productVariantId },
            });

        return !!result.affected && result.affected > 0;
    }

    async clearWishlist(ctx: RequestContext, customerId: ID): Promise<boolean> {
        const result = await this.connection
            .getRepository(ctx, WishlistItem)
            .delete({
                customer: { id: customerId },
            });

        return !!result.affected && result.affected > 0;
    }

    async isInWishlist(
        ctx: RequestContext,
        customerId: ID,
        productVariantId: ID
    ): Promise<boolean> {
        const count = await this.connection
            .getRepository(ctx, WishlistItem)
            .count({
                where: {
                    customer: { id: customerId },
                    productVariant: { id: productVariantId },
                },
            });

        return count > 0;
    }

    async getWishlistCount(ctx: RequestContext, customerId: ID): Promise<number> {
        return this.connection
            .getRepository(ctx, WishlistItem)
            .count({
                where: {
                    customer: { id: customerId },
                },
            });
    }
}