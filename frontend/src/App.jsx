import { useState } from "react";
import "./App.css";

function App() {
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [host, setHost] = useState("");
  const [cert, setCert] = useState("");
  const [macaroon, setMacaroon] = useState("");
  const [isConnected, setIsConnected] = useState(false); // New state variable

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
        body: JSON.stringify({ destination, message }),
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
      <div className="gif"></div>
    </div>
  );
}

export default App;
