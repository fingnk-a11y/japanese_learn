const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection URI
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'jpproject';
let db;
let client;

// Enable CORS and serve static files
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

// Connect to MongoDB
async function connectDB() {
    try {
        client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB');
        db = client.db(dbName);
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

// API Routes

function sanitizeThemePayload(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

    const theme = {
        id: typeof input.id === 'string' ? input.id.trim() : '',
        name: typeof input.name === 'string' ? input.name.trim() : '',
        premium: Boolean(input.premium),
        colors: (input.colors && typeof input.colors === 'object' && !Array.isArray(input.colors)) ? input.colors : {},
        css: (input.css && typeof input.css === 'object' && !Array.isArray(input.css)) ? input.css : {},
        assets: (input.assets && typeof input.assets === 'object' && !Array.isArray(input.assets)) ? input.assets : {}
    };

    if (!theme.id || !theme.name) return null;
    return theme;
}

async function getStylesDocument() {
    if (!db) throw new Error('Database not connected');
    const stylesCollection = db.collection('styles');
    const stylesDoc = await stylesCollection.findOne({});
    if (stylesDoc && Array.isArray(stylesDoc.styles)) return stylesDoc;

    const createdDoc = { styles: [] };
    await stylesCollection.insertOne(createdDoc);
    return await stylesCollection.findOne({});
}

// Get all themes/styles
app.get('/api/styles', async (req, res) => {
    try {
        if (!db) throw new Error('Database not connected');
        const styles = await db.collection('styles').findOne({});
        if (styles && Array.isArray(styles.styles)) return res.json(styles);
        return res.status(404).json({ error: 'Styles data not found in MongoDB' });
    } catch (error) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Get a single theme by ID
app.get('/api/styles/:styleId', async (req, res) => {
    const styleId = String(req.params.styleId || '').trim();
    if (!styleId) return res.status(400).json({ error: 'styleId is required' });

    try {
        const styles = await getStylesDocument();
        const style = styles.styles.find(s => s && s.id === styleId);
        if (!style) return res.status(404).json({ error: `Theme ${styleId} not found` });
        return res.json(style);
    } catch (error) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Add a new theme
app.post('/api/styles', async (req, res) => {
    const newTheme = sanitizeThemePayload(req.body);
    if (!newTheme) {
        return res.status(400).json({ error: 'Invalid theme payload. Required: id, name, colors, css, assets' });
    }

    try {
        const stylesCollection = db.collection('styles');
        const stylesDoc = await getStylesDocument();
        const exists = stylesDoc.styles.some(s => s && s.id === newTheme.id);
        if (exists) {
            return res.status(409).json({ error: `Theme ${newTheme.id} already exists. Use PUT /api/styles/:styleId to update.` });
        }

        await stylesCollection.updateOne(
            { _id: stylesDoc._id },
            { $push: { styles: newTheme } }
        );

        return res.status(201).json({ message: 'Theme created', theme: newTheme });
    } catch (error) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Upsert (create or update) theme by ID
app.put('/api/styles/:styleId', async (req, res) => {
    const styleId = String(req.params.styleId || '').trim();
    if (!styleId) return res.status(400).json({ error: 'styleId is required' });

    const payload = sanitizeThemePayload({ ...req.body, id: styleId });
    if (!payload) {
        return res.status(400).json({ error: 'Invalid theme payload. Required: name, colors, css, assets' });
    }

    try {
        const stylesCollection = db.collection('styles');
        const stylesDoc = await getStylesDocument();
        const existingIndex = stylesDoc.styles.findIndex(s => s && s.id === styleId);

        if (existingIndex >= 0) {
            await stylesCollection.updateOne(
                { _id: stylesDoc._id },
                { $set: { [`styles.${existingIndex}`]: payload } }
            );
            return res.json({ message: 'Theme updated', theme: payload });
        }

        await stylesCollection.updateOne(
            { _id: stylesDoc._id },
            { $push: { styles: payload } }
        );
        return res.status(201).json({ message: 'Theme created', theme: payload });
    } catch (error) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Get language data
app.get('/api/lang', async (req, res) => {
    try {
        if (!db) throw new Error('Database not connected');
        const lang = await db.collection('lang').findOne({});
        if (lang && lang.en) return res.json(lang);
        return res.status(404).json({ error: 'Language data not found in MongoDB' });
    } catch (error) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Get grammar lessons
app.get('/api/grammar', async (req, res) => {
    try {
        if (!db) throw new Error('Database not connected');
        const grammar = await db.collection('grammar').find({}).toArray();
        if (Array.isArray(grammar) && grammar.length > 0) return res.json(grammar);
        return res.status(404).json({ error: 'Grammar data not found in MongoDB' });
    } catch (error) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Get vocabulary categories
app.get('/api/vocabulary', async (req, res) => {
    try {
        if (!db) throw new Error('Database not connected');
        const vocabulary = await db.collection('vocabulary').find({}).toArray();
        if (Array.isArray(vocabulary) && vocabulary.length > 0) return res.json(vocabulary);
        return res.status(404).json({ error: 'Vocabulary data not found in MongoDB' });
    } catch (error) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Get kanji data
app.get('/api/kanji', async (req, res) => {
    try {
        if (!db) throw new Error('Database not connected');
        const kanji = await db.collection('kanji').findOne({});
        if (kanji && (kanji.n5 || kanji.n4 || kanji.n3 || kanji.n2 || kanji.n1)) return res.json(kanji);
        return res.status(404).json({ error: 'Kanji data not found in MongoDB' });
    } catch (error) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Get kana data
app.get('/api/kana', async (req, res) => {
    try {
        if (!db) throw new Error('Database not connected');
        const kana = await db.collection('kana').findOne({});
        if (kana && (kana.hiragana || kana.katakana)) return res.json(kana);
        return res.status(404).json({ error: 'Kana data not found in MongoDB' });
    } catch (error) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Get vocabulary items for a specific category
app.get('/api/vocabulary/:catId', async (req, res) => {
    const { catId } = req.params;
    try {
        if (!db) throw new Error('Database not connected');
        let items = [];
        // Migration script names collections as 'vocab_name'
        const collectionName = `vocab_${catId.toLowerCase()}`;
        items = await db.collection(collectionName).find({}).toArray();

        if (items.length === 0) {
            // Try without prefix if it was migrated differently or check if it exists
            const alternativeCollection = catId.toLowerCase();
            const altItems = await db.collection(alternativeCollection).find({}).toArray();
            if (altItems.length > 0) {
                return res.json(altItems);
            }
        }

        if (Array.isArray(items) && items.length > 0) return res.json(items);
        return res.status(404).json({ error: `Vocabulary category ${catId} not found in MongoDB` });
    } catch (error) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
});

// Start server
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
