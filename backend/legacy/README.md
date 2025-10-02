# 📦 Legacy Import Scripts

These are the **OLD** scripts that have been replaced by the new unified `import-products.js` tool.

## ⚠️ Why Are These Here?

We keep them around for:
- **Backwards compatibility** - If you have existing workflows
- **Granular control** - If you only want to do one step
- **Debugging** - If the new script breaks, these still work
- **Reference** - For understanding how things work under the hood

## 🆕 New Recommended Way

**Use this instead:**
```bash
cd /root/Gbros-web-store/backend
node import-products.js
```

The new script does everything these do, but better! 🚀

---

## Legacy Scripts Documentation

### 1. `transform-jds-to-vendure.js`

**What it does:**
- Reads JDS CSV format
- Transforms to Vendure CSV format
- Saves output file
- Does NOT import to database

**When to use:**
- You only want to generate the CSV
- You want to manually review before importing
- You need custom transformation logic

**Usage:**
```bash
node legacy/transform-jds-to-vendure.js
```

**Hardcoded paths:**
- Input: `/root/JDS-test-sample.csv`
- Output: `/root/vendure-products-test.csv`

*(Edit the script to change paths)*

---

### 2. `populate-products.ts`

**What it does:**
- Reads an existing Vendure-format CSV
- Imports to database
- Downloads images and uploads to Spaces
- Does NOT transform from JDS format

**When to use:**
- You already have a transformed CSV
- You want to re-import the same CSV
- You're debugging the import process

**Usage:**
```bash
npx ts-node legacy/populate-products.ts
```

**Hardcoded paths:**
- Input: `/root/vendure-products-test.csv`

*(Edit the script to change path)*

**Prerequisites:**
- Services must be stopped (port 3000 must be free)
- CSV must already be in Vendure format

---

## 🔄 Migration Path

If you're using the old scripts in automation/scripts:

### Before:
```bash
# Old way - 2 steps
node transform-jds-to-vendure.js
npx ts-node populate-products.ts
```

### After:
```bash
# New way - 1 step (but interactive)
node import-products.js
```

### For Automation (Non-Interactive):
If you need automation, modify the new script or keep using these legacy ones!

---

## 🐛 Troubleshooting

### "Cannot find module"
Make sure you're in the right directory:
```bash
cd /root/Gbros-web-store/backend
```

### "Port 3000 already in use"
Stop services first:
```bash
cd /root/Gbros-web-store
./stop-all-services.sh
```

### "CSV file not found"
Check if the hardcoded paths exist, or edit the scripts.

---

## 💀 When Will These Be Deleted?

Probably never! They're small and useful for edge cases. But if you find yourself using them regularly, maybe the new script needs improvement? 

Let us know! (Or just edit `import-products.js` yourself - it's just JS!)

---

## 📝 Notes

- These scripts have been tested and work fine
- Price conversion was FIXED on 2025-10-02 (was multiplying by 100 twice)
- Images upload to DigitalOcean Spaces with public-read ACL (as of 2025-10-02)
- No local storage used (temp only)

**Bottom line:** These work, but the new script is better for 99% of use cases! 🎯

