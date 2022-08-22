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




  // User registration
router.post("/register", bodyParser.json(), (req, res) => {
    // Retrieving data that was sent by the user
    // id, firstname, lastname, email, userpassword, usertype
    let { user_firstname, user_lastname, email, user_password, user_role } = req.body;
    // If the userRole is null or empty, set it to "user".
    if (user_role.length === 0) {
      if (user_role.includes() !== "user" || user_role.includes() !== "admin")
        user_role = "user";
    }
    // Check if a user already exists
    let strQry = `SELECT email, user_password
      FROM users
      WHERE LOWER(email) = LOWER('${email}')`;
    db.query(strQry, async (err, results) => {
      if (err) {
        throw err;
      } else {
        if (results.length) {
          res.status(409).json({ msg: "User already exist" });
        } else {
          // Encrypting a password
          // Default value of salt is 10.
          user_password = await hash(user_password, 10);
          // Query
          strQry = `
                  INSERT INTO users(user_firstname, user_lastname , email, user_password, user_role)
                  VALUES(?, ?, ?, ?, ?);
                  `;
          db.query(
            strQry,
            [user_firstname, user_lastname , email, user_password, user_role],
            (err, results) => {
              if (err) throw err;
              res
                .status(201)
                .json({
                  msg: `number of affected row is: ${results.affectedRows}`,
                });
            }
          );
        }
      }
    });
  });