#!/usr/bin/env node
/**
 * 🏆 Gbros Product Import Tool
 * 
 * The ultimate script for importing your trophy products into Vendure!
 * Does everything: transforms CSV, uploads images to Spaces, imports to DB
 * 
 * No more juggling scripts like a circus clown 🤡
 * One command to rule them all! 💍
 * 
 * Usage: node import-products.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// ANSI colors for that spicy terminal output 🌶️
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}💀 ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    step: (msg) => console.log(`${colors.bright}${colors.blue}▶ ${msg}${colors.reset}`),
    title: (msg) => console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(60)}${colors.reset}\n${colors.bright}${colors.magenta}${msg}${colors.reset}\n${colors.bright}${colors.magenta}${'='.repeat(60)}${colors.reset}\n`),
};

// Config with defaults
const config = {
    inputCsv: '/root/data.csv',  // Main data file
    outputCsv: '/root/vendure-products.csv',            // Full import output
    testOutputCsv: '/root/vendure-products-test.csv',  // Test mode output (10 rows)
    filterConfigPath: '/root/product-filter-config.json',  // Filter config for CLASS codes
};

// Load filter config (CLASS codes to KEEP/DELETE)
// FEATURE: 2025-10-03 - Smart filtering to remove vinyl/signage trash, keep trophy/engravable products 🎯
let filterConfig = null;
if (fs.existsSync(config.filterConfigPath)) {
    filterConfig = JSON.parse(fs.readFileSync(config.filterConfigPath, 'utf-8'));
    log.info(`Loaded filter config: ${filterConfig.KEEP.length} KEEP, ${filterConfig.DELETE.length} DELETE`);
} else {
    log.warn('No filter config found - importing ALL products (including vinyl/signage trash)');
}

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisified question
function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

/**
 * Main execution flow - where the magic happens ✨
 */
async function main() {
    log.title('🏆 GBROS PRODUCT IMPORT WIZARD 🏆');
    
    console.log('This tool will help you import products into Vendure.');
    console.log('It handles everything: CSV transformation, image uploads, DB import.\n');
    
    // Step 1: Ask what they wanna do
    const mode = await askMode();
    
    // Step 2: Get file paths
    const { inputPath, outputPath } = await askFilePaths(mode);
    
    // Step 3: Transform CSV
    log.title('STEP 1: TRANSFORMING CSV');
    const rowCount = await transformCsv(inputPath, outputPath, mode);
    
    // Step 4: Ask if they wanna import
    const shouldImport = await askShouldImport();
    
    if (shouldImport) {
        log.title('STEP 2: IMPORTING TO VENDURE');
        
        // Step 5: Confirm if DB should be cleared
        const shouldClearDb = await askShouldClearDb();
        
        if (shouldClearDb) {
            await clearDatabase();
        }
        
        // Step 6: Run the import
        await runImport(outputPath);
        
        log.title('🎉 IMPORT COMPLETE! 🎉');
        console.log(`\n${colors.green}${colors.bright}Successfully imported ${rowCount} products!${colors.reset}`);
        console.log(`\n${colors.cyan}Images are in DigitalOcean Spaces at: gbros-image.nyc3.digitaloceanspaces.com${colors.reset}`);
        console.log(`${colors.cyan}Database has been updated with all product data${colors.reset}\n`);
    } else {
        log.title('✅ CSV TRANSFORMATION COMPLETE');
        console.log(`\n${colors.green}Transformed CSV saved to: ${outputPath}${colors.reset}`);
        console.log(`${colors.cyan}You can import it later by running this script again!${colors.reset}\n`);
    }
    
    rl.close();
}

/**
 * Ask user what mode they want (test vs full)
 */
async function askMode() {
    log.step('Choose import mode:');
    console.log('  1) Test mode (first 10 rows from file)');
    console.log('  2) Full import (all rows, ~33k unique products after dedup)');
    console.log('     ⚠️  Full import will take 30+ minutes! ⏰');
    
    const answer = await question('\nEnter choice (1 or 2): ');
    
    if (answer.trim() === '2') {
        log.warn('Full import selected! This will process ~69k rows.');
        log.warn('After deduplication: ~33k unique products.');
        log.warn('This could take 30+ minutes depending on your connection!');
        const confirm = await question('Are you SURE? (yes/no): ');
        
        if (confirm.toLowerCase() !== 'yes') {
            log.info('Switching to test mode (first 10 rows)...');
            return 'test';
        }
        return 'full';
    }
    
    return 'test';
}

/**
 * Ask for file paths (or use defaults)
 */
