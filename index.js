import express, { json, urlencoded } from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import generate from "meaningful-string";
const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
const server_apikey = process.env.SERVER_API_KEY;
app.use(json({ limit: "1000mb" }));
app.use(urlencoded({ limit: "1000mb", extended: true }));
app.use(
  cors({
    origin: ["http://localhost:4000", "http://localhost:5000"],
  })
);

app.route("/").get(function (req, res) {
  const req_apikey = req.headers.apikey;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  res.send("✅Server is running live");
});
const userdb = [];
const productstore = [];
const regex = new RegExp(
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
);
app.route("/signup").post((req, res) => {
  const req_apikey = req.headers.apikey;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  const { fullname, email, password, age } = req.body;
  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.email === email &&
      identifyIfUserAlreadyExists.password === password
  );
  if (identifyIfUserAlreadyExists) {
    res
      .status(401)
      .send({ code: "You already have an account with this email address" });
  } else {
    CheckIfFieldsAreEmpty();
  }
  function CheckIfFieldsAreEmpty() {
    if (fullname === "" || email === "" || password === "" || age === "") {
      res.status(401).send({
        code: "Unauthenticated",
        message: "Please enter a fullname, email, password and age",
      });
    } else {
      CheckIfEmailFieldIsValid();
    }
  }
  function CheckIfEmailFieldIsValid() {
    if (regex.test(email) && email.includes(".")) {
      CheckIfPasswordFieldIsValid();
    } else {
      res
        .status(401)
        .send({ code: "error", message: "Email field is not a valid email" });
    }
  }
  function CheckIfPasswordFieldIsValid() {
    if (password.length > 8) {
      CheckIfUserIsEligibleToSignup();
    } else {
      res.status(403).send({
        code: "error",
        message: "Password must have at least 8 characters",
      });
    }
  }
  function CheckIfUserIsEligibleToSignup() {
    const eligible_age = 18;
    if (age >= eligible_age) {
      const options = {
        min: 10,
        max: 20,
        capsWithNumbers: true,
      };
      const product_id = generate.random(options);
      res
        .status(200)
        .send({
          code: "success",
          message: "Account creation successful",
          key: product_id,
        });
      req.body.body = [];
      userdb.push(req.body);
    } else {
      res.status(403).send({
        code: "error",
        message: `You must be older than years ${18} old to be able to create accounts`,
      });
    }
  }
});
app.route("/login").post(function (req, res) {
  const req_apikey = req.headers.apikey;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  const { email, password } = req.body;
  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.email === email &&
      identifyIfUserAlreadyExists.password === password
  );
  if (email === "" || password === "") {
    res.status(403).send({
      code: "error",
      message: "Please enter your email address and password",
    });
  } else {
    CheckIfEmailFieldIsValid();
  }
  function CheckIfEmailFieldIsValid() {
    if (regex.test(email) && email.includes(".")) {
      CheckIfUserAccountExist();
    } else {
      res
        .status(403)
        .send({ code: "error", message: "Email field is not a valid email" });
    }
  }
  function CheckIfUserAccountExist() {
    if (identifyIfUserAlreadyExists) {
      res.status(200).send({ code: "success", message: "Login successfully!" });
    } else {
      res
        .status(404)
        .send({ code: "error", message: "That user account does not exist" });
    }
  }
});
app.route("/products/create").post((req, res) => {
  const req_apikey = req.headers.apikey;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  const { email, password } = req.body;
  const { product_name, product_price, product_image } = req.body.body;
  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.email === email &&
      identifyIfUserAlreadyExists.password === password
  );
  if (identifyIfUserAlreadyExists) {
    UploadProducts();
  } else {
    res.status(401).send({
      code: "Unauthenticated",
      message: "You are not authenticated to upload a product",
    });
  }
  function UploadProducts() {
    const product_list = identifyIfUserAlreadyExists.body;
    const options = {
      min: 8,
      max: 10,
      capsWithNumbers: true,
    };
    const product_id = generate.random(options);
    product_list.push({
      productID: product_id,
      productName: product_name,
      productPrice: product_price,
      productImage: product_image,
    });
    productstore.push({
      productID: product_id,
      productName: product_name,
      productPrice: product_price,
      productImage: product_image,
    });
    res
      .status(200)
      .send({ code: "success", message: "Product was successfully created" });
  }
});
app.route("/products/edit/:productID").put(function (req, res) {
  const req_apikey = req.headers.apikey;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  const { email, password } = req.body;
  const { product_name, product_price, product_image } = req.body.body;
  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.email === email &&
      identifyIfUserAlreadyExists.password === password
  );
  if (identifyIfUserAlreadyExists) {
    CheckIfProductExist();
  } else {
    res.status(401).send({
      code: "Unauthenticated",
      message:
        "You are not allowed to edit this product without authenticating your account.",
    });
  }
  function CheckIfProductExist() {
    const id = identifyIfUserAlreadyExists.body;
    const result = id.find(
      (result) => result.productID === req.params.productID
    );
    const result2 = productstore.find(
      (result) => result.productID === req.params.productID
    );
    if (!result) {
      res.status(404).send({
        code: "Not Found",
        message: "Product not found in the database",
      });
    }
    if (result) {
      UpdateProductItems(result, result2);
      res
        .status(200)
        .send({ code: "success", message: "Product edited successfully" });
      function UpdateProductItems(result, result2) {
        result.productName = product_name;
        result.productPrice = product_price;
        result.productImage = product_image;
        result2.productName = product_name;
        result2.productPrice = product_price;
        result2.productImage = product_image;
      }
    }
  }
});
app.route("/admin/users").get((req, res) => {
  const req_apikey = req.headers.apikey;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  res.send(userdb);
});
app.route("/admin/products").get((req, res) => {
  const req_apikey = req.headers.apikey;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  res.send(productstore);
});
app.listen(PORT, () => {
  console.log(`Server started on PORT: ${PORT}`);
});
