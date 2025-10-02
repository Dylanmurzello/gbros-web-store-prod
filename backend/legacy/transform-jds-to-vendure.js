#!/usr/bin/env node
/**
 * JDS CSV → Vendure CSV Transformer
 * 
 * Takes your 83k row JDS product CSV and transforms it into Vendure's import format
 * Handles: SKU, name, description, price (× 100), images, and keywords → facets
 * 
 * ngl this script is gonna save you HOURS of manual data entry 💀
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// yo configure these paths as needed fam
const INPUT_CSV = '/root/JDS-test-sample.csv';
const OUTPUT_CSV = '/root/vendure-products-test.csv';

console.log('🚀 Starting JDS → Vendure CSV transformation...\n');

// Read and parse the JDS CSV - this bad boy's got 83k rows 💀
console.log('📖 Reading JDS CSV file...');
const jdsData = fs.readFileSync(INPUT_CSV, 'utf-8');
const jdsRows = parse(jdsData, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true
});

console.log(`✅ Found ${jdsRows.length} products in JDS CSV\n`);

// Transform each row to Vendure format
console.log('⚙️  Transforming data...');
const vendureRows = jdsRows.map((row, index) => {
    // Create slug from SHORT DESCRIPTION (URL-friendly version)
    const slug = createSlug(row['SHORT DESCRIPTION'] || row['DESCRIPTION 1']);
    
    // Parse keywords into facets format: keyword:value|keyword:value
    const facets = parseKeywordsToFacets(row['KEYWORD'], row['CLASS']);
    
    // Parse price (Vendure CSV expects dollars, not cents!)
    const price = parsePrice(row['LESS THAN CASE PRICE']);
    
    // Build the Vendure CSV row
    return {
        name: row['SHORT DESCRIPTION'] || row['DESCRIPTION 1'] || 'Unnamed Product',
        slug: slug,
        description: row['LONG DESCRIPTION'] || row['SHORT DESCRIPTION'] || '',
        assets: row['LARGE IMAGE'] || '', // Already a URL, ez clap 🎯
        facets: facets,
        optionGroups: '', // No variants for now, keeping it simple
        optionValues: '',
        sku: row['ITEM'] || `SKU-${index}`,
        price: price,
        taxCategory: 'standard', // Default tax category
        stockOnHand: 100, // Default stock level
        trackInventory: 'true',
        variantAssets: '',
        variantFacets: ''
    };
});

console.log(`✅ Transformed ${vendureRows.length} products\n`);

// Write to Vendure CSV format
console.log('💾 Writing Vendure CSV file...');
const vendureCsv = stringify(vendureRows, {
    header: true,
    quoted: true,
    quoted_empty: true
});

fs.writeFileSync(OUTPUT_CSV, vendureCsv, 'utf-8');

console.log(`✅ Vendure CSV written to: ${OUTPUT_CSV}`);
console.log(`\n🎉 Transformation complete! You can now import this into Vendure.\n`);

// Show a preview of the first row
console.log('📋 Preview of first product:');
console.log(JSON.stringify(vendureRows[0], null, 2));

/**
 * Creates a URL-friendly slug from a product name
 * Example: "8" x 10" Stained Glass Plaque" → "8-x-10-stained-glass-plaque"
 */
function createSlug(name) {
    if (!name) return 'product';
    
    return name
        .toLowerCase()
        .replace(/['"]/g, '') // Remove quotes
        .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Converts keywords and CLASS into Vendure facets format
 * Input: "stain glass acrylic, plaque, acrylic plaque" + CLASS: "ACART"
 * Output: "category:ACART|keyword:stain glass acrylic|keyword:plaque|keyword:acrylic plaque"
 */
function parseKeywordsToFacets(keywordString, classValue) {
    const facets = [];
    
    // Add CLASS as a category facet (ACART, ACBDA, etc.)
    if (classValue && classValue.trim()) {
        facets.push(`category:${classValue.trim()}`);
    }
    
    // Parse keywords - they're comma-separated in your CSV
    if (keywordString && keywordString.trim()) {
        const keywords = keywordString
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
        
        // Add each keyword as a facet
        keywords.forEach(keyword => {
            facets.push(`keyword:${keyword}`);
        });
    }
    
    return facets.join('|');
}

/**
 * Parses price to format Vendure CSV expects (DOLLARS)
 * FIX: 2025-10-02 - Vendure CSV importer expects DOLLARS not cents! 💀
 * The importer does the × 100 conversion internally
 * Example: 18.5 → 18.5 (NOT 1850), 19.95 → 19.95 (NOT 1995)
 */
function parsePrice(priceString) {
    if (!priceString || priceString === '' || priceString === '0') {
        return 0;
    }
    
    // Remove any non-numeric characters except decimal point
    const cleaned = priceString.toString().replace(/[^0-9.]/g, '');
    const priceFloat = parseFloat(cleaned);
    
    if (isNaN(priceFloat)) {
        console.warn(`⚠️  Invalid price: ${priceString}, defaulting to 0`);
        return 0;
    }
    
    // Return as-is! Vendure handles the cents conversion
    // Round to 2 decimals to avoid floating point weirdness
    return Math.round(priceFloat * 100) / 100;
}

