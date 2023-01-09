"use strict";
import express, { json, urlencoded } from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import generate from "meaningful-string";
import bodyparser from "body-parser";
import Server from "./server.js";
import CorsJS from "./cors.js";
import ConnectToMongoDB from "./mongodb/connect.js";
import WriteToDatabase from "./mongodb/write.js";
import secretVariables from "./secrets-variables/secrets.js";
import StoreReusedVairiables from "./secrets-variables/account-secrets.js";
import { MailAlert } from "./alerts/mail-alert.js";
import { OTPAlert } from "./alerts/otp-alert.js";
import { CreateHTMLElement } from "./view/createHTMLElement.js";
import { AuthIssuesWithEmail } from "./alerts/authEmail.js";
import { AuthIssuesWithPassword } from "./alerts/authPassword.js";
import { MagicCodeAlert } from "./alerts/code-alert.js";
import mailgun from "mailgun-js";
import cryptoRandomString from "crypto-random-string";

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
const server_apikey = process.env.SERVER_API_KEY;
app.use(json({ limit: "500kb" }));
app.use(urlencoded({ limit: "500kb", extended: true }));
app.use(bodyparser.urlencoded({ limit: "500kb", extended: false }));
CorsJS({ app, cors });
ConnectToMongoDB();
const DOMAIN = process.env.MAILDOMAIN;
const mg = mailgun({ apiKey: process.env.apikey, domain: DOMAIN });

app.route("/").get(function (req, res) {
  const req_apikey = req.headers.apikey;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "Invalid apikey", message: "API key mismatch" });
  res.send("✅Server is running live");
});
let userdb = [];
let productstore = [];

const regex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;

const phoneNumberPattern = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;

