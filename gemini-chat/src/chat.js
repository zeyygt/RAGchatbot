import React, { useState, useRef, useEffect } from "react";
import { MdDarkMode, MdLightMode, MdSend } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { FaRobot } from "react-icons/fa6";

// Bot cevabını paragraflara ayıran ve temel formatlamaları destekleyen render fonksiyonu
function renderBotContent(content) {
  if (!content) return null;
  // Satırları ayır
  const lines = content.split(/\n+/);
  return (
    <>
      {lines.map((line, idx) => {
        // Madde işaretiyle başlıyorsa (başında * veya - varsa)
        if (/^\s*[*-]/.test(line)) {
          // Remove bullet, leading/trailing spaces, and replace trailing colon with comma
          let itemText = line.replace(/^\s*[*-]\s*/, "").replace(/\s*:\s*$/, ",").trim();
          return (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "0.5em", justifyContent: "flex-start", paddingLeft: "2em", width: "100%" }}>
              <span style={{ color: "#b2f7ef", fontWeight: "bold", marginRight: 8, fontSize: "1.2em", marginTop: 2, minWidth: "1.2em", textAlign: "left" }}>•</span>
              <span style={{ wordBreak: "break-word", textAlign: "left", display: "block", width: "100%" }}>{formatInline(itemText)}</span>
            </div>
          );
        }
        // Normal satır
        return <p key={idx} style={{ margin: 0, marginBottom: "0.7em", wordBreak: "break-word", textAlign: "left" }}>{formatInline(line)}</p>;
      })}
    </>
  );
}

