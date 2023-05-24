// Import required modules
const express = require("express");
const LndGrpc = require("lnd-grpc");
const dotenv = require("dotenv");

// Load environment variables from .env file into process.env
dotenv.config();

// Instantiate the Express application
const app = express();

// Create a new instance of the LndGrpc class, using the environment variables for the configuration
const grpc = new LndGrpc({
  host: process.env.HOST,
  cert: process.env.CERT,
  macaroon: process.env.MACAROON,
});

// Attempt to connect to the LND node.
grpc
  .connect()
  .then(() => {
    // Log success message to the console if the connection is successful
    console.log("Connected to the LND node.");
  })
  .catch((error) => {
    // Log error message to the console if the connection fails
    console.error("Could not connect to the LND node:", error);
  });

// Enable JSON body parsing for incoming requests
app.use(express.json());

// Define POST endpoint for sending payment
app.post("/send-payment", async (req, res) => {
  try {
    // Destructure Lightning service from grpc
    const { Lightning } = grpc.services;

    // Destructure destination and message from the request body
    const { destination, message } = req.body;

    // Convert message into buffer
    const messageBytes = Buffer.from(message, "utf8");

    // Define payment amount (in sats)
    const amount = 1000;

    // Construct payment request
    const paymentRequest = {
      dest: Buffer.from(destination, "hex"), // Destination public key
      amt: amount, // Amount to send
      final_cltv_delta: 40, // Final CLTV delta
      dest_custom_records: {
        34349334: messageBytes, // Message to send
      },
      payment_request: "", // Empty payment request (not used in keysend)
      timeout_seconds: 60, // Timeout after 60 seconds
      fee_limit_sat: 1000, // Fee limit
    };

    // Send payment and await response
    const paymentResponse = await Lightning.sendPaymentV2(paymentRequest);

    // Return payment response
    res.json(paymentResponse);
  } catch (error) {
    // Catch and log any errors, return 500 status code
    res
      .status(500)
      .json({ error: "An error occurred while sending the payment." });
    console.error("An error occurred:", error);
  }
});

// Define server port, either from environment variable or default to 3000
const port = process.env.PORT || 3000;

// Start the Express server
app.listen(port, () => console.log(`Server listening on port ${port}!`));