let { OTP, reqEmail, reqPassword } = StoreReusedVairiables();
app.route("/create-account").post((req, res) => {
  const { username, email, password } = req.body;
  const verifyUserCredentials = userdb.find(
    (verifyUserCredentials) => verifyUserCredentials.email === email
  );
  reqEmail = email;
  reqPassword = password;
  if (verifyUserCredentials) {
    res.status(401).send({
      message:
        "Hey there! We've got you in our system. It looks like you already have an account with us. Let's get you logged in.",
    });
  }
  /* Checking if the username, email, and password are empty. */
  if (username === "" || email === "" || password === "") {
    res
      .status(400)
      .send({ message: "You must provide a username, email and password." });
  } else {
    checkLoginDetails();
  }
  function checkLoginDetails() {
    if (regex.test(email) && passwordRegex.test(password)) {
      isDomainValid();
    } else {
      res.status(400).send({
        message:
          "The email or Password you entered is not valid, email must include the '@' and '.' symbol, password must include one uppercase, lowercase letter, one number, and one special character. all must include 8chracters",
      });
    }
  }
  function isDomainValid() {
    const loginPin = cryptoRandomString({ length: 6, type: "numeric" });
    OTP = loginPin;
    const buildHTML = CreateHTMLElement(loginPin);
    const data = {
      from: "hashtag.xyz34@gmail.com",
      to: email,
      subject: "Verify Your Email Address",
      html: buildHTML,
    };
    mg.messages().send(data, function (error, body) {
      console.log(body);
      if (error) {
        const mailAlert = MailAlert();
        res.status(403).send({
          code: "error",
          message: mailAlert,
        });
      } else {
        const otpAlert = OTPAlert();
        res.status(200).send({
          message: otpAlert,
        });
      }
    });
  }
});
let requestCounter = 0;
app.route("/create-account/validate").post((req, res) => {
  const { reqOTP } = req.body;
  requestCounter++;
  setTimeout(() => {
    requestCounter = 0;
  }, 5000);
  console.log(requestCounter);
  if (reqOTP === OTP) {
    const SessionAuthToken = cryptoRandomString({
      length: 30,
      type: "alphanumeric",
    });
    const user = createUserObject(reqEmail, reqPassword, SessionAuthToken);
    console.log(user);
    if (requestCounter > 1) {
      res
        .status(429)
        .send({ message: "Too many requests, please try again later." });
    } else {
      isAccountAlreadyExisting(user);
    }
  }
  function isAccountAlreadyExisting(user) {
    const verifyUserCredentials = userdb.find(
      (verifyUserCredentials) => verifyUserCredentials.email === reqEmail
    );
    if (!verifyUserCredentials) {
      userdb.push(user);
      res.status(200).send(user);
    } else {
      res.status(401).send({
        message:
          "Hey there! We've got you in our system. It looks like you already have an account with us. Let's get you logged in.",
      });
    }
  }
  function createUserObject(reqEmail, reqPassword, SessionAuthToken) {
    return {
      email: reqEmail,
      session_key: SessionAuthToken,
      body: [],
    };
  }
  if (reqOTP !== OTP) {
    res
      .status(400)
      .send({ message: "Invalid code. Please double-check and try again." });
  }
});
app.route("/login").post((req, res) => {
  const { email } = req.body;
  const verifyUserCredentials = userdb.find(
    (verifyUserCredentials) => verifyUserCredentials.email === email
  );
  if (email === "") {
    res.status(400).send({ message: "Please enter an email address" });
  } else {
    isUserAlreadyAuthenticated();
  }
  function isUserAlreadyAuthenticated() {
    if (verifyUserCredentials) {
      res.status(200).send(verifyUserCredentials);
    } else {
      res.status(401).send({
        message:
          "Oops! It looks like the account you are trying to access does not exist in our database. Please check your information and try again.",
      });
    }
  }
});
/* Destructuring the secretVariables function. */
let { outputPin, outputMail } = secretVariables();
let SecondrateLimitCounter = 0;
app.route("/magic_link").post((req, res) => {
  const req_apikey = req.headers.apikey;
  const { email } = req.body;
  SecondrateLimitCounter++;
  setTimeout(() => {
    SecondrateLimitCounter = 0;
  }, 5000);
  console.log("SecondrateLimitCounter", SecondrateLimitCounter);
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "Invalid apikey", message: "API key mismatch" });
  const safePin = cryptoRandomString({ length: 6, type: "numeric" });
  outputPin = safePin;
  outputMail = email;
  if (email === "" || !email) {
    res.status(400).send({ message: "Please enter an email address" });
  } else {
    CheckIfEmailFieldIsValid();
  }
  function CheckIfEmailFieldIsValid() {
    if (regex.test(email) && email.includes(".")) {
      ValidationProcess();
    } else {
      res.status(403).send({
        code: "error",
        message: `'${email}' is not a valid email address`,
      });
    }
  }
  async function ValidationProcess() {
    const data = {
      from: "hashtag.xyz34@gmail.com",
      to: email,
      subject: "Verify Your Identity",
      html: `<div>
            <h1>Let's Get Started</h1>
            <p>Eneter the verification code into the app, to have access to the app </p>
            <h2 style="color:#7A9CC6;">${safePin}</h2>
    </div>`,
    };
    if (SecondrateLimitCounter > 1) {
      res
        .status(429)
        .send({ message: "Too many requests, please try again later." });
    } else {
      mg.messages().send(data, function (error, body) {
        console.log(body);
        if (error) {
          const mailAlert = MailAlert();
          res.status(403).send({
            code: "error",
            message: mailAlert,
          });
        } else {
          const codeMsg = MagicCodeAlert();
          res.status(200).send({
            code: "OK",
            message: codeMsg,
            magicToken: safePin,
          });
        }
      });
    }
  }
});
let ThirdrateLimitCounter = 0;
app.route("/magic_link/validate").post((req, res) => {
  const req_apikey = req.headers.apikey;
  const { pin } = req.body;
  ThirdrateLimitCounter++;
  setTimeout(() => {
    ThirdrateLimitCounter = 0;
  }, 5000);
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "Invalid apikey", message: "API key mismatch" });
  if (pin === outputPin) {
    isLimitExceeded();
  }
  if (pin !== outputPin) {
    res
      .status(400)
      .send({ message: "Pin Incorrect. Check the Pin and Try Again" });
  }
  function isLimitExceeded() {
    if (ThirdrateLimitCounter > 1) {
      res
        .status(429)
        .send({ message: "Too many requests, please try again later." });
    } else {
      const SessionAuthToken = cryptoRandomString({
        length: 30,
        type: "alphanumeric",
      });
      const options = {
        numberUpto: 60,
        joinBy: "-",
      };
      const uniqusername = generate.meaningful(options);
      const user = createUserObject(outputMail, uniqusername, SessionAuthToken);
      isAccountAlreadyExisting(user);
    }
  }
  function isAccountAlreadyExisting(user) {
    const verifyUserCredentials = userdb.find(
      (verifyUserCredentials) => verifyUserCredentials.email === outputMail
    );
    if (!verifyUserCredentials) {
      res.status(200).send({
        auth: user,
        message: "Your account has been successfully created!",
      });
      userdb.push(user);
    } else {
      res.status(401).send({
        message:
          "Hey there! We've got you in our system. It looks like you already have an account with us. Let's get you logged in.",
      });
    }
  }
  function createUserObject(outputMail, uniqusername, SessionAuthToken) {
    return {
      email: outputMail,
      username: uniqusername,
      session_key: SessionAuthToken,
      body: [],
    };
  }
});
app.route("/products/create").post((req, res) => {
  const req_apikey = req.headers.apikey;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "Invalid apikey", message: "API key mismatch" });
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
    const getProductData = identifyIfUserAlreadyExists.body;
    const options = {
      min: 8,
      max: 10,
      capsWithNumbers: true,
    };
    const product_id = generate.random(options);
    getProductData.push({
      productID: product_id,
      productName: product_name,
      productPrice: product_price,
      productImage: product_image,
    });
    productstore = getProductData;
    res
      .status(200)
      .send({ code: "success", message: "Product was successfully created" });
  }
});

