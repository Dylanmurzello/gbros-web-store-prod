# 🏆 Gbros Product Import Tool

The all-in-one script for importing your trophy products into Vendure!

## What It Does

This script combines everything into one smooth workflow:
1. ✅ Transforms JDS CSV → Vendure format
2. ✅ Downloads images from Cloudinary 
3. ✅ Uploads to DigitalOcean Spaces (with public ACL)
4. ✅ Imports products, variants, and assets into Vendure DB
5. ✅ Shows progress and validates everything

No more juggling multiple scripts! 🎪

## Quick Start

```bash
cd /root/Gbros-web-store/backend
node import-products.js
```

The script will guide you through everything with interactive prompts! 🧙‍♂️

## Features

### 🎯 Interactive Prompts
- Choose test mode (10 products) or full import (83k products)
- Customize file paths or use defaults
- Decide if you want to clear the database first
- Confirm before doing anything destructive

### 🎨 Beautiful Output
- Color-coded messages (green = success, red = error, etc.)
- Progress indicators
- Clear step-by-step workflow
- Error handling with helpful messages

### 🔒 Safety Features
- Validates files exist before processing
- Confirms before clearing database
- Warns about long-running operations
- Graceful error handling

## Modes

### Test Mode (Recommended First!)
- Imports **10 products** only
- Fast (< 1 minute)
- Perfect for testing your setup
- Default: `/root/JDS-test-sample.csv`

### Full Import Mode
- Imports **83,371 products** 
- Takes 30+ minutes ⏰
- Downloads/uploads 83k images
- Requires confirmation
- Default: `/root/JDS-Master-Data-2025-09-18.csv`

## What Gets Transformed

The script maps your JDS CSV columns to Vendure format:

| JDS Column | Vendure Field | Notes |
|------------|---------------|-------|
| ITEM | sku | Product SKU |
| SHORT DESCRIPTION | name | Product name |
| LONG DESCRIPTION | description | Full description |
| LESS THAN CASE PRICE | price | Converted to dollars |
| LARGE IMAGE | assets | Cloudinary URL |
| CLASS | facets (category) | Product category |
| KEYWORD | facets (keyword) | Searchable keywords |

### Price Handling
- Source: `41.8` (dollars)
- Output: `41.8` (dollars) 
- Database: `4180` (cents)
- Displayed: `$41.80`

**NOTE**: Vendure CSV expects DOLLARS! The importer converts to cents internally. 💰

### Image Handling
- Images stay on Cloudinary (original source)
- Vendure downloads during import
- Uploads to DigitalOcean Spaces with `public-read` ACL
- Generates optimized versions (thumb, small, medium, large, etc.)
- No local storage used (temp only) ✨

## Example Run

```bash
$ node import-products.js

============================================================
🏆 GBROS PRODUCT IMPORT WIZARD 🏆
============================================================

This tool will help you import products into Vendure.
It handles everything: CSV transformation, image uploads, DB import.

▶ Choose import mode:
  1) Test mode (10 products)
  2) Full import (83,371 products) - THIS WILL TAKE A WHILE! ⏰

Enter choice (1 or 2): 1

▶ Configure file paths:
Input CSV path (press enter for: /root/JDS-test-sample.csv): 
Output CSV path (press enter for: /root/vendure-products-test.csv): 

✅ Input: /root/JDS-test-sample.csv
✅ Output: /root/vendure-products-test.csv

============================================================
STEP 1: TRANSFORMING CSV
============================================================

ℹ️  Reading JDS CSV file...
✅ Found 10 products in JDS CSV
ℹ️  Transforming data to Vendure format...
✅ Transformed 10 products
ℹ️  Writing Vendure CSV file...
✅ Vendure CSV written to: /root/vendure-products-test.csv

Do you want to import these products into Vendure now? (yes/no): yes

============================================================
STEP 2: IMPORTING TO VENDURE
============================================================

⚠️  IMPORTANT: Should we clear the database before importing?
  - YES: Deletes all existing products (clean slate)
  - NO: Adds new products alongside existing ones

Clear database first? (yes/no): yes

⚠️  Clearing database...
✅ Database cleared!

ℹ️  Starting Vendure import (this may take a while)...
ℹ️  Downloading images from Cloudinary...
ℹ️  Uploading to DigitalOcean Spaces...
ℹ️  Importing product data...

[Vendure import logs...]

✅ Import completed successfully!

============================================================
🎉 IMPORT COMPLETE! 🎉
============================================================

Successfully imported 10 products!

Images are in DigitalOcean Spaces at: gbros-image.nyc3.digitaloceanspaces.com
Database has been updated with all product data
```

## Configuration

Edit these defaults in the script if needed:

```javascript
const config = {
    inputCsv: '/root/JDS-Master-Data-2025-09-18.csv',      // Full import
    testInputCsv: '/root/JDS-test-sample.csv',              // Test mode
    outputCsv: '/root/vendure-products.csv',                // Full output
    testOutputCsv: '/root/vendure-products-test.csv',       // Test output
};
```

## Troubleshooting

### "Port 3000 already in use"
Stop services first:
```bash
cd /root/Gbros-web-store
./stop-all-services.sh
```

### "Cannot find input file"
Make sure your CSV file exists:
```bash
ls -lh /root/JDS-Master-Data-2025-09-18.csv
```

### "Database connection failed"
Check if PostgreSQL is accessible:
```bash
PGPASSWORD='4n_jYms9b2gRwzIh8k2llA' psql -h 10.116.0.3 -p 5432 -U vendure -d vendure -c "SELECT 1;"
```

### Images are 403 Forbidden
The script now uploads with `ACL: 'public-read'` automatically. Old images may still be private.

## What About the Old Scripts?

The old scripts still work if you need them:
- `transform-jds-to-vendure.js` - Just transform CSV
- `populate-products.ts` - Just import an existing CSV

But this new script is easier and does everything! 🚀

## Pro Tips

1. **Always test first!** Run test mode before full import
2. **Backup your DB** before full import (we create backups automatically but better safe than sorry)
3. **Check a few products** in the admin UI after test import
4. **Monitor disk space** on DigitalOcean Spaces (though 83k images should be fine)
5. **Be patient** with full import - 83k products takes time!

## Made with 💀 and ☕

Because manually importing 83k products is for chumps! Let the robots do it! 🤖






