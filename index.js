const express = require('express');
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rysigvn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const menuCollection = client.db("restaurentdb").collection("menu");
    const reviewCollection = client.db("restaurentdb").collection("reviews");
    const cartCollection = client.db("restaurentdb").collection("carts");

    // API Route to Get Menu
    app.get('/menu', async (req, res) => {
      try {
        const result = await menuCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching menu:", error);
        res.status(500).send("Internal Server Error");
      }
    });


    app.get('/reviews', async(req, res) => {
        const result = await reviewCollection.find().toArray();
        res.send(result);
    });

    // Carts collection
    app.get('/carts', async(req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/carts', async(req, res) => {
      const cartItems = req.body;
      const result = await cartCollection.insertOne(cartItems);
      res.send(result);
    });

    // Start the Server **AFTER** MongoDB is connected
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });

  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
  }
}

run();

// Home Route
app.get("/", (req, res) => {
  res.send("Server is running...");
});