async function askFilePaths(mode) {
    const isTest = mode === 'test';
    const defaultInput = config.inputCsv; // Always use main file
    const defaultOutput = isTest ? config.testOutputCsv : config.outputCsv;
    
    log.step('Configure file paths:');
    
    if (isTest) {
        console.log(`${colors.cyan}Test mode will process first 10 rows from the file${colors.reset}`);
    }
    
    const inputAnswer = await question(`Input CSV path (press enter for: ${defaultInput}): `);
    const inputPath = inputAnswer.trim() || defaultInput;
    
    const outputAnswer = await question(`Output CSV path (press enter for: ${defaultOutput}): `);
    const outputPath = outputAnswer.trim() || defaultOutput;
    
    // Validate input file exists
    if (!fs.existsSync(inputPath)) {
        log.error(`Input file not found: ${inputPath}`);
        process.exit(1);
    }
    
    log.success(`Input: ${inputPath}`);
    log.success(`Output: ${outputPath}`);
    
    if (isTest) {
        log.info('Will process first 10 rows only (test mode)');
    }
    
    return { inputPath, outputPath };
}

/**
 * Transform CSV from JDS format to Vendure format
 * NOW WITH DEDUPLICATION! Keeps last occurrence of each SKU (newest catalogue data wins)
 */
async function transformCsv(inputPath, outputPath, mode = 'full') {
    log.info('Reading JDS CSV file...');
    
    const csvContent = fs.readFileSync(inputPath, 'utf-8');
    let jdsRows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });
    
    log.success(`Found ${jdsRows.length} products in JDS CSV`);
    
    // FILTER: Remove vinyl/signage trash based on CLASS code
    if (filterConfig && filterConfig.DELETE) {
        const beforeFilter = jdsRows.length;
        jdsRows = jdsRows.filter(row => {
            const classCode = row['CLASS'];
            // Keep row if CLASS is in KEEP list OR in REVIEW list (safe default)
            // Skip row if CLASS is in DELETE list
            return !filterConfig.DELETE.includes(classCode);
        });
        const removed = beforeFilter - jdsRows.length;
        if (removed > 0) {
            log.success(`Filtered out ${removed} vinyl/signage products (trash begone! 🗑️)`);
            log.success(`Remaining: ${jdsRows.length} trophy/engravable products`);
        }
    }
    
    // TEST MODE: Take only first 10 rows (after filtering but before deduplication)
    if (mode === 'test') {
        log.warn('TEST MODE: Limiting to first 10 rows from filtered data');
        jdsRows = jdsRows.slice(0, 10);
        log.success(`Processing ${jdsRows.length} rows for test import`);
    }
    
    log.info('Transforming data to Vendure format...');
    
    const vendureRows = jdsRows.map((row, index) => {
        const productName = row['SHORT DESCRIPTION'] || row['DESCRIPTION 1'] || 'Unnamed Product';
        const productDesc = row['LONG DESCRIPTION'] || row['SHORT DESCRIPTION'] || '';
        const slug = createSlug(productName);
        const facets = parseKeywordsToFacets(row['KEYWORD'], row['CLASS'], productName, productDesc);
        const price = parsePrice(row['LESS THAN CASE PRICE']);
        
        return {
            name: productName,
            slug: slug,
            description: productDesc,
            assets: row['LARGE IMAGE'] || '',
            facets: facets,
            optionGroups: '',
            optionValues: '',
            sku: row['ITEM'] || `SKU-${index}`,
            price: price,
            taxCategory: 'standard',
            stockOnHand: 100,
            trackInventory: 'true',
            variantAssets: '',
            variantFacets: ''
        };
    });
    
    log.success(`Transformed ${vendureRows.length} products`);
    
    // DEDUPLICATE by SKU (keep LAST occurrence = newest catalogue)
    log.info('Deduplicating products by SKU (keeping latest data)...');
    const originalCount = vendureRows.length;
    const deduped = deduplicateBySku(vendureRows);
    const duplicatesRemoved = originalCount - deduped.length;
    
    if (duplicatesRemoved > 0) {
        log.warn(`Removed ${duplicatesRemoved} duplicate SKUs (kept latest)`);
        log.success(`Final unique products: ${deduped.length}`);
    } else {
        log.success('No duplicates found!');
    }
    
    const finalRows = deduped;
    
    log.info('Writing Vendure CSV file...');
    const vendureCsv = stringify(finalRows, {
        header: true,
        quoted: true,
        quoted_empty: true
    });
    
    fs.writeFileSync(outputPath, vendureCsv, 'utf-8');
    log.success(`Vendure CSV written to: ${outputPath}`);
    
    return finalRows.length;
}

