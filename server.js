const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors({
    origin: 'https://factoriodex.cyclic.app'
}));
app.use(express.json());


// Connect to MongoDB
let db,
    dbConnectionString = process.env.MONGODB_URI,
    dbName = 'FactorioData';

MongoClient.connect(dbConnectionString, {useUnifiedTopology: true})
  .then(client => {
    console.log(`Connected to ${dbName} Database`);
    db = client.db(dbName);
    })
    .catch(error => {
        console.error("Failed to connect to the database:", error);
        process.exit(1);
    });

app.use(express.static('public'))

async function getPaginatedData(collectionName, query) {
    const projection = { _id: 0 };
    const collection = db.collection(collectionName);
    return collection.find(query, { projection }).toArray();
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint to get all enemies
app.get('/api/enemies', async (req, res) => {
    const query = buildEnemyQuery(req, ['type', 'name', 'minDamage', 'maxDamage', 'minRange', 'maxRange', 'minSpeed', 'maxSpeed']);
    try {
        const enemies = await getPaginatedData('enemies', query);
        res.status(200).json(enemies);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching enemies' });
    }
});

// Endpoint to get all research
app.get('/api/research', async (req, res) => {
    const query = buildResearchQuery(req);
    try {
        const research = await getPaginatedData('research', query);
        res.status(200).json(research);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching research' });
    }
});

// Endpoint to get all items
app.get('/api/items', async (req, res) => {
    const query = buildItemQuery(req);
    try {
        const items = await getPaginatedData('items', query);
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching items' });
    }
});

function buildEnemyQuery(req) {
    const fields = ['type', 'name', 'minDamage', 'maxDamage', 'minRange', 'maxRange', 'minSpeed', 'maxSpeed'];
    return fields.reduce((query, field) => {
        if (req.query[field]) {
            handleEnemyQueryField(query, field, req.query[field]);
        }
        return query;
    }, {});
}

function buildItemQuery(req) {
    const fields = ['name', 'type', 'category'];
    return fields.reduce((query, field) => {
        if (req.query[field]) {
            // Use regular expressions for text search on name, type, and category
            query[field] = new RegExp(req.query[field], 'i');
        }
        return query;
    }, {});
}

function buildResearchQuery(req) {
    const query = {};
    // Handle queries for science pack existence
    if (req.query.sciencePacks) {
        query.name = new RegExp(req.query.name.replace(/_/g, ' '), 'i');
        const packs = req.query.sciencePacks.toLowerCase().split(',').map(pack => pack.trim().replace(/_/g, ' '));
        query.$or = packs.map(pack => {
            const key = `cost.${pack}`;
            return { [key]: { $exists: true } }; // Check if this key exists in the document
        });
    }
    return query;
}


function handleEnemyQueryField(query, field, value) {
    // Handle the logic specific to enemy fields here
    if (['minDamage', 'maxDamage', 'minRange', 'maxRange', 'minSpeed', 'maxSpeed'].includes(field)) {
        const attribute = field.substring(3).toLowerCase(); // 'Damage', 'Range', 'Speed'
        const path = `attributes.${attribute}`;
        if (!query[path]) query[path] = {};
        const operator = field.startsWith('min') ? '$gte' : '$lte';
        query[path][operator] = parseFloat(value.replace(/[^0-9\.]/g, ''));
    } else if (field === 'name' || field === 'type') {
        query[field] = new RegExp(value, 'i');
    }
}

app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`);
});