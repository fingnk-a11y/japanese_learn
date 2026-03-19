const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB || 'jpproject';

function readThemeFile(filePath) {
    const absolutePath = path.resolve(filePath);
    const raw = fs.readFileSync(absolutePath, 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Theme JSON must be an object.');
    }

    if (typeof parsed.id !== 'string' || !parsed.id.trim()) {
        throw new Error('Theme must include a non-empty string id.');
    }
    if (typeof parsed.name !== 'string' || !parsed.name.trim()) {
        throw new Error('Theme must include a non-empty string name.');
    }

    return {
        id: parsed.id.trim(),
        name: parsed.name.trim(),
        premium: Boolean(parsed.premium),
        colors: (parsed.colors && typeof parsed.colors === 'object' && !Array.isArray(parsed.colors)) ? parsed.colors : {},
        css: (parsed.css && typeof parsed.css === 'object' && !Array.isArray(parsed.css)) ? parsed.css : {},
        assets: (parsed.assets && typeof parsed.assets === 'object' && !Array.isArray(parsed.assets)) ? parsed.assets : {}
    };
}

async function upsertTheme(theme) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const stylesCollection = db.collection('styles');

        const stylesDoc = await stylesCollection.findOne({});
        if (!stylesDoc) {
            await stylesCollection.insertOne({ styles: [theme] });
            console.log(`Created styles document and inserted theme: ${theme.id}`);
            return;
        }

        const styles = Array.isArray(stylesDoc.styles) ? stylesDoc.styles : [];
        const existingIndex = styles.findIndex(s => s && s.id === theme.id);

        if (existingIndex >= 0) {
            await stylesCollection.updateOne(
                { _id: stylesDoc._id },
                { $set: { [`styles.${existingIndex}`]: theme } }
            );
            console.log(`Updated theme: ${theme.id}`);
            return;
        }

        await stylesCollection.updateOne(
            { _id: stylesDoc._id },
            { $push: { styles: theme } }
        );
        console.log(`Inserted theme: ${theme.id}`);
    } finally {
        await client.close();
    }
}

function printUsage() {
    console.log('Usage: node manage-theme.js <path-to-theme-json>');
    console.log('Example: node manage-theme.js ./themes/info-premium.json');
}

async function main() {
    const inputPath = process.argv[2];
    if (!inputPath) {
        printUsage();
        process.exit(1);
    }

    try {
        const theme = readThemeFile(inputPath);
        await upsertTheme(theme);
    } catch (error) {
        console.error('Theme upsert failed:', error.message);
        process.exit(1);
    }
}

main();
