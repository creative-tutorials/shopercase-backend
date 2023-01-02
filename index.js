import express, { json, urlencoded } from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import generate from "meaningful-string";
import bodyparser from "body-parser";
import Server from "./server.js";
import CorsJS from "./cors.js";
import ConnectToMongoDB from "./mongodb/connect.js";
import WriteToDatabase from "./mongodb/write.js";

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
const server_apikey = process.env.SERVER_API_KEY;
app.use(json({ limit: "1000mb" }));
app.use(urlencoded({ limit: "1000mb", extended: true }));
app.use(bodyparser.urlencoded({ limit: "1000mb", extended: false }));
CorsJS({ app, cors });

ConnectToMongoDB();

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
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
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
    if (passwordRegex.test(password)) {
      CheckIfUserIsEligibleToSignup();
    } else {
      res.status(403).send({
        code: "error",
        message:
          "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character.",
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
        session_key: session_key,
      };
      const reqbody = req.body;
      req.body.session_key = session_key;
      res.status(200).send(account);
      req.body.body = [];
      userdb.push(reqbody);
      WriteToDatabase(reqbody);
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
  const { session_key } = req.body;
  const { product_name, product_price, product_image } = req.body.body;
  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.session_key === session_key
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

app.route("/products/request/:productID/:session_key").post((req, res) => {
  const req_apikey = req.headers.apikey;
  const { session_key, productID } = req.params;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });

  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.session_key === session_key
  );
  const fetchProductFromParamsValue = productstore.find(
    (fetchProductFromParamsValue) =>
      fetchProductFromParamsValue.productID === productID
  );
  /* Checking if the user exists in the database and if it does, it will call the function
  `RequestProductAccess()` */
  if (identifyIfUserAlreadyExists) return RequestProductAccess();

  function RequestProductAccess() {
    CheckIfProductIDisValid();
  }
  function CheckIfProductIDisValid() {
    if (fetchProductFromParamsValue) {
      console.log(fetchProductFromParamsValue);
      res
        .status(200)
        .send({ code: "success", message: "Connected successfully" });
    }
    if (!fetchProductFromParamsValue) {
      res.status(404).send({ code: "error", message: "Invalid Product ID" });
    }
  }
  if (!identifyIfUserAlreadyExists)
    return res.status(401).send({
      error: "Unauthenticated",
      message: "You need to login/signup as a user to purchase this product",
    });
});

app.route("/products/delete/:productID/:session_key").delete((req, res) => {
  const req_apikey = req.headers.apikey;
  const { session_key } = req.params;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  const { productID } = req.params;
  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.session_key === session_key
  );
  if (!identifyIfUserAlreadyExists)
    return res.status(401).send({
      code: "Unauthenticated",
      message: "You need to login/signup as a user to continue this process",
    });
  /* Checking if the user exists in the database and if it does, it will call the function
  `HandleDeleteProduct()` */
  if (identifyIfUserAlreadyExists) return HandleDeleteProduct();

  function HandleDeleteProduct() {
    const product_list = identifyIfUserAlreadyExists.body;
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
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "issue with apikey", message: "API key mismatch" });
  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.session_key === session_key
  );
  if (identifyIfUserAlreadyExists) {
    try {
      const user_product = identifyIfUserAlreadyExists.body;
      res.status(200).send(user_product);
    } catch (error) {
      res.status(400).send({
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
