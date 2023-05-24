// Import required modules
const express = require("express");
const dotenv = require("dotenv");
// Import the routes
const sendRoute = require("./routes/send");
const receiveRoute = require("./routes/receive");

// Load environment variables from .env file into process.env
dotenv.config();

// Instantiate the Express application
const app = express();

// Enable JSON body parsing for incoming requests
app.use(express.json());

// Add routes
app.use("/send", sendRoute);
app.use("/receive", receiveRoute);

// Define server port, either from environment variable or default to 3000
const port = process.env.PORT || 3000;

// Start the Express server
app.listen(port, () => console.log(`Server listening on port ${port}!`));