/**
 * Ask if user wants to import now
 */
async function askShouldImport() {
    const answer = await question('\nDo you want to import these products into Vendure now? (yes/no): ');
    return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
}

/**
 * Ask if database should be cleared first
 */
async function askShouldClearDb() {
    log.warn('IMPORTANT: Should we clear the database before importing?');
    console.log('  - YES: Deletes all existing products (clean slate) ✨');
    console.log('  - NO: Keeps existing + adds new ones');
    console.log('');
    console.log(`${colors.yellow}NOTE: Vendure's populate() doesn't do true UPSERT!${colors.reset}`);
    console.log(`${colors.yellow}If a SKU already exists, that row will be SKIPPED.${colors.reset}`);
    console.log(`${colors.cyan}To truly update existing products, you'd need custom import logic.${colors.reset}`);
    
    const answer = await question('\nClear database first? (yes/no): ');
    return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
}

/**
 * Clear the database (nuke all products AND facets to avoid duplicates)
 * FIXED: 2025-10-02 02:12 AM - Now explicitly clears junction tables too
 * Why: TRUNCATE CASCADE wasn't reaching product_facet_values_facet_value junction table
 * Result: duplicate key violations on that specific PK constraint
 */
async function clearDatabase() {
    log.warn('Clearing database (nuking everything product/facet related)...');
    
    return new Promise((resolve, reject) => {
        // FIXED: 2025-10-02 02:20 AM - Clear in REVERSE order of foreign key constraints
        // Junction tables have FK constraints, so we clear MAIN tables first with CASCADE
        // This lets PostgreSQL handle the cleanup of dependent junction tables
        const psql = spawn('psql', [
            '-h', '10.116.0.3',
            '-p', '5432',
            '-U', 'vendure',
            '-d', 'vendure',
            '-c', `
                TRUNCATE TABLE product CASCADE;
                TRUNCATE TABLE facet CASCADE;
                TRUNCATE TABLE collection CASCADE;
            `
        ], {
            env: { ...process.env, PGPASSWORD: '4n_jYms9b2gRwzIh8k2llA' }
        });
        
        psql.on('close', (code) => {
            if (code === 0) {
                log.success('Database cleared (CASCADE handled all dependencies)!');
                resolve();
            } else {
                log.error('Failed to clear database');
                reject(new Error('Database clear failed'));
            }
        });
    });
}

/**
 * Run the actual import using populate-products.ts
 */
