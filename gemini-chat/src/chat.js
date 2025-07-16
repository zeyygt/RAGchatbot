import React, { useState, useEffect } from "react";
import {
  MdDarkMode,
  MdLightMode,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdMenu,
} from "react-icons/md";

function Chat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [activeChatIdx, setActiveChatIdx] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size and set mobile state
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowSidebar(false); // Hide sidebar on mobile by default
      } else {
        setShowSidebar(true); // Show sidebar on desktop by default
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Yeni sohbet başlat
  const startNewChat = () => {
    setRecentChats([
      ...recentChats,
      { messages: [], title: `Chat ${recentChats.length + 1}` },
    ]);
    setActiveChatIdx(recentChats.length);
    setMessages([]);
    setQuestion("");
  };

  // Aktif sohbeti değiştir
  const selectChat = (idx) => {
    setActiveChatIdx(idx);
    setMessages(recentChats[idx].messages);
    setQuestion("");
  };

  const askQuestion = async () => {
    const newMessages = [...messages, { role: "user", content: question }];
    const res = await fetch("http://localhost:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, messages: newMessages }),
    });
    const data = await res.json();
    // Bot cevabını da geçmişe ekle
    const updatedMessages = [
      ...newMessages,
      { role: "assistant", content: data.response },
    ];
    setMessages(updatedMessages);
    setQuestion("");
    // Recent chat'i güncelle
    const updatedChats = [...recentChats];
    updatedChats[activeChatIdx] = {
      ...updatedChats[activeChatIdx],
      messages: updatedMessages,
      title:
        updatedMessages.find((m) => m.role === "user")?.content?.slice(0, 20) ||
        `Chat ${activeChatIdx + 1}`,
    };
    setRecentChats(updatedChats);
  };

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
        display: "flex",
        height: "100vh",
        background: theme.bg,
        color: theme.fg,
        fontFamily: "sans-serif",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Mobile overlay when sidebar is open */}
      {isMobile && showSidebar && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 9,
          }}
          onClick={() => setShowSidebar(false)}
        />
      )}

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

      {/* Sol Menü: Recent Chats */}
      <div
        style={{
          width: showSidebar ? "240px" : "0",
          background: theme.sidebarBg,
          borderRight: `1px solid ${darkMode ? "#333" : "#ccc"}`,
          position: isMobile ? "fixed" : "relative",
          top: isMobile ? 0 : "auto",
          left: isMobile ? 0 : "auto",
          height: isMobile ? "100vh" : "auto",
          zIndex: isMobile ? 10 : "auto",
          transition: "width 0.3s ease-in-out",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Content wrapper with fixed width */}
        <div
          style={{
            width: "100%", // Fill parent container
            minWidth: "240px", // Minimum width to prevent squishing
            paddingLeft: "16px",
            paddingRight: "16px",
            overflow: "hidden", // Prevent content overflow
            transform: "translateZ(0)", // Hardware acceleration
            position: "relative",
            boxSizing: "border-box", // Include padding in width calculation
          }}
        >
          {/* Sidebar aç/kapa okunu buraya taşıdık */}
          <div
            style={{
              position: "absolute",
              top: 28,
              right: 5,
              zIndex: 10,
            }}
          >
            <button
              onClick={() => setShowSidebar(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                zIndex: 10,
                fontSize: "2rem",
                display: "flex",
                alignItems: "center",
              }}
              title="Hide Chats"
            >
              {isMobile ? (
                <MdClose style={{ color: darkMode ? "#fff" : "#000" }} />
              ) : (
                <MdChevronLeft style={{ color: darkMode ? "#fff" : "#000" }} />
              )}
            </button>
          </div>
          <h3 style={{ marginBottom: "1rem", color: theme.accent }}>
            Recent Chats
          </h3>
          <button
            onClick={startNewChat}
            style={{
              width: "full",
              padding: "0.5rem",
              marginBottom: "1rem",
              background: theme.botMsgBg,
              color: theme.accent,
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            + New Chat
          </button>
          {recentChats.length === 0 && (
            <p style={{ color: darkMode ? "#888" : "#666" }}>No chats yet.</p>
          )}
          <ul style={{ listStyle: "none", padding: 0 }}>
            {recentChats.map((chat, idx) => (
              <li key={idx}>
                <button
                  onClick={() => selectChat(idx)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "0.5rem",
                    marginBottom: "0.5rem",
                    background:
                      idx === activeChatIdx ? theme.accent : theme.botMsgBg,
                    color:
                      idx === activeChatIdx ? theme.sidebarBg : theme.accent,
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {chat.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sol üstte sidebar açma okunu sadece kapalıyken göster */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 12,
          zIndex: 10,
          opacity: showSidebar ? 0 : 1,
          transition: "opacity 0.3s ease-in-out",
          pointerEvents: showSidebar ? "none" : "auto",
        }}
      >
        <button
          onClick={() => setShowSidebar(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "2rem",
            display: "flex",
            alignItems: "center",
          }}
          title="Show Chats"
        >
          {isMobile ? (
            <MdMenu style={{ color: darkMode ? "#fff" : "#000" }} />
          ) : (
            <MdChevronRight style={{ color: darkMode ? "#fff" : "#000" }} />
          )}
        </button>
      </div>

      {/* Sağ: Chat Alanı */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          justifyContent: "flex-start",
          padding: isMobile ? "1rem" : "2rem",
          marginTop: isMobile ? "4rem" : "0",
          marginLeft: isMobile && showSidebar ? 0 : 0, // No margin shift on mobile
        }}
      >
        <div
          style={{
            width: "70%",
            maxWidth: "800px",
            background: theme.botMsgBg,
            borderRadius: "12px",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            paddingTop: "2rem",
            minHeight: "60vh",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: darkMode ? "0 2px 16px #0002" : "0 2px 16px #ccc2",
          }}
        >
          {/* Sohbet geçmişi */}
          <div style={{ marginTop: "2rem" }}>
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
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    background:
                      msg.role === "user" ? theme.userMsgBg : theme.botMsgBg,
                    color:
                      msg.role === "user" ? theme.userMsgFg : theme.botMsgFg,
                    padding: "0.75rem 1.2rem",
                    borderRadius: "18px",
                    maxWidth: "70%",
                    boxShadow:
                      msg.role === "user"
                        ? darkMode
                          ? "0 1px 6px #0001"
                          : "0 1px 6px #ccc1"
                        : "none",
                  }}
                >
                  <strong style={{ fontSize: "0.9em" }}>
                    {msg.role === "user" ? "User" : "Chatbot"}
                  </strong>
                  <br />
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          {/* Soru sorma alanı */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              alignItems: "center",
              position: "sticky",
              paddingBottom: "3rem",
              bottom: 0,
              background: theme.botMsgBg,
              padding: "1rem",
              borderRadius: "12px",
            }}
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
              }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") askQuestion();
              }}
            />
            <button
              onClick={askQuestion}
              style={{
                padding: "0.75rem 1.5rem",
                background: theme.btnBg,
                color: theme.btnFg,
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
