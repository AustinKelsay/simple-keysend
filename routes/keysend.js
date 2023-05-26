const express = require("express");
const LndGrpc = require("lnd-grpc");
const crypto = require("crypto");

const router = express.Router();

// Store LndGrpc instances for each user
const grpcInstances = {};

module.exports = (wss) => {
  router.post("/setup-listen", (req, res) => {
    const { host, cert, macaroon } = req.body;

    // Create a new instance of the LndGrpc class for the user's node
    const grpcReceiver = new LndGrpc({ host, cert, macaroon });

    // Store the instance using the user's id as a key
    grpcInstances[host] = grpcReceiver;

    grpcReceiver
      .connect()
      .then(async () => {
        const { Lightning } = grpcReceiver.services;
        const invoiceStream = Lightning.subscribeInvoices({});

        // Listen for new settled invoices
        invoiceStream.on("data", (invoice) => {
          // Make sure that htlcs are defined
          if (invoice.htlcs && invoice.htlcs.length > 0) {
            const customRecords = invoice.htlcs[0].custom_records;

            // Find the key that matches the recordKey from the sender
            for (const key in customRecords) {
              const keyBuffer = Buffer.from(key, "binary");
              const keyInt = keyBuffer.readUInt32LE();
              if (keyInt === 34349334) {
                // Extract the message from the custom records
                const messageBytes = customRecords[key];
                const message = Buffer.from(messageBytes).toString("utf8");

                // Send the message to all connected WebSocket clients
                // Attach the host along with the message
                wss.broadcast(JSON.stringify({ host, message }));
                break;
              }
            }
          }
        });

        invoiceStream.on("error", (error) => console.error("Error:", error));
        invoiceStream.on("end", () => console.log("Invoice stream ended"));

        // Send a success response
        res.json({ message: "Successfully started listening for keysends." });
      })
      .catch((error) => {
        console.error("Could not connect to the receiving LND node:", error);
        res
          .status(500)
          .json({ message: "Error connecting to LND node", error });
      });
  });

  router.post("/send-payment", async (req, res) => {
    try {
      // Start of try block
      const { host, destination, message } = req.body;

      // Retrieve the user's grpc instance
      const grpc = grpcInstances[host];
      if (!grpc) {
        return res.status(400).json({
          message: "User not initialized. Please call /setup-listen first.",
        });
      }

      const { Lightning } = grpc.services;

      // Convert message into buffer
      const messageBytes = Buffer.from(message, "utf8");

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
          34349334: messageBytes, // Message to send
          5482373484: preimage,
        },
        timeout_seconds: 60, // Timeout after 60 seconds
        fee_limit: { fixed: 1000 }, // Fee limit
        dest_features: [9], // Add this line
      };

      // Send payment and await response
      const paymentResponse = await Lightning.sendPaymentSync(paymentRequest);

      // Broadcast sent message
      wss.broadcast(JSON.stringify({ host, message }));

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