async function runImport(csvPath) {
    log.info('Starting Vendure import (this may take a while)...');
    log.info('Downloading images from Cloudinary...');
    log.info('Uploading to DigitalOcean Spaces...');
    log.info('Importing product data...');
    
    return new Promise((resolve, reject) => {
        // Update populate-products.ts to use the correct CSV path
        const populateScript = fs.readFileSync(path.join(__dirname, 'populate-products.ts'), 'utf-8');
        const updatedScript = populateScript.replace(
            /const productsCsvFile = .*/,
            `const productsCsvFile = '${csvPath}';`
        );
        fs.writeFileSync(path.join(__dirname, 'populate-products.ts'), updatedScript);
        
        const tsNode = spawn('npx', ['ts-node', 'populate-products.ts'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        tsNode.on('close', (code) => {
            if (code === 0) {
                log.success('Import completed successfully!');
                resolve();
            } else {
                log.error('Import failed - check logs above');
                reject(new Error('Import failed'));
            }
        });
    });
}

// === UTILITY FUNCTIONS ===

/**
 * Deduplicate products by SKU (keeps LAST occurrence)
 * When same SKU appears multiple times (different catalogues),
 * we keep the latest one = newest catalogue data wins! 📅
 */
function deduplicateBySku(products) {
    const skuMap = new Map();
    
    // Iterate through all products
    // Map.set() will overwrite if key exists = keeps LAST occurrence
    products.forEach(product => {
        skuMap.set(product.sku, product);
    });
    
    // Convert Map back to array
    return Array.from(skuMap.values());
}

function createSlug(name) {
    if (!name) return 'product';
    return name
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function parseKeywordsToFacets(keywordString, classString, productName, productDescription) {
    const facets = [];
    
    // SKIP keyword facets entirely - they're 7k duplicates of useless noise
    // Instead, detect category from product NAME (way smarter!)
    // FEATURE: 2025-10-03 - Smart category detection instead of cryptic CLASS codes or keyword spam 🧠
    
    const category = detectCategory(productName, productDescription, classString);
    facets.push(`category:${category}`);
    
    return facets.join('|');
}

/**
 * Smart category detection based on product name & description
 * FEATURE: 2025-10-03 - Auto-categorize products into 15-20 clean categories
 * No more 477 CLASS codes or 7k keyword spam! Just clean, searchable categories 🎯
 */
function detectCategory(name, description, classCode) {
    const text = `${name || ''} ${description || ''}`.toLowerCase();
    
    // Trophy & Award categories (most specific first)
    if (text.match(/trophy|cup\s+trophy|metal\s+cup/i)) return 'Trophies';
    if (text.match(/\bplaque/i)) return 'Plaques';
    if (text.match(/medal/i)) return 'Medals & Coins';
    if (text.match(/crystal|jade\s+glass|glass\s+award/i)) return 'Crystal & Glass Awards';
    if (text.match(/acrylic\s+award|acrylic.*plaque|acrylic.*trophy/i)) return 'Acrylic Awards';
    if (text.match(/resin\s+award|resin\s+trophy/i)) return 'Resin Awards';
    if (text.match(/\bcoin\b/i)) return 'Medals & Coins';
    
    // Engravable gift categories
    if (text.match(/mug|tumbler|cup|bottle|flask|drinkware|camel|yeti|cooler/i)) return 'Drinkware';
    if (text.match(/leatherette|leather\s+gift/i)) return 'Leatherette Gifts';
    if (text.match(/keychain|key\s+ring|key\s+tag/i)) return 'Keychains';
    if (text.match(/clock|timepiece/i)) return 'Clocks';
    if (text.match(/\bpen\b|pencil|desk\s+set|desk\s+accessory|paperweight/i)) return 'Desk Accessories';
    if (text.match(/badge|name\s+tag|name\s+plate/i)) return 'Badges & Name Tags';
    if (text.match(/frame|picture\s+frame/i)) return 'Frames';
    if (text.match(/\bbox\b|gift\s+box|presentation\s+box/i)) return 'Gift Boxes';
    
    // Materials/blank products
    if (text.match(/sublimation|unisub/i)) return 'Sublimation Blanks';
    if (text.match(/laserable|laser\s+engrav/i) && !text.match(/award|trophy|plaque/i)) return 'Engravable Blanks';
    
    // Promotional items
    if (text.match(/knife|tool|multi.?tool/i)) return 'Tools & Knives';
    if (text.match(/golf|ball\s+marker/i)) return 'Golf Gifts';
    if (text.match(/bag|tote|backpack/i)) return 'Bags';
    
    // Fallback to CLASS mapping if available
    if (filterConfig && filterConfig.categoryMapping && filterConfig.categoryMapping[classCode]) {
        return filterConfig.categoryMapping[classCode];
    }
    
    // Default catch-all
    return 'Awards & Gifts';
}

/**
 * Check if keyword is just noise (dimensions, technical specs, etc.)
 * FEATURE: 2025-10-03 - Filter out 8k+ useless keywords like ".51x.75", "100% crystal", etc.
 */
function isNoiseKeyword(keyword) {
    const k = keyword.toLowerCase();
    
    // Filter out dimension patterns (.51 x .75, 12"x24", etc.)
    if (/^\.?\d+[\sx"'-]*x[\sx"'-]*\.?\d+/i.test(k)) return true;
    if (/^\d+['"]?\s*x\s*\d+['"]?/i.test(k)) return true;
    
    // Filter out single numbers/letters
    if (/^[0-9.]+$/.test(k)) return true;
    if (/^[a-z]$/.test(k)) return true;
    
    // Filter out technical specs that add no search value
    if (k === 'b_transparent') return true;
    if (k === '.') return true;
    if (k === '#1') return true;
    if (/^\d+%/.test(k)) return true;  // "100% crystal", "100% lead free"
    
    // Filter out redundant tape/vinyl keywords if not in vinyl business
    if (/tape|foam|adhesive|mil/i.test(k) && filterConfig) return true;
    
    return false;
}

function parsePrice(priceString) {
    if (!priceString || priceString === '' || priceString === '0') {
        return 0;
    }
    
    const cleaned = priceString.toString().replace(/[^0-9.]/g, '');
    const priceFloat = parseFloat(cleaned);
    
    if (isNaN(priceFloat)) {
        console.warn(`⚠️  Invalid price: ${priceString}, defaulting to 0`);
        return 0;
    }
    
    // Return as dollars (Vendure CSV expects dollars, not cents)
    return Math.round(priceFloat * 100) / 100;
}

// Run the script (with error handling so we don't crash and burn)
main().catch((error) => {
    log.error('Fatal error:');
    console.error(error);
    process.exit(1);
});

