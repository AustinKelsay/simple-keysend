// src/App.js

import { useState } from "react";
import "./App.css";

function App() {
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");

  const sendPayment = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/send/send-payment", {
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
      <div className="gif"></div>
    </div>
  );
}

export default App;
