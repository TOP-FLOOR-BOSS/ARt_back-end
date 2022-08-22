require ("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path")
const jwt = require("jsonwebtoken");
const db = require("./config/dbART");
const { compare, hash} = require("bcrypt")
const app = express();
const router = express.Router();

const port = parseInt(process.env.PORT) || 4000


app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true
  }))
  app.use((req, res, next) => {
    // res.setHeader("Access-Control-Allow-Origin", "*");
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    });
    next();
  });
  
  app.use(
    express.static("public"),
    router,
    express.json(),
    express.urlencoded({
      extended: true,
    })
  );
  
  //
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  // home
  router.get("/", (req, res) => {
    res.sendFile(path.join (__dirname, "views", "index.html"));
  });

