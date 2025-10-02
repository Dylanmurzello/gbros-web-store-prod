/**
 * Simple Product Import Using Vendure's Built-In populate() Function
 * 
 * No fancy bullshit, just using what Vendure gives us 💯
 * Run: npx ts-node populate-products.ts
 */

import { bootstrap, DefaultJobQueuePlugin } from '@vendure/core';
import { populate } from '@vendure/core/cli';
import path from 'path';
import { config } from './src/vendure-config';

// Path to the test CSV
// FIXED: 2025-10-02 03:00 AM - Using deduplicated CSV (removed duplicate keywords causing FK errors)
const productsCsvFile = '/root/vendure-products.csv';

// Minimal initial data - we don't want to wipe existing channels/settings
// FIXED: 2025-10-02 02:55 AM - Added ALL required InitialData fields per Vendure docs
// Missing shippingMethods/paymentMethods/collections was causing "not iterable" errors
const initialData = {
    defaultLanguage: 'en' as const,
    defaultZone: 'US',
    countries: [
        { name: 'United States', code: 'US', zone: 'US' },
    ],
    taxRates: [
        { name: 'Standard Tax', percentage: 20 },
    ],
    shippingMethods: [
        { name: 'Standard Shipping', price: 0 },
    ],
    paymentMethods: [
        {
            name: 'Credit Card',
            handler: {
                code: 'square-payment',
                arguments: [],
            },
        },
    ],
    collections: [],
};

// Remove JobQueuePlugin to avoid spam during import
const populateConfig = {
    ...config,
    plugins: (config.plugins || []).filter(
        plugin => plugin !== DefaultJobQueuePlugin,
    ),
};

console.log('🚀 Importing products using Vendure populate()...');
console.log(`📁 CSV: ${productsCsvFile}\n`);

populate(
    () => bootstrap(populateConfig),
    initialData,
    productsCsvFile,
)
    .then(app => {
        console.log('\n✅ Import complete!');
        return app.close();
    })
    .then(
        () => {
            console.log('👋 Done!');
            process.exit(0);
        },
        err => {
            console.error('💀 Error:');
            console.error(err);
            process.exit(1);
        },
    );

