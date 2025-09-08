import express from "express"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"

const app = express()
const port = 3000

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"]
}))

app.get('/', (req, res) => {
  res.send('Realtime Chat Backend is running')
})

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

io.on("connection", (socket) => {
  let currentUsername = `User-${socket.id.slice(0, 5)}`

  socket.on("chat:join", (username) => {
    if (typeof username === "string" && username.trim().length > 0) {
      currentUsername = username.trim()
    }
    socket.emit("chat:system", { text: `You joined as ${currentUsername}` })
    socket.broadcast.emit("chat:system", { text: `${currentUsername} joined the chat` })
  })

  socket.on("chat:message", (payload) => {
    const text = typeof payload?.text === "string" ? payload.text.trim() : ""
    if (!text) return
    const message = {
      id: `${Date.now()}-${socket.id}`,
      user: currentUsername,
      text,
      ts: Date.now()
    }
    io.emit("chat:message", message)
  })

  socket.on("disconnect", () => {
    io.emit("chat:system", { text: `${currentUsername} left the chat` })
  })
})

httpServer.listen(port, () => {
  console.log(`Realtime chat server listening on http://localhost:${port}`)
})

