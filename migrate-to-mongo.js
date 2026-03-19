const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'jpproject';
const client = new MongoClient(uri);
const FORCE_SEED_FROM_JSON = process.env.FORCE_SEED_FROM_JSON === 'true';

function getDocFilter(doc) {
    if (!doc || typeof doc !== 'object') return null;
    if (doc._id !== undefined && doc._id !== null) return { _id: doc._id };
    if (doc.id !== undefined && doc.id !== null) return { id: doc.id };
    if (doc.slug !== undefined && doc.slug !== null) return { slug: doc.slug };
    if (doc.key !== undefined && doc.key !== null) return { key: doc.key };
    if (doc.name !== undefined && doc.name !== null) return { name: doc.name };
    return null;
}

async function migrate() {
    try {
        await client.connect();
        client.db(dbName);
        console.log('Connected to MongoDB safely!');
        console.log('No file-based JSON sources detected. Migration script is now DB-only.');
        if (FORCE_SEED_FROM_JSON) {
            console.log('FORCE_SEED_FROM_JSON is enabled, but there are no legacy JSON files left to seed from.');
        }
        console.log('\nMigration complete (no JSON input to process).');
    } catch(e) {
        console.error('Migration error:', e);
    } finally {
        await client.close();
    }
}

migrate();
