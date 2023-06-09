import { useState, useEffect } from "react";
import "./App.css";

function NodeSetup({
  onSubmit,
  host,
  setHost,
  cert,
  setCert,
  macaroon,
  setMacaroon,
}) {
  return (
    <form className="form-container" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Host"
        value={host}
        onChange={(e) => setHost(e.target.value)}
      />
      <input
        type="text"
        placeholder="Cert"
        value={cert}
        onChange={(e) => setCert(e.target.value)}
      />
      <input
        type="text"
        placeholder="Macaroon"
        value={macaroon}
        onChange={(e) => setMacaroon(e.target.value)}
      />
      <button type="submit">Start Listening</button>
    </form>
  );
}

function PaymentForm({
  onSubmit,
  destination,
  setDestination,
  message,
  setMessage,
}) {
  return (
    <form className="form-container" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <input
        type="text"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button type="submit">Send</button>
    </form>
  );
}

function MessageDisplay({ messages }) {
  return (
    <div className="message-container">
      {messages.map((message, index) => (
        <div key={index} className="message">
          <div className="message-header">
            <span className="alias">{message.alias}</span>
            <div className="message-footer">Host: {message.senderHost}</div>
          </div>
          <div className="message-body">{message.senderMessage}</div>
          <span className="timestamp">{message.timestamp}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [host, setHost] = useState("");
  const [cert, setCert] = useState("");
  const [macaroon, setMacaroon] = useState("");
  const [myPubKey, setMyPubKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [wsMessages, setWsMessages] = useState([]);
  const [wsConnection, setWsConnection] = useState(null); // WebSocket connection
  const [alias, setAlias] = useState(""); // Store the user's alias

  useEffect(() => {
    // If isConnected is true, create a WebSocket connection
    if (isConnected) {
      const ws = new WebSocket("ws://localhost:3001");

      ws.onopen = () => {
        console.log("WebSocket client connected");
      };

      ws.onmessage = (message) => {
        console.log("Received:", message.data);
        const {
          senderHost,
          senderPubKey,
          receiverPubKey,
          message: senderMessage,
          timestamp, // Extract the timestamp
          alias, // Extract the sender's alias
        } = JSON.parse(message.data);

        // If the sender's pubkey matches the local pubkey, it's a sent message
        if (senderPubKey === myPubKey) {
          console.log("Sent:", senderMessage, "at", timestamp);
        } else if (receiverPubKey === myPubKey) {
          // If it's a received message, add it to the array of messages
          setWsMessages((prevMessages) => [
            ...prevMessages,
            { senderHost, senderMessage, timestamp, senderPubKey, alias },
          ]);
        } else {
          // Else, ignore the message
          console.log("Ignored message from", senderHost);
        }
      };

      setWsConnection(ws);

      // Clean up WebSocket connection on component unmount
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [isConnected]);

  const startListening = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/setup-listen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ host, cert, macaroon }),
      });

      const data = await response.json();
      console.log(data);

      // Assuming the server responds with a 200 status code when the connection is successful
      if (response.ok) {
        setIsConnected(true);
        setAlias(data.alias);
        setMyPubKey(data.pubKey); // Set the user's public key
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const sendPayment = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/send-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ host, destination, message }),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="App">
      <h1>Node Setup</h1>
      {!isConnected ? (
        <NodeSetup
          onSubmit={startListening}
          host={host}
          setHost={setHost}
          cert={cert}
          setCert={setCert}
          macaroon={macaroon}
          setMacaroon={setMacaroon}
        />
      ) : (
        <div>
          <h2>Connected as {alias}</h2>
          <h2>Send Payment</h2>
          <PaymentForm
            onSubmit={sendPayment}
            destination={destination}
            setDestination={setDestination}
            message={message}
            setMessage={setMessage}
          />
        </div>
      )}
      <MessageDisplay messages={wsMessages} />
      <div className="gif"></div>
    </div>
  );
}

export default App;
