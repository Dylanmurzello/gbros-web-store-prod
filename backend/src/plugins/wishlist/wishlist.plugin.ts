// 🔥 WISHLIST PLUGIN - Custom Vendure plugin for wishlist functionality
// Created: 2025-09-26 - Full-featured wishlist system for Gbros trophy store
// Features: Add/remove items, persist across sessions, GraphQL API integration
// This plugin extends Vendure with custom wishlist functionality that slaps harder than a wet trophy 💀

import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { WishlistItem } from './wishlist.entity';
import { WishlistService } from './wishlist.service';
import { WishlistShopResolver, WishlistAdminResolver } from './wishlist.resolver';
import { shopApiExtensions, adminApiExtensions } from './api-extensions';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [WishlistItem],
    providers: [WishlistService],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [WishlistShopResolver],
    },
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [WishlistAdminResolver],
    },
})
export class WishlistPlugin {}