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

app.get('/api/items', async (req, res) => {
    const query = buildItemQuery(req);
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
    // Query by name using regex for partial match
    if (req.query.sciencePacks) {
        query.name = new RegExp(req.query.name.replace(/_/g, ' '), 'i');
    }

    // Handle queries for science pack existence
    if (req.query.sciencePacks) {
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

// function buildQuery(req, fields) {
//     return fields.reduce((query, field) => {
//         if (req.query[field]) {
//             if (field === 'name') {
//                 // Regular expression for name search
//                 query[field] = new RegExp(req.query[field], 'i');
//             } 
//             else if (field === 'type') {
//                 // Regular expression for type within a nested object
//                 query['attributes.damage.type'] = new RegExp(req.query[field], 'i');
//             } 
//             else if (field === 'minDamage' || field === 'maxDamage') {
//                 // Numeric range query for damage.amount
//                 const path = 'attributes.damage.amount';
//                 if (!query[path]) {
//                     query[path] = {};
//                 }
//                 if (field === 'minDamage') {
//                     query[path]['$gte'] = parseInt(req.query[field]);
//                 } else {
//                     query[path]['$lte'] = parseInt(req.query[field]);
//                 }
//             }
//             else if (field === 'minRange' || field === 'maxRange') {
//                 // Numeric range query for range
//                 const rangePath = 'attributes.range';
//                 if (!query[rangePath]) {
//                     query[rangePath] = {};
//                 }
//                 query[rangePath][field === 'minRange' ? '$gte' : '$lte'] = parseInt(req.query[field]);
//             }
//             else if (field === 'minSpeed' || field === 'maxSpeed') {
//                 // Numeric range query for speed, after removing non-numeric characters
//                 const speedPath = 'attributes.speed';
//                 if (!query[speedPath]) {
//                     query[speedPath] = {};
//                 }
//                 const speedValue = parseFloat(req.query[field].replace(/[^0-9\.]/g, ''));
//                 query[speedPath][field === 'minSpeed' ? '$gte' : '$lte'] = speedValue;
//             }
//         }
//         return query;
//     }, {});
// }