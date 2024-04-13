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

async function getPaginatedData(collectionName, query, req) {
    const projection = { _id: 0 };
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const collection = db.collection(collectionName);
    return collection.find(query, { projection }).skip(skip).limit(limit).toArray();
}

// Endpoint to get all enemies
app.get('/api/enemies', async (req, res) => {
    const query = buildQuery(req, ['type', 'name']);
    try {
        const enemies = await getPaginatedData('enemies', query, req);
        res.status(200).json(enemies);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching enemies' });
    }
});

// Endpoint to get all research
app.get('/api/research', async (req, res) => {
    const query = buildQuery(req, ['name']);
    try {
        const research = await getPaginatedData('research', query, req);
        res.status(200).json(research);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching research' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`);
})

function buildQuery(req, fields) {
    return fields.reduce((query, field) => {
        if (req.query[field]) {
            query[field] = field === 'name'
                ? new RegExp(req.query[field], 'i')
                : req.query[field];
        }
        return query;
    }, {});
}