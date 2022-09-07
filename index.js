require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
const db = require("./config/dbART");
const { compare, hash } = require("bcrypt");
const app = express();
const router = express.Router();

const port = parseInt(process.env.PORT) || 4000;

app.use(
  cors({
    origin: ["http://localhost:8080", "http://127.0.0.1:8080"],
    credentials: true,
  })
);
app.use((req, res, next)=> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
})
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
//
app.get('/:type', (req, res)=> {
  res.status(404).sendFile(__dirname +'/views/404.html');
});

// home
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// To get the users
router.get("/users", (req, res) => {
  let strQry = `SELECT * FROM users;`;
  db.query(strQry, (err, results) => {
    if (err) throw err;
    res.status(200).json({
      results: results,
    });
  });
});

// Select user with specific Id
router.get("/users/:id", (req, res) => {
  let strQry = 
  `SELECT user_name, user_lastname, email 
  FROM users
  WHERE user_id = ${req.params.id};
  `;
  db.query(strQry, (err, results) => {
    if (err) throw err;
    res.status(200).json({
    results: results.length <= 0 ? "Sorry, this user doesnt exist." : results,
    });
  });
});


// Update and Delete Users
router.put("/users/:id", bodyParser.json(), (req, res) => {
  const bd = req.body;
  // Query
  const strQry = `UPDATE users
     SET  user_name = ?, user_lastname = ?, email = ?,  user_password = ?, user_role = ?
     WHERE user_id = ${req.params.id}`;

  db.query(strQry, [
    bd.user_name,
    bd.user_lastname,
    bd.email,
    bd.user_password,
    bd.user_role], (err, data) => {
    if (err) throw err;
    res.send(`number of affected record/s: ${data.affectedRows}`);
  });
});

router.delete("/users/:id", bodyParser.json(),  (req, res) => {
  // Query
  const strQry = `
    DELETE FROM users 
    WHERE user_id = ?;
    `;
  db.query(strQry, [req.params.id], (err, data, fields) => {
    if (err) throw err;
    res.json({
      msg:`Deleted`
    });
  });
});

// Register
router.post("/register", bodyParser.json(), (req, res) => {
  let { user_name, user_lastname, email, user_password, user_role } = req.body;

  if (user_role === null || user_role === undefined || user_role.length === 0) {
    user_role = "user";
  }

  let strQry = `SELECT email, user_password
      FROM users
      WHERE LOWER(email) = LOWER('${email}')`;
  db.query(strQry, async (err, results) => {
    if (err) {
      throw err;
    } else {
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
          [user_name, user_lastname, email, user_password, user_role],
          (err) => {
            if (err) throw err;
            res.status(201).json({
              msg: `You have been successfully registered !!!`,
            });
          }
        );
      }
    }
  });
});
// Login

router.patch("/login", bodyParser.json(), (req, res) => {
  const { email, user_password } = req.body;

  const strQry = `
    SELECT * FROM users
    WHERE email = '${email}'
    `;

  db.query(strQry, async (err, results) => {
    // console.log(results)
    if (err) throw err;
    //incorrect password
    if (!results.length) {
      res.status(404).json({ msg: "not registered" });
    }
    const ismatch = await compare(user_password, results[0].user_password);

    if (ismatch === false) {
      res.status(404).json({
        msg: "Incorecct Password",
      });
    }
    // Token
    if (ismatch === true) {
      const token = jwt.sign(
        {
          user_id: results[0].user_id,
          user_name: results[0].user_name,
          user_lastname: results[0].user_lastname,
          email: results[0].email,
        },
        process.env.TOKEN_KEY,
        {
          expiresIn: "1h",
        },
        (err, token) => {
          if (err) throw err;
          // Login
          res.status(200).json({
            msg: "Logged in",
            token,
            results: results[0],
          });
        }
      );
    }
  });
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
// GEtting Single Products

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
        msg: "Product added successfully",
      });
    }
  );
});
// Product Updte
router.put("/products/:id",bodyParser.json(), (req, res) => {
  const bd = req.body;
  // Query
  const strQry = `UPDATE products
     SET title = ? , category= ?, product_description = ?, img = ?,  price = ?, quantity = ?
     WHERE product_id = ${req.params.id}`;

  db.query(strQry, [
    bd.title,
    bd.category,
    bd.product_description,
    bd.img,
    bd.price,
    bd.quantity], (err, data) => {


    if (err) throw err;
    res.json({
      msg:`number of affected record/s: ${data.affectedRows}`
    });
  });
});

//  Product Delete

router.delete("/products/:id", (req, res) => {
  // Query
  const strQry = `
    DELETE FROM products 
    WHERE product_id = ?;
    `;
  db.query(strQry, [req.params.id], (err, data, fields) => {
    if (err) throw err;
    res.json({ msg: `${data.affectedRows} row was affected`});
  });
});

// Cart Get single
router.get("/users/:id/cart", bodyParser.json() ,(req, res) => {
  let sql = `SELECT cart FROM users WHERE user_id =${req.params.id};`;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      results: JSON.parse(results[0].cart),
    });
  });
});

//================================= Add Cart ==============================================================================
router.post("/users/:id/cart", bodyParser.json(), (req, res) => {
  let bd = req.body;
  let sql = `SELECT cart FROM users WHERE user_id = ${req.params.id}`;
  db.query(
    sql,
    (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        let cart = JSON.parse(results[0].cart);
        if (results.cart == null) {
          cart = [];
        } else {
          cart = JSON.parse(results[0].cart);
        }
        let product = {
          cart_id : cart.length + 1,
          // "product_id": cart.length + 1,
          "title": bd.title,
          "category": bd.category,
          "product_description": bd.product_description,
          "img": bd.img,
          "price": bd.price,
          "quantity": bd.quantity,
        };
        
        console.log(JSON.parse(results[0].cart));
        cart.push(product);
        let sql = `UPDATE users SET cart = ? WHERE user_id = ${req.params.id}`;

        db.query(sql, JSON.stringify(cart), (err, results) => {
          if (err) throw err;
          res.json(
            {msg : `Product add to your cart`});
        });
      } //me
    } //you
  );
});

//================================= Delete ==============================================================================
router.delete('/users/:id/cart/:cartid', (req,res)=>{
  const delSingleCartProd = `
      SELECT cart FROM users 
      WHERE user_id = ${req.params.id}
  `
  db.query(delSingleCartProd, (err,results)=>{
      if(err) throw err;

      if(results.length > 0){
          if(results[0].cart != null){

              const result = JSON.parse(results[0].cart).filter((cart)=>{
                  return cart.product_id != req.params.cartid;
              })
              result.forEach((cart,i) => {
                  cart.product_id = i + 1
              });
              const query = `
                  UPDATE users 
                  SET cart = ? 
                  WHERE user_id = ${req.params.id}
              `

              db.query(query, [JSON.stringify(result)], (err,results)=>{
                  if(err) throw err;
                  res.json({
                      status:200,
                      result: "Successfully deleted the selected item from cart"
                  });
              })

          }else{
              res.json({
                  status:400,
                  result: "Your Cart is Empty"
              })
          }
      }else{
          res.json({
              status:400,
              result: "There is no user with that id"
          });
      }
  })

})
