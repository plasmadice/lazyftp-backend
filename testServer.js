var CryptoJS = require("crypto-js");
require("dotenv").config();
const pass = process.env.PASSWORD;
var data = [{ id: 1 }, { id: 2 }];

// Encrypt
var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), pass).toString();

// Decrypt
var bytes = CryptoJS.AES.decrypt(ciphertext, pass);
var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

console.log(decryptedData); // [{id: 1}, {id: 2}]
