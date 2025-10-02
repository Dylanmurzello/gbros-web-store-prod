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
const productsCsvFile = '/root/vendure-products-test.csv';

// Minimal initial data - we don't want to wipe existing channels/settings
const initialData = {
    defaultLanguage: 'en' as const,
    defaultZone: 'US',
    taxRates: [
        { name: 'Standard Tax', percentage: 0 },
    ],
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

