import React, { useState } from "react";

function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const askGemini = async () => {
    const res = await fetch("http://localhost:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setAnswer(data.response);
  };

  return (
    <div>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Soru sor..."
      />
      <button onClick={askGemini}>Sor</button>
      <p><strong>Cevap:</strong> {answer}</p>
    </div>
  );
}

export default Chat;