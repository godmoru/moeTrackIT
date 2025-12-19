#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

// Get all .js files in migrations directory
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already converted
    if (content.includes('module.exports')) {
        console.log(`✓ Skipping ${file} - already uses CommonJS`);
        return;
    }

    // Convert ES6 import to CommonJS require
    content = content.replace(
        /import\s+{\s*DataTypes\s*}\s+from\s+['"]sequelize['"]\s*;?/g,
        "const { DataTypes } = require('sequelize');"
    );

    // Convert export const up to module.exports = { up:
    content = content.replace(
        /export\s+const\s+up\s*=\s*async/,
        'module.exports = {\n  up: async'
    );

    // Convert export const down to down: (and fix the closing)
    content = content.replace(
        /};\s*export\s+const\s+down\s*=\s*async/,
        '},\n\n  down: async'
    );

    // Fix the final closing
    content = content.replace(/};(\s*)$/, '}\n};$1');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Converted ${file} to CommonJS`);
});

console.log('\n✅ All migration files converted!');
