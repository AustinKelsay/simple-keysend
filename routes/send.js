// Import required modules
const express = require("express");
const LndGrpc = require("lnd-grpc");
const dotenv = require("dotenv");

dotenv.config();

// Create a new router
const router = express.Router();

// Create a new instance of the LndGrpc class for the sending node
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

// Define POST endpoint for sending payment
router.post("/send-payment", async (req, res) => {
  try {
    // Destructure Lightning service from grpc
    const { Router } = grpc.services;

    // Destructure destination and message from the request body
    const { destination, message } = req.body;

    // Convert message into buffer
    const messageBytes = Buffer.from(message, "utf8");

    // Define payment amount (in sats)
    const amount = 1000;

    // Create a random payment hash
    const payment_hash = Buffer.from(
      [...Array(32)].map(() => Math.floor(Math.random() * 256))
    );

    // Construct payment request
    const paymentRequest = {
      dest: Buffer.from(destination, "hex"), // Destination public key
      amt: amount, // Amount to send
      payment_hash: payment_hash, // Payment hash
      final_cltv_delta: 40, // Final CLTV delta
      dest_custom_records: {
        34349334: messageBytes, // Message to send
      },
      payment_request: "", // Empty payment request (not used in keysend)
      timeout_seconds: 60, // Timeout after 60 seconds
      fee_limit_sat: 1000, // Fee limit
    };

    // Send payment and await response
    const paymentResponse = await Router.sendPaymentV2(paymentRequest);

    // Return payment response
    res.json({
      payment_preimage: paymentResponse.payment_preimage,
      payment_route: paymentResponse.payment_route,
    });
  } catch (error) {
    // Catch and log any errors, return 500 status code
    res
      .status(500)
      .json({ error: "An error occurred while sending the payment." });
    console.error("An error occurred:", error);
  }
});

module.exports = router;
