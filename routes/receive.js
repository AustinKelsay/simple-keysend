// Import required modules
const express = require("express");
const LndGrpc = require("lnd-grpc");
const dotenv = require("dotenv");

dotenv.config();

// Create a new router
const router = express.Router();

// Create a new instance of the LndGrpc class for the receiving node
const grpcReceiver = new LndGrpc({
  host: process.env.RECEIVER_HOST,
  cert: process.env.RECEIVER_CERT,
  macaroon: process.env.RECEIVER_MACAROON,
});

// Connect to the receiving LND node.
grpcReceiver
  .connect()
  .then(async () => {
    console.log("Connected to the receiving LND node.");

    const { Lightning } = grpcReceiver.services;

    // Subscribe to settled invoices
    const txStream = Lightning.subscribeTransactions({ start_height: 0 });

    // Listen for new settled invoices
    txStream.on("data", (invoice) => {
      console.log("txxxxx", invoice);
      // Check if it's a keysend payment
      if (invoice.custom_records && invoice.custom_records["34349334"]) {
        // Extract the message from the custom records
        const messageBytes = invoice.custom_records["34349334"];
        const message = Buffer.from(messageBytes, "utf8").toString();

        console.log("Received a keysend payment with message:", message);
      }
    });

    txStream.on("error", (error) => console.error("Error:", error));
    txStream.on("end", () => console.log("Invoice stream ended"));
  })
  .catch((error) => {
    console.error("Could not connect to the receiving LND node:", error);
  });

module.exports = router;
