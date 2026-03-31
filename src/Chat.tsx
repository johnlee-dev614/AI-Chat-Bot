import { useState } from "react"
import axios from "axios"

const API_CHAT = "http://localhost:8000/chat"

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")

  const sendMessage = async () => {
    if (!input) return

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: input }])

    try {
      // Call backend
      const res = await axios.get(API_CHAT, { params: { message: input } })
      const reply = res.data.text
      const audioBase64 = res.data.audio

      // Add AI message
      setMessages((prev) => [...prev, { role: "sofia", content: reply }])

      // Play voice
      if (audioBase64) {
        const audioBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))
        const blob = new Blob([audioBytes], { type: "audio/mpeg" })
        const audioUrl = URL.createObjectURL(blob)
        const audio = new Audio(audioUrl)
        audio.play()
      }
    } catch (err) {
      console.error("Error sending message:", err)
    }

    setInput("")
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>Chat with Sofia</h2>
      <div
        style={{
          height: 300,
          overflowY: "auto",
          border: "1px solid gray",
          padding: 8,
          borderRadius: 5,
          marginBottom: 10,
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", margin: "5px 0" }}>
            <b>{m.role === "user" ? "You" : "Sofia"}:</b> {m.content}
          </div>
        ))}
      </div>

      <div style={{ display: "flex" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
        />
        <button onClick={sendMessage} style={{ marginLeft: 10, padding: "10px 15px", borderRadius: 5 }}>
          Send
        </button>
      </div>
    </div>
  )
}