// Import required modules
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Import the routes
const keysendRoute = require("./routes/keysend");

// Load environment variables from .env file into process.env
dotenv.config();

// Instantiate the Express application
const app = express();

// Enable JSON body parsing for incoming requests
app.use(express.json());

app.use(cors());

// Add route
app.use("/", keysendRoute);

// Define server port, either from environment variable or default to 3000
const port = process.env.PORT || 3000;

// Start the Express server
app.listen(port, () => console.log(`Server listening on port ${port}!`));
