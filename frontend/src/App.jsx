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
            <p className="alias">{message.alias}</p>
            <p className="message-footer">Host: {message.senderHost}</p>
          </div>
          <div className="message-body">{message.senderMessage}</div>
          <span className="timestamp">{message.timestamp}</span>
        </div>
      ))}
    </div>
  );
}

// App component is the main component of our application
function App() {
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [host, setHost] = useState("");
  const [cert, setCert] = useState("");
  const [macaroon, setMacaroon] = useState("");
  const [myPubKey, setMyPubKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [wsMessages, setWsMessages] = useState([]);
  const [wsConnection, setWsConnection] = useState(null);
  const [alias, setAlias] = useState("");

  // Here, we are setting up a WebSocket connection when the isConnected state changes
  useEffect(() => {
    if (isConnected) {
      setupWebSocket();
    }

    // This function runs when the component is unmounted or before rerunning the effect due to dependency changes
    // Here, it closes the WebSocket connection when the component unmounts
    return () => {
      if (wsConnection?.readyState === WebSocket.OPEN) {
        wsConnection.close();
      }
    };
  }, [isConnected]);

  // This function sets up the WebSocket connection and handles incoming messages
  const setupWebSocket = () => {
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      console.log("WebSocket client connected");
    };

    ws.onmessage = (message) => {
      handleWebSocketMessage(message);
    };

    setWsConnection(ws);
  };

  // This function handles the incoming WebSocket messages
  const handleWebSocketMessage = (message) => {
    console.log("Received:", message.data);
    const {
      senderHost,
      senderPubKey,
      receiverPubKey,
      message: senderMessage,
      timestamp,
      alias,
    } = JSON.parse(message.data);

    if (senderPubKey === myPubKey) {
      console.log("Sent:", senderMessage, "at", timestamp);
    } else if (receiverPubKey === myPubKey) {
      setWsMessages((prevMessages) => [
        ...prevMessages,
        { senderHost, senderMessage, timestamp, senderPubKey, alias },
      ]);
    } else {
      console.log("Ignored message from", senderHost);
    }
  };

  // Function to start listening to the network
  const startListening = async (event) => {
    event.preventDefault();

    const response = await postSetupListenData();

    if (response.ok) {
      const data = await response.json();
      console.log(data);

      setIsConnected(true);
      setAlias(data.alias);
      setMyPubKey(data.pubKey);
    } else {
      console.error("Error:", error);
    }
  };

  // Function to post data and return the response
  const postSetupListenData = () => {
    return fetch("http://localhost:3000/setup-listen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ host, cert, macaroon }),
    });
  };

  // Function to send payments
  const sendPayment = async (event) => {
    event.preventDefault();

    try {
      const response = await postPaymentData();

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Function to post data and return the response
  const postPaymentData = () => {
    return fetch("http://localhost:3000/send-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ host, destination, message }),
    });
  };

  return (
    <div className="App">
      {!isConnected ? (
        <div>
          <h1>Node Setup</h1>
          <NodeSetup
            onSubmit={startListening}
            host={host}
            setHost={setHost}
            cert={cert}
            setCert={setCert}
            macaroon={macaroon}
            setMacaroon={setMacaroon}
          />
        </div>
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
