const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const PORT = 8000;
const app = express();

app.use(cors());
app.use(express.json());


// Connect to MongoDB
let db,
      dbConnectionString = process.env.MONGODB_URI
      dbName = 'FactorioData'

MongoClient.connect(dbConnectionString, {useUnifiedTopology: true})
  .then(client => {
    console.log(`Connected to ${dbName} Database`);
    db = client.db(dbName);
});

// Endpoint to get all enemies
app.get('/api/enemies', async (req, res) => {
    try {
        const enemiesCollection = db.collection('enemies');
        const enemies = await enemiesCollection.find().toArray();
        res.status(200).json(enemies);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching enemies' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`);
})