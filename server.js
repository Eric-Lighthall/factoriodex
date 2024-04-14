const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const PORT = 8000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'))


// Connect to MongoDB
let db,
      dbConnectionString = process.env.MONGODB_URI
      dbName = 'FactorioData'

MongoClient.connect(dbConnectionString, {useUnifiedTopology: true})
  .then(client => {
    console.log(`Connected to ${dbName} Database`);
    db = client.db(dbName);
});

async function getPaginatedData(collectionName, query) {
    const projection = { _id: 0 };
    const collection = db.collection(collectionName);
    return collection.find(query, { projection }).toArray();
}

// Endpoint to get all enemies
app.get('/api/enemies', async (req, res) => {
    const query = buildQuery(req, ['type', 'name']);
    try {
        const enemies = await getPaginatedData('enemies', query);
        res.status(200).json(enemies);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching enemies' });
    }
});

// Endpoint to get all research
app.get('/api/research', async (req, res) => {
    const query = buildQuery(req, ['name']);
    try {
        const research = await getPaginatedData('research', query);
        res.status(200).json(research);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching research' });
    }
});

app.get('/api/items', async (req, res) => {
    const query = buildQuery(req, ['name', 'category', 'dimensions', 'maxCraftingTime']);
    try {
        const items = await getPaginatedData('items', query);
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching items' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`);
})

function buildQuery(req, fields) {
    const query = fields.reduce((query, field) => {
        if (req.query[field]) {
            if (field === 'name') {
                // Regular expression for name search
                query[field] = new RegExp(req.query[field], 'i');
            } else if (field === 'type') {
                // Regular expression for type within a nested object
                query['attributes.damage.type'] = new RegExp(req.query[field], 'i');
            } else if (field === 'minDamage' || field === 'maxDamage') {
                // Numeric range query for damage.amount
                const path = 'attributes.damage.amount';
                if (!query[path]) {
                    query[path] = {};
                }
                if (field === 'minDamage') {
                    query[path]['$gte'] = parseInt(req.query[field]);
                } else {
                    query[path]['$lte'] = parseInt(req.query[field]);
                }
            }
        }
        return query;
    }, {});
    return query;
}