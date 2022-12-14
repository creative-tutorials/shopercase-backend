import express, { json, urlencoded } from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import generate from "meaningful-string";
import bodyparser from "body-parser";
import Server from "./server.js";
import CorsJS from "./cors.js";
const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
const server_apikey = process.env.SERVER_API_KEY;
app.use(json({ limit: "1000mb" }));
app.use(urlencoded({ limit: "1000mb", extended: true }));
app.use(bodyparser.urlencoded({ limit: "1000mb", extended: false }));
CorsJS({ app, cors });

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
        min: 30,
        max: 35,
      };
      const session_key = generate.random(options);
      const account = {
        email: email,
        password: password,
        session_key: session_key,
      };
      req.body.session_key = session_key;
      res.status(200).send(account);
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
        .send({ code: "error", message: "Value is not valid email" });
    }
  }
  function CheckIfUserAccountExist() {
    if (identifyIfUserAlreadyExists) {
      const account = {
        email: identifyIfUserAlreadyExists.email,
        password: identifyIfUserAlreadyExists.password,
        session_key: identifyIfUserAlreadyExists.session_key,
      };
      res.status(200).send(account);
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

app.route("/products/delete/:productID").delete((req, res) => {
  const req_apikey = req.headers.apikey;
  const { email, password } = req.body;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  const { productID } = req.params;
  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.email === email &&
      identifyIfUserAlreadyExists.password === password
  );
  if (!identifyIfUserAlreadyExists)
    return res.status(401).send({
      code: "Unauthenticated",
      message: "You need to login/signup as a user to continue this process",
    });
  if (identifyIfUserAlreadyExists) {
    HandleDeleteProduct();
  }
  function HandleDeleteProduct() {
    const product_list = identifyIfUserAlreadyExists.body;
    // product_list
    // productstore
    const result = productstore.find(
      (result) => result.productID === req.params.productID
    );
    if (!result)
      return res.status(404).send({
        code: "not found",
        message: `There is no product with ID of ${productID}`,
      });
    try {
      const updateProductStore = productstore.findIndex(
        (item) => item.productID === productID
      );
      const updateProductList = product_list.findIndex(
        (item) => item.productID === productID
      );
      productstore.splice(updateProductStore, 1);
      product_list.splice(updateProductList, 1);
      console.log(productstore, product_list);
      res
        .status(200)
        .send({ code: "successfull", message: "Product successfully deleted" });
    } catch (error) {
      console.log(error);
      res.status(406).send({
        code: "error",
        message: "There was an error deleting the product",
      });
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

app.route("/user/:session_key").post(function (req, res) {
  const req_apikey = req.headers.apikey;
  const { session_key } = req.params;
  const { email, password } = req.body;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.email === email &&
      identifyIfUserAlreadyExists.password === password
  );
  if (identifyIfUserAlreadyExists) {
    AuthorizePermission();
  }
  function AuthorizePermission() {
    try {
      const user_sessionToken = userdb.find(
        (item) => item.session_key === session_key
      );
      if (user_sessionToken) {
        const user_product = identifyIfUserAlreadyExists.body;
        res.status(200).send(user_product);
      }
      if (!user_sessionToken) {
        res.status(401).send({
          code: "Unauthenticated",
          message: "Session expired or user not authenticated",
        });
      }
    } catch (error) {
      res
        .status(400)
        .send({
          code: "Invalid syntax",
          message:
            "The server could not respond to your request, check your input and try again.",
        });
    }
  }
  if (!identifyIfUserAlreadyExists) {
    res.status(401).send({
      code: "Unauthenticated",
      message: "It looks like your account is not authenticated",
    });
  }
});
Server({ app, PORT });
