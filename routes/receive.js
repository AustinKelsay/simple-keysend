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

            console.log("Received a keysend payment with message:", message);
            break;
          }
        }
      }
    });

    invoiceStream.on("error", (error) => console.error("Error:", error));
    invoiceStream.on("end", () => console.log("Invoice stream ended"));
  })
  .catch((error) => {
    console.error("Could not connect to the receiving LND node:", error);
  });

module.exports = router;
