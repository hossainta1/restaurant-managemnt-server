const express = require('express');
const cors = require("cors");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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

    const userCollection = client.db("restaurentdb").collection("users");
    const menuCollection = client.db("restaurentdb").collection("menu");
    const reviewCollection = client.db("restaurentdb").collection("reviews");
    const cartCollection = client.db("restaurentdb").collection("carts");

    // Jwt related API start
     app.post('/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1hr'});
      res.send({token});

     })
    // Jwt related API end

    // middleware verify token start
      const verifyToken = (req, res, next) => {
        console.log('inside verify token', req.headers.authorization);
        if(! req.headers.authorization){
          return res.status(401).send({message: 'Unauthorized Access'});
        }
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if(err){
            return res.status(401).send({message: 'Unauthorized Access'})
          }
          req.decoded = decoded;
          next();

        })
      }

      const verifyAdmin = async(req, res, next) => {

        const email = req.decoded.email;
        const query = {email: email};
        const user = await userCollection.findOne(query);
        const isAdmin = user?.role === 'admin';
        if(!isAdmin){
          return res.send.status(403).send({message: 'Forbidden Access'})
        }
        next();

      }
    // middleware verify token end

    // Users related API start
    app.get('/users', verifyToken, verifyAdmin, async(req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })


    app.get('/users/admin/:email', verifyToken, async(req, res) => {
      const email = req.params.email;
      if(email !== req.decoded.email){
        return req.status(403).send({message: 'Forbidden Access'})
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === 'admin';
      }
      res.send({admin})

    })

     app.post('/users', async(req, res) => {
      const user = req.body;
      // insert email if user does not exist
       const query = {email : user.email};
       const existingUser = await userCollection.findOne(query);
       if(existingUser){
        return res.send({message: 'User alrady Exist'})
       }
      const result = await userCollection.insertOne(user);
      res.send(result)
     })
    // Users related API end

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: "admin" } };
    
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/users/:id', verifyToken, verifyAdmin, async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await userCollection.deleteOne(query);
      res.send(result)


    })

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

    app.post('/menu', async(res, req) => {
      const item = req.body;
      const result = await menuCollection.insertOne(item);
      res.send(result);
    })


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

    // delete cart items
     app.delete('/carts/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await cartCollection.deleteOne(query);
      res.send(result);
     })
    // delete cart items

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
