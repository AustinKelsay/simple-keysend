import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [host, setHost] = useState("");
  const [cert, setCert] = useState("");
  const [macaroon, setMacaroon] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [wsMessage, setWsMessage] = useState(null); // Store WebSocket messages
  const [wsConnection, setWsConnection] = useState(null); // WebSocket connection

  useEffect(() => {
    // If isConnected is true, create a WebSocket connection
    if (isConnected) {
      const ws = new WebSocket("ws://localhost:3001");

      ws.onopen = () => {
        console.log("WebSocket client connected");
      };

      ws.onmessage = (message) => {
        console.log("Received:", message.data);
        const { host: senderHost, message: senderMessage } = JSON.parse(
          message.data
        );

        // If the sender's host matches the local host, it's a sent message
        if (senderHost === host) {
          console.log("Sent:", senderMessage);
        } else {
          // Else, it's a received message
          setWsMessage({ senderHost, senderMessage });
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
      <form onSubmit={startListening}>
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

      {isConnected && (
        <>
          <h1>Send Payment</h1>
          <form onSubmit={sendPayment}>
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
        </>
      )}
      {/* Display WebSocket messages */}
      {wsMessage && (
        <div className="ws-message">
          <h2>Received Keysend Message:</h2>
          <p>
            From {wsMessage.senderHost}: {wsMessage.senderMessage}
          </p>
        </div>
      )}

      <div className="gif"></div>
    </div>
  );
}

export default App;