app.route("/products/request/:productID/:session_key").post((req, res) => {
  const req_apikey = req.headers.apikey;
  const { session_key, productID } = req.params;
  const { email, full_name, phone_number } = req.body;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "Invalid apikey", message: "API key mismatch" });

  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.session_key === session_key
  );
  if (identifyIfUserAlreadyExists) return CheckIfUserRequestIsValid();

  function CheckIfUserRequestIsValid() {
    if (email === "" || full_name === "" || phone_number === "") {
      res.status(401).send({ message: "Please fill the required fields" });
    } else {
      ValidateEmailField();
    }
  }
  function ValidateEmailField() {
    if (regex.test(email) && email.includes(".")) {
      ValidatePasswordField();
    } else {
      console.log("invalid email address");
      res
        .status(401)
        .send({ message: `'${email}' is not a valid email address` });
    }
  }
  function ValidatePasswordField() {
    if (phoneNumberPattern.test(phone_number)) {
      CheckIfProductIDisValid();
    } else {
      console.log("invalid phone number");
      res
        .status(401)
        .send({ message: `'${phone_number}' is not a valid phone number` });
    }
  }
  function CheckIfProductIDisValid() {
    const getProductsData = identifyIfUserAlreadyExists.body;
    const fetchProductFromParamsValue = getProductsData.find(
      (fetchProductFromParamsValue) =>
        fetchProductFromParamsValue.productID === productID
    );
    if (fetchProductFromParamsValue) {
      HandlePurchaseRequest();
    }
    if (!fetchProductFromParamsValue) {
      res.status(404).send({ code: "error", message: "Invalid Product ID" });
    }
  }
  function HandlePurchaseRequest() {
    let dummyData = "";
    const getProductData = identifyIfUserAlreadyExists.body;
    getProductData.map(function (data, index) {
      dummyData = data;
    });
    console.log(dummyData);
    /* Sending an email to the user who has already registered on the platform. */
    const data = {
      from: "hashtag.xyz34@gmail.com",
      to: identifyIfUserAlreadyExists.email,
      subject: "A new Purchase Request",
      text: `You have a new request for ${dummyData.productName} at a price of ${dummyData.productPrice} from ${full_name}, email is ${email} --- contact them now ${phone_number} `,
    };
    mg.messages().send(data, function (error, body) {
      console.log(body);
      if (error) {
        res.status(403).send({
          code: "error",
          message: "Your request couldn't be made. Please try again",
        });
      } else {
        res.status(200).send({
          code: "success",
          message: "Payment Request made Succesfully",
        });
      }
    });
  }
  if (!identifyIfUserAlreadyExists)
    return res.status(401).send({
      error: "Unauthenticated",
      message: "You need to login/signup as a user to purchase this product",
    });
});

