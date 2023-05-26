// Import required modules
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const WebSocket = require("ws");

// Load environment variables from .env file into process.env
dotenv.config();

// Instantiate the Express application
const app = express();

// Enable JSON body parsing for incoming requests
app.use(express.json());

app.use(cors());

// Define server port, either from environment variable or default to 3000
const port = process.env.PORT || 3000;

// Initialize a WebSocket Server on a different port (e.g. 3001)
const wss = new WebSocket.Server({ port: 3001 });

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// Import the routes
const keysendRoute = require("./routes/keysend")(wss); // Pass WebSocket Server instance to keysendRoute

// Add route
app.use("/", keysendRoute);

// Start the Express server
app.listen(port, () => console.log(`Server listening on port ${port}!`));