// Temel inline formatlama: link, kalın (**text**), italik (*text*)
function formatInline(text) {
  // Link: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  // Kalın: **text**
  const boldRegex = /\*\*([^*]+)\*\*/g;
  // İtalik: *text*
  const italicRegex = /\*([^*]+)\*/g;

  let parts = [];
  let lastIdx = 0;
  let match;
  // Linkleri bul
  while ((match = linkRegex.exec(text))) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    parts.push(<a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" style={{ color: "#4fc3f7", textDecoration: "underline" }}>{match[1]}</a>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) text = text.slice(lastIdx);
  else text = "";

  // Kalın ve italik için sırayla uygula
  let boldParts = [];
  lastIdx = 0;
  while ((match = boldRegex.exec(text))) {
    if (match.index > lastIdx) boldParts.push(text.slice(lastIdx, match.index));
    boldParts.push(<strong key={"b"+match.index}>{match[1]}</strong>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) text = text.slice(lastIdx);
  else text = "";

  let italicParts = [];
  lastIdx = 0;
  while ((match = italicRegex.exec(text))) {
    if (match.index > lastIdx) italicParts.push(text.slice(lastIdx, match.index));
    italicParts.push(<em key={"i"+match.index}>{match[1]}</em>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) italicParts.push(text.slice(lastIdx));

  // Parçaları birleştir
  if (parts.length > 0) {
    return <>{parts}</>;
  } else if (boldParts.length > 0) {
    return <>{boldParts}</>;
  } else if (italicParts.length > 0) {
    return <>{italicParts}</>;
  } else {
    return text;
  }
}

function Chat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  // Sadece tek sohbet tutulacak, recentChats ve sidebar kaldırıldı

  const [darkMode, setDarkMode] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const askQuestion = async () => {
    if (!question.trim()) return;
    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setIsTyping(true);
    setQuestion("");

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, messages: newMessages }),
      });

      // Check if it's a streaming response
      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("text/event-stream")) {
        // Handle streaming response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        // Add empty assistant message immediately when streaming starts
        const assistantMessageIndex = newMessages.length;
        setMessages([...newMessages, { role: "assistant", content: "" }]);
        setIsTyping(false);

        const processChunk = (content) => {
          console.log("Processing chunk:", JSON.stringify(content)); // Better debug log
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const currentContent =
              updatedMessages[assistantMessageIndex]?.content || "";
            const newContent = currentContent + content;
            updatedMessages[assistantMessageIndex] = {
              role: "assistant",
              content: newContent,
            };
            console.log("Updated message content:", JSON.stringify(newContent)); // Debug log
            return updatedMessages;
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log(
                  "Received data type:",
                  data.type,
                  "content:",
                  JSON.stringify(data.content)
                ); // Debug log

                if (data.type === "chunk" && data.content) {
                  processChunk(data.content);
                }

                if (data.type === "end") {
                  console.log("Stream ended");
                }

                if (data.type === "error") {
                  console.error("Stream error:", data.message);
                  setIsTyping(false);
                }
              } catch (e) {
                console.log("Parse error:", e, "Line:", line);
              }
            }
          }
        }
      } else {
        // Handle regular JSON response (FAISS results)
        const data = await res.json();
        const updatedMessages = [
          ...newMessages,
          { role: "assistant", content: data.response },
        ];
        setMessages(updatedMessages);
        setIsTyping(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setIsTyping(false);
    }
  };

  // Mesajlar güncellendiğinde otomatik scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Tema renkleri
  const theme = darkMode
    ? {
        bg: "#181818",
        fg: "#eee",
        sidebarBg: "#222",
        accent: "#b2f7ef",
        inputBg: "#181818",
        userMsgBg: "#14532d",
        userMsgFg: "#fff",
        botMsgBg: "#333",
        botMsgFg: "#b2f7ef",
        btnBg: "#14532d",
        btnFg: "#fff",
      }
    : {
        bg: "#f7f7f7",
        fg: "#222",
        sidebarBg: "#e3e3e3",
        accent: "#14532d",
        inputBg: "#fff",
        userMsgBg: "#b2f7ef",
        userMsgFg: "#222",
        botMsgBg: "#e3e3e3",
        botMsgFg: "#14532d",
        btnBg: "#b2f7ef",
        btnFg: "#222",
      };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.fg,
        fontFamily: "sans-serif",
        transition: "background 0.3s, color 0.3s",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Sağ üstte dark/light mode ikonu */}
      <div style={{ position: "absolute", top: 24, right: 32, zIndex: 10 }}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "2rem",
            display: "flex",
            alignItems: "center",
          }}
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? (
            <MdLightMode style={{ color: "#fff" }} />
          ) : (
            <MdDarkMode style={{ color: "#000" }} />
          )}
        </button>
      </div>
      {/* Chat Başlığı */}
      <div
        style={{
          textAlign: "center",
          marginTop: "5rem",
          marginBottom: "0.5rem",
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            fontSize: "2rem",
            letterSpacing: "-1px",
            color: theme.accent,
            margin: 0,
          }}
        >
          UME Chatbot
        </h2>
      </div>
      {/* Chat Alanı */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            background: theme.botMsgBg,
            borderRadius: "12px",
            padding: "2rem",
            minHeight: "60vh",
            boxShadow: darkMode ? "0 2px 16px #0002" : "0 2px 16px #ccc2",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sohbet geçmişi */}
          <div
            style={{
              marginTop: "2rem",
              flex: 1,
              overflowY: "auto",
              maxHeight: "50vh",
              paddingRight: "24px",
            }}
            className="chat-scroll-area"
          >
            {messages.length === 0 && (
              <p style={{ color: darkMode ? "#888" : "#666" }}>
                Henüz mesaj yok.
              </p>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  paddingRight: msg.role === "user" ? 0 : 0,
                }}
              >
                {msg.role === "assistant" && (
                  <span
                    style={{
                      marginRight: 8,
                      fontSize: "1.7rem",
                      color: theme.accent,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FaRobot />
                  </span>
                )}
                <div
                  style={{
                    background:
                      msg.role === "user" ? theme.userMsgBg : theme.botMsgBg,
                    color:
                      msg.role === "user" ? theme.userMsgFg : theme.botMsgFg,
                    padding: "0.75rem 1.2rem",
                    borderRadius: "18px",
                    maxWidth: "70%",
                    boxShadow: darkMode ? "0 1px 6px #0001" : "0 1px 6px #ccc1",
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                    textAlign: "left"
                  }}
                >
                  {msg.role === "assistant"
                    ? renderBotContent(msg.content)
                    : msg.content}
                </div>
                {msg.role === "user" && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: "1.7rem",
                      color: theme.accent,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FaUserCircle />
                  </span>
                )}
              </div>
            ))}
            {/* Typing animasyonu */}
            {isTyping && (
              <div
                style={{
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <span
                  style={{
                    marginRight: 8,
                    fontSize: "1.7rem",
                    color: theme.accent,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FaRobot />
                </span>
                <div
                  style={{
                    background: theme.botMsgBg,
                    color: theme.botMsgFg,
                    padding: "0.75rem 1.2rem",
                    borderRadius: "18px",
                    maxWidth: "70%",
                    fontStyle: "italic",
                    opacity: 0.7,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span>
                    Chatbot is typing
                    <span
                      className="typing-dots"
                      style={{ display: "inline-block", marginLeft: 2 }}
                    >
                      <span style={{ animation: "blink 1s infinite" }}>.</span>
                      <span style={{ animation: "blink 1s 0.2s infinite" }}>
                        .
                      </span>
                      <span style={{ animation: "blink 1s 0.4s infinite" }}>
                        .
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Soru sorma alanı */}
          <div
            style={{ marginTop: "2rem", display: "flex", alignItems: "center" }}
          >
            <input
              style={{
                padding: "0.75rem",
                width: "100%",
                borderRadius: "8px",
                border: "none",
                background: theme.inputBg,
                color: theme.accent,
                marginRight: "1rem",
                fontSize: "1.1rem",
              }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Herhangi bir şey sor"
              onKeyDown={(e) => {
                if (e.key === "Enter") askQuestion();
              }}
              disabled={isTyping}
            />
            <button
              onClick={askQuestion}
              disabled={isTyping || !question.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                background: theme.btnBg,
                color: theme.btnFg,
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor:
                  isTyping || !question.trim() ? "not-allowed" : "pointer",
                fontSize: "1.3rem",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MdSend style={{ marginRight: 4 }} />
              Gönder
            </button>
          </div>
        </div>
      </div>
      {/* Typing dots ve custom scrollbar için style */}
      <style>{`
        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
        .chat-scroll-area {
          scrollbar-width: thin;
          scrollbar-color: #bbb #222;
        }
        .chat-scroll-area::-webkit-scrollbar {
          width: 8px;
        }
        .chat-scroll-area::-webkit-scrollbar-thumb {
          background: #bbb;
          border-radius: 8px;
        }
        .chat-scroll-area::-webkit-scrollbar-track {
          background: #222;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

export default Chat;