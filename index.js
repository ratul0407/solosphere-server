require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ratul.gtek0.mongodb.net/?retryWrites=true&w=majority&appName=Ratul`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("SoloSphereDB");
    const jobsCollection = db.collection("jobs");
    const bidsCollection = db.collection("bids");
    app.post("/add-job", async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      res.send(result);
    });

    // get all jobs data from database
    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    //get all jobs posted by a specific user
    app.get("/jobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "buyer.email": email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });
    // delete a job data using it's id as query
    app.delete("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });

    //get jobs data based on id
    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    //update a specific data
    app.put("/update-job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const jobData = req.body;
      const updated = {
        $set: jobData,
      };
      const options = { upsert: true };
      const result = await jobsCollection.updateOne(query, updated, options);
      res.send(result);
    });

    //save a bid to the database
    app.post("/add-bid", async (req, res) => {
      const bidData = req.body;
      //0. check if the user has already placed a bid on this job
      const query = { email: bidData.email, jobId: bidData.jobId };
      const alreayExist = await bidsCollection.findOne(query);
      if (alreayExist) {
        return res
          .status(400)
          .send("you have already placed a bid on this job");
      }
      // 1. save data in bids collection
      const result = await bidsCollection.insertOne(bidData);

      // 2. update bid count in jobs collection
      const filter = { _id: new ObjectId(bidData.jobId) };
      const update = {
        $inc: { bid_count: 1 },
      };
      const updateBidCounter = await jobsCollection.updateOne(filter, update);
      res.send(result);
    });

    // get all bids for a specific user
    app.get("/bids/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await bidsCollection.find(query).toArray();
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from SoloSphere Server....");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
