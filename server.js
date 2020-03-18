const express = require("express");
require("dotenv").config();
const cors = require("cors");
const ftp = require("basic-ftp");
const CryptoJS = require("crypto-js");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json()); // for parsing application/json
app.use(cors());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// initializes as empty client array
const clients = {};

// basic-ftp

app.post("/navigate", (req, res) => {
  if (req.body && req.body.ciphertext) {
    init();

    async function init() {
      const { ciphertext } = req.body;
      // decrypt data received from frontend
      console.log("Ciphertext:", ciphertext);
      const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.PASSWORD);
      console.log("Bytes:", bytes);

      console.log("CryptoJS keys:", Object.keys(CryptoJS).length);
      console.log("Decrypteddata:", bytes.toString(CryptoJS.enc.Utf8));

      var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      const { ftpHost, ftpUser, ftpPassword, path } = decryptedData;

      // if user is found and logged in
      if (
        clients[ftpUser] !== undefined &&
        clients[ftpUser].status === "connected"
      ) {
        let status;

        // tries to access connection status
        try {
          status = await clients[ftpUser].send("STAT", err => {
            if (err) {
              console.log(err);
            }
          });
        } catch (e) {
          clients[ftpUser].status = "disconnected";
        }

        // if connection status is good: return list
        if (clients[ftpUser].status === "connected") {
          const list = await clients[ftpUser].list(path);
          res.status(200).send(list);
        } else {
          // if connection status is bad: RETRY
          init();
        }
      } else {
        // if no user found OR user found but not connected: reconnects
        const client = new ftp.Client();
        // console.log(`Creating new connection for: ${ftpUser}`);
        try {
          await client.access({
            host: ftpHost,
            user: ftpUser,
            password: ftpPassword
          });

          clients[ftpUser] = client;
          clients[ftpUser].status = "connected";

          const list = await client.list(path);
          res.status(200).send(list);
        } catch (err) {
          console.log("Failed to connect to server", err);
          res.status(400).send("Failed to connect to server");
        }
      }
    }
  } else {
    res.status(400).send("Unauthorized access.");
  }
});

// removes and disconnects client
app.post("/disconnect", (req, res) => {
  if (req.body && req.body.ciphertext) {
  } else {
    res.status(400).send("Unauthorized access.");
  }

  const init = async () => {
    const { ciphertext } = req.body;

    // decrypt data received from frontend
    const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.PASSWORD);

    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    const { ftpUser } = decryptedData;

    if (
      clients[ftpUser] !== undefined &&
      clients[ftpUser].status === "connected"
    ) {
      clients[ftpUser].close();
      delete clients[ftpUser];
      res.status(200).send("Successfully logged out");
    } else if (clients[ftpUser] === undefined) {
      // if user is not at all logged in
      res.status(204).send("User already disconnected");
    }
  };

  init();
});

app.listen(
  PORT,
  process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost",
  () => {
    if (process.env.NODE_ENV === "production") {
      console.log(`Server started in production. Port: ${PORT}`);
    } else {
      console.log(`Server started in ${process.env.NODE_ENV} on port ${PORT}`);
    }
  }
);
