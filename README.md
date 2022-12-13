# Shopercase Node.js API

![GitHub Repo stars](https://img.shields.io/github/stars/creative-tutorials/shopercase-backend?style=flat-square)
![GitHub branch checks state](https://img.shields.io/github/checks-status/creative-tutorials/shopercase-backend/master?color=blue&style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/creative-tutorials/shopercase-backend?color=blue&style=flat-square)

</div>

The Shopercase Node.js API that handles all of the functionality of the Shopercase application.

## Documentation.

For more information about our app see the [`Shopercase Documentation`](https://github.com/creative-tutorials/shopercase)

## Requirements

Node.js 14 or higher

## Installation

Install all dependencies:

```bash
yarn add
```

## Run the application

Now run the application

```bash
yarn serve
# This will run the server on port 5000
```

## Usage

The following command is used to test the application to see if it works or not

```javascript
import express, { json, urlencoded } from "express";
const PORT = process.env.PORT || 5000; // if you have an environment variable saved on your local machine then the application would look for the env file and run the first port instead
const app = express();
app.use(json());
app.route("/").get(function (req, res) {
  res.send("✅Server is running live");
});
app.listen(PORT, () => {
  console.log(`Server started on PORT: ${PORT}`);
});
```

## Configure the Env file

Here is a simple step to configure the env file to work for the application

```javascript
import * as dotenv from "dotenv";
dotenv.config();
```
For this to work properly you must first install the dotenv dependency.

## Install the dependency
Here's a simple guide on how to install the dotenv dependency

```bash
yarn add dotenv
# or
npm install dotenv
```
## Support
We will release new bug fixes and features to keep the app up-to-date. If you have any issues with the app please kindly [see the issue tracker](https://github.com/creative-tutorials/shopercase/issues)

