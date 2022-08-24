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

// To get the users
router.get("/register", (req,res) => {
  let strQry = `SELECT * FROM users;`;
  db.query(strQry, (err, results)=>{
    if (err) throw err;
    res.status(200).json({
      results: results,
    });
  });
});


  // Register
router.post("/register", bodyParser.json(), (req, res) => {

    let { user_name, user_lastname, email, user_password, user_role } = req.body;

    if ( (user_role === null) || (user_role === undefined) || (user_role.length === 0)) {
      user_role = "user";
    }

    let strQry = `SELECT email, user_password
      FROM users
      WHERE LOWER(email) = LOWER('${email}')`;
    db.query(strQry, async (err, results) => {
      if(err){
        throw err;
      }else {
        console.log(results);
        if (results.length) {
          res.status(409).json({ msg: "User already exist" });
        } else {
          // Encrypting a password

          user_password = await hash(user_password, 10);

          strQry = `
                  INSERT INTO users(user_name, user_lastname , email, user_password, user_role)
                  VALUES(?, ?, ?, ?, ?);
                  `;
          db.query(
            strQry,
            [user_name, user_lastname , email, user_password, user_role],
            (err) => {
              if (err) throw err;
              res
                .status(201)
                .json({
                  msg: `You have been successfully registered !!!`
                });
            }
          );
        }
      } 
    });
  });

  // Adding Products

  router.post("/products", bodyParser.json(), (req, res) => {
    const bd = req.body;
    // bd.totalamount = bd.quantity * bd.price;
    // Query
    const strQry = `
      INSERT INTO products(title, category,  product_description, img, price, quantity)
      VALUES(?, ?, ?, ?, ?, ?);
      `;
    //
    db.query(
      strQry,
      [
        bd.title,
        bd.category,
        bd.product_description,
        bd.img,
        bd.price,
        bd.quantity,
      ],
      (err, results) => {
        if (err) throw err;
        res.json({
          msg: "Product added successfully"
        });
      }
    );
  });


  // Call all Products

  router.get("/products", (req, res) => {
    // Query
    const strQry = `
      SELECT *
      FROM products;
      `;
    db.query(strQry, (err, results) => {
      if (err) throw err;
      res.json({
        status: 200,
        results: results,
      });
    });
  });

  // Call single Project
router.get("/products/:id", (req, res) => {
  // Query
  const strQry = `
    SELECT *
    FROM products
    WHERE product_id = ?;
    `;
  db.query(strQry, [req.params.id], (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      results: results.length <= 0 ? "Sorry, no product was found." : results,
    });
  });
});