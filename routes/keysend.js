const express = require("express");
const LndGrpc = require("lnd-grpc");
const crypto = require("crypto");

const router = express.Router();

// Store LndGrpc instances for each user
const grpcInstances = {};

module.exports = (wss) => {
  // Setup-listen route: for setting up gRPC connection and start listening for keysends.
  router.post("/setup-listen", async (req, res) => {
    try {
      const { host, cert, macaroon } = req.body;

      // Create a new instance of the LndGrpc class for the user's node
      const grpcReceiver = new LndGrpc({ host, cert, macaroon });

      // Store the instance using the user's host as a key
      grpcInstances[host] = grpcReceiver;

      // Connect to the gRPC server
      await grpcReceiver.connect();

      // Check the connection state
      if (grpcReceiver.state !== "active") {
        return res.status(500).json({
          message: "Connection not stable. Please try again later",
        });
      }

      const { Lightning } = grpcReceiver.services;

      // Get info about the node
      const info = await Lightning.getInfo({});

      // Send a success response with the user's alias
      res.json({
        message: "Successfully started listening for keysends.",
        alias: info.alias,
        pubKey: info.identity_pubkey,
      });
    } catch (error) {
      console.error("Could not connect to the receiving LND node:", error);
      res.status(500).json({ message: "Error connecting to LND node", error });
    }
  });

  // Send-payment route: for sending payment from one node to another
  router.post("/send-payment", async (req, res) => {
    try {
      const { host, destination, message } = req.body;

      const grpc = grpcInstances[host];
      if (!grpc) {
        return res.status(400).json({
          message: "User not initialized. Please call /setup-listen first.",
        });
      }

      const { Lightning } = grpc.services;

      // Get sender's node info to extract public key
      const senderInfo = await Lightning.getInfo({});

      // Define payment amount (in sats)
      const amount = 1100;

      // Create preimage and payment_hash
      const preimage = crypto.randomBytes(32);
      const payment_hash = crypto
        .createHash("sha256")
        .update(preimage)
        .digest();

      // Construct payment request
      const paymentRequest = {
        dest: Buffer.from(destination, "hex"), // Destination public key (hex encoded string converted to Buffer)
        amt: amount, // Amount to send
        payment_hash: payment_hash, // Payment hash (buffer)
        final_cltv_delta: 40, // Final CLTV delta
        dest_custom_records: {
          34349334: Buffer.from(message, "utf8"), // Message to send
          5482373484: preimage,
        },
        timeout_seconds: 60, // Timeout after 60 seconds
        fee_limit: { fixed: 1000 }, // Fee limit
        dest_features: [9], // Add this line
      };

      // Send payment and await response
      const paymentResponse = await Lightning.sendPaymentSync(paymentRequest);

      // Broadcast sent message
      wss.broadcast(
        JSON.stringify({
          senderHost: host,
          senderPubKey: senderInfo.identity_pubkey,
          receiverPubKey: destination,
          alias: senderInfo.alias,
          message,
          timestamp: new Date().toISOString(), // add timestamp here
        })
      );

      // Return only relevant information
      res.json({
        payment_preimage: paymentResponse.payment_preimage.toString("hex"),
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

  return router;
};
