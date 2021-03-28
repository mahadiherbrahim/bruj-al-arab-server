const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const admin = require('firebase-admin');
const port = 5000
require('dotenv').config()
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qppec.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const serviceAccount = require("./configs/burj-al-arab-63031-firebase-adminsdk-jyjtj-c18fcce425.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db(`${process.env.DB_NAME}`).collection("booking");
  app.post('/addBooking',(req,res) => {
      const newBooking = req.body
      bookings.insertOne(newBooking)
      .then(result => {
          res.send(result.insertedCount > 0)
      })
  })

  app.get('/bookings', (req,res) => {

      const bearer =  req.headers.authentication

      if(bearer && bearer.startsWith('Bearer ')){
        const idToken = bearer.split(' ')[1];
        admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const email = decodedToken.email;
          if(email === req.query.email){
            bookings.find({email: req.query.email})
            .toArray((err,document) =>{
                res.send(document)
            })
          }
        })
        .catch((error) => {
          res.status(401).send('Unauthorized ID Token')
        });
      }
      else{
        res.status(401).send('Unauthorized User')
      }
      
  })


});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})