app.route("/products/delete/:productID/:session_key").delete((req, res) => {
  const req_apikey = req.headers.apikey;
  const { session_key, productID } = req.params;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "Invalid apikey", message: "API key mismatch" });
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
    const getProductData = identifyIfUserAlreadyExists.body;
    const result = getProductData.find(
      (result) => result.productID === req.params.productID
    );
    if (!result)
      return res.status(404).send({
        code: "not found",
        message: `There is no product with ID of ${productID}`,
      });
    try {
      const updateProductList = getProductData.findIndex(
        (item) => item.productID === productID
      );
      getProductData.splice(updateProductList, 1);
      productstore = getProductData;
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
app.route("/products/:session_key/watch").get((req, res) => {
  const req_apikey = req.headers.apikey;
  const { session_key } = req.params;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "Invalid apikey", message: "API key mismatch" });
  const identifyIfUserAlreadyExists = userdb.find(
    (identifyIfUserAlreadyExists) =>
      identifyIfUserAlreadyExists.session_key === session_key
  );
  if (identifyIfUserAlreadyExists) {
    try {
      CheckIfProductStoreArrayisEmpty();
    } catch (error) {
      res.status(500).send({
        code: "Internal Server Error",
        message:
          "Internal Server Error (500): An unexpected condition was encountered while processing your request. Our team has been notified and is working to resolve the issue. Please try again later.",
      });
    }
  }
  function CheckIfProductStoreArrayisEmpty() {
    if (productstore) {
      res.send(productstore);
    } else {
      res.status(404).send({
        code: "Not-Found",
        message: "No product found on our database",
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
app.route("/products/:session_key/filter/:keyword").get((req, res) => {
  const req_apikey = req.headers.apikey;
  const { keyword } = req.params;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "Invalid apikey", message: "API key mismatch" });
  const filteredArray = productstore.filter((obj) => {
    return Object.values(obj).some((value) => {
      return value.toLowerCase().includes(keyword.toLowerCase());
    });
  });
  if (!filteredArray) {
    return res.status(404).send({
      code: "not found",
      message: `There is no product with name of ${keyword}`,
    });
  }
  if (keyword === "")
    return res.status(400).send({
      message:
        "Invalid key input. - Server doesn't know how to respond to an empty input field",
    });
  res.status(200).send(filteredArray);
});
app.route("/admin/users").get((req, res) => {
  const req_apikey = req.headers.apikey;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "Invalid apikey", message: "API key mismatch" });
  res.send(userdb);
});

app.route("/user/:session_key").post(function (req, res) {
  const req_apikey = req.headers.apikey;
  const { session_key } = req.params;
  if (req_apikey !== server_apikey)
    return res
      .status(400)
      .send({ code: "Invalid apikey", message: "API key mismatch" });
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
