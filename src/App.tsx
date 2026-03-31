// src/App.tsx
import React from "react"
import Chat from "./Chat"
import reactLogo from "./assets/react.svg"
import viteLogo from "./assets/vite.svg"
import heroImg from "./assets/hero.png"
import "./App.css"

function App() {
  return (
    <div className="App" style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f8f9fa" }}>
      
      {/* Hero Section */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "60px 20px",
          background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
          color: "white",
          borderRadius: "0 0 50% 50% / 20%",
          marginBottom: 40,
        }}
      >
        <img
          src={heroImg}
          alt="Hero"
          style={{ width: 200, height: 200, borderRadius: "50%", marginBottom: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
        />
        <h1 style={{ fontSize: "3rem", marginBottom: 10 }}>Sofia Chat</h1>
        <p style={{ fontSize: "1.2rem", maxWidth: 600 }}>
          Chat with Sofia, your playful AI friend 😏💬🎤
        </p>
        <div style={{ marginTop: 20, display: "flex", gap: 20 }}>
          <img src={reactLogo} alt="React" style={{ width: 50 }} />
          <img src={viteLogo} alt="Vite" style={{ width: 50 }} />
        </div>
      </section>

      {/* Chat Section */}
      <section
        style={{
          maxWidth: 700,
          margin: "0 auto 60px auto",
          background: "white",
          padding: 20,
          borderRadius: 15,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Chat />
      </section>

      {/* Docs & Social Section */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto 60px auto",
          display: "flex",
          justifyContent: "space-between",
          gap: 40,
          flexWrap: "wrap",
        }}
      >
        {/* Documentation */}
        <div
          style={{
            flex: 1,
            minWidth: 250,
            background: "white",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <h2>Documentation</h2>
          <p>Explore Vite and React resources:</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: 10 }}>
              <a href="https://vite.dev/" target="_blank" style={{ textDecoration: "none", color: "#2575fc" }}>
                <img src={viteLogo} alt="Vite" style={{ width: 20, marginRight: 8 }} />
                Vite Docs
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank" style={{ textDecoration: "none", color: "#61dafb" }}>
                <img src={reactLogo} alt="React" style={{ width: 20, marginRight: 8 }} />
                React Docs
              </a>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div
          style={{
            flex: 1,
            minWidth: 250,
            background: "white",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <h2>Connect</h2>
          <p>Join the community and stay updated:</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: 8 }}>
              <a href="https://github.com/vitejs/vite" target="_blank" style={{ textDecoration: "none", color: "#333" }}>GitHub</a>
            </li>
            <li style={{ marginBottom: 8 }}>
              <a href="https://chat.vite.dev/" target="_blank" style={{ textDecoration: "none", color: "#333" }}>Discord</a>
            </li>
            <li style={{ marginBottom: 8 }}>
              <a href="https://x.com/vite_js" target="_blank" style={{ textDecoration: "none", color: "#333" }}>X.com</a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank" style={{ textDecoration: "none", color: "#333" }}>Bluesky</a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default App