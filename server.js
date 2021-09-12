const express = require("express");
require("dotenv").config();
const cors = require("cors");
const ftp = require("basic-ftp");
var CryptoJS = require("crypto-js");

const db = require('./db')
db.connect()

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json()); // for parsing application/json
app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// initializes as empty client array
const clients = {};

// loops through clients and removes clients exceeding 300 seconds
const trimClients = () => {
  for (const client in clients) {
    const time = new Date().getTime();
    if (Math.abs(clients[client].lastAccessed - time) > 300000) {
      // if client is older than 300 seconds
      delete clients[client];
    }
  }
};

// starts client trimmer on an interval of 30 seconds
setInterval(trimClients, 30000);

// basic-ftp

app.post("/navigate", (req, res) => {
  async function init() {
    const { cipherText } = req.body;
    var bytes = CryptoJS.AES.decrypt(cipherText, process.env.PASSWORD);
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    const { ftpHost, ftpUser, ftpPassword, ftpSecure, path } = decryptedData;

    // if user is found and already logged in: reuses connection
    if (clients[ftpHost + ftpUser] !== undefined) {
      // if connection status is good: return list
      if (!clients[ftpHost + ftpUser].closed) {
        const list = await clients[ftpHost + ftpUser].list(path);
        clients[ftpHost + ftpUser].lastAccessed = new Date().getTime();
        res.status(200).send(list);
      } else {
        // if connection status is bad: RETRY
        init();
      }
    } else {
      // if no user found OR user found but not connected: creates new connection for user

      const client = new ftp.Client();

      try {
        await client.access({
          host: ftpHost,
          user: ftpUser,
          password: ftpPassword,
          secure: ftpSecure,
        });

        client.lastAccessed = new Date().getTime();

        clients[ftpHost + ftpUser] = client;

        const list = await client.list(path);
        db.update('lazyftp', 'successful_logins')
        res.status(200).send(list);
      } catch (err) {
        db.update('lazyftp', 'failed_logins')
        res.status(400).send(err);
      }
    }
  }

  if (req.body && req.body.cipherText) {
    init();
  } else {
    // Invalid request to server
    db.update('lazyftp', 'invalid_requests')
    res
      .status(400)
      .send("Incorrectly formatted body. Must be stringified JSON.");
  }
});

// removes and disconnects client
app.post("/disconnect", (req, res) => {
  const init = async () => {
    const { cipherText } = req.body;

    var bytes = CryptoJS.AES.decrypt(cipherText, process.env.PASSWORD);
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    const { ftpHost, ftpUser } = decryptedData;

    if (
      clients[ftpHost + ftpUser] !== undefined &&
      !clients[ftpHost + ftpUser].closed
    ) {
      clients[ftpHost + ftpUser].close();
      delete clients[ftpHost + ftpUser];
      res.status(200).send("Successfully closed connection.");
    } else if (clients[ftpHost + ftpUser] === undefined) {
      // if user is not at all logged in
      res.status(204).send("User already disconnected.");
    }
  };

  if (req.body) {
    init();
  } else {
    db.update('lazyftp', 'invalid_requests')
    res
      .status(400)
      .send("Incorrectly formatted body. Must be stringified JSON.");
  }
});

app.listen(
  PORT,
  process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
  () => {
    console.log(
      `Server started in ${process.env.NODE_ENV
      } on port ${PORT}\nBackend: http://localhost:${PORT}/${process.env.NODE_ENV === "development"
        ? "\nFrontend: http://localhost:8000/"
        : null
      }`
    );
  }
);
