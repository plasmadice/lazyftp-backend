# Usage

`npm i` to install all needed dependancies
`npm run start` to start the server

# Encryption Details

Encrypted data is sent from the frontend to this server where it is decrypted using a key.
Official URL: https://lazyanime.com/

## Details:

-Uses a version of crypto-js to encrypt data as it's sent out, and decrypt it on the server side.
-Only data stored is user's FTP client connection info (which is removed if you hit "Disconnect" or are timed out and attempt to connect.

## Tech:

-Backend - Node.js hosted on Heroku (Free dyno tier so after extended periods of time the server goes down. Attempts to connect to it will spin it back up. Takes ~10 seconds) - https://github.com/plasmadice/lazyanime-backend

## Plans:

-Launch VLC on click - Currently pretty easy to do using node.js, but on the frontend it's a different matter. This stackoverflow page provides some info on how that works if anyone is interested.
-VLC playlist - after VLC implementation, queuing up anime would be somewhat trivial
-Download to computer - I don't think this is that difficult to implement. But every time I think about it I want to make a desktop app variant using Electron or something. So that's on the backburner.
