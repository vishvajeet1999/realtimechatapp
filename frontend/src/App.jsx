import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [joined, setJoined] = useState(false)
  const [connected, setConnected] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!socketRef.current) {
      const socket = io('http://localhost:3000')
      socketRef.current = socket

      socket.on('connect', () => setConnected(true))
      socket.on('disconnect', () => setConnected(false))

      socket.on('chat:system', (payload) => {
        setMessages((prev) => [
          ...prev,
          { id: `sys-${Date.now()}`, system: true, text: payload?.text ?? '' }
        ])
      })

      socket.on('chat:message', (message) => {
        setMessages((prev) => [...prev, message])
      })
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleJoin(e) {
    e.preventDefault()
    const name = username.trim()
    if (!name || !socketRef.current) return
    socketRef.current.emit('chat:join', name)
    setJoined(true)
  }

  function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !socketRef.current) return
    socketRef.current.emit('chat:message', { text })
    setInput('')
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="brand">
          <span className="logo" aria-hidden>💬</span>
          <h1 className="title">Realtime Chat</h1>
        </div>
        <div className="header-meta">
          {joined ? <span className="user">You: {username}</span> : <span className="user muted">Not joined</span>}
          <span className={connected ? 'status online' : 'status offline'}>
            <span className={connected ? 'dot pulse' : 'dot'} />
            {connected ? 'Online' : 'Offline'}
          </span>
        </div>
      </header>

      {!joined ? (
        <form className="join-form" onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Enter a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit" disabled={!username.trim() || !connected}>Join</button>
        </form>
      ) : (
        <>
          <div className="messages" role="log" aria-live="polite">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.system
                    ? 'message system'
                    : m.user === username
                    ? 'message own'
                    : 'message'
                }
              >
                {m.system ? (
                  <span className="meta">{m.text}</span>
                ) : (
                  <>
                    <span className="meta">{m.user}</span>
                    <span className="text">{m.text}</span>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="composer" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim()}>Send</button>
          </form>
        </>
      )}

      <footer className="chat-footer">
        <span className="footer-text">Built with React and Socket.IO</span>
        <span className="footer-right">© {new Date().getFullYear()} RealtimeChat</span>
      </footer>
    </div>
  )
}

export default App
