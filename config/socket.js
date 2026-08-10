const { Server } = require("socket.io")

let io

function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST", "PATCH", "DELETE"]
        }
    })

    io.on("connection", (socket) => {
        console.log("Socket Connected:", socket.id)

        socket.on("joinGameRoom", (gameId) => {
            socket.join(gameId.toString())

            console.log(
                `Socket ${socket.id} joined game room ${gameId}`
            )
        })

        socket.on("disconnect", () => {
            console.log("Socket Disconnected:", socket.id)
        })
    })

    return io
}

function getIO() {
    if (!io) {
        throw new Error("Socket.IO has not been initialized")
    }

    return io
}

module.exports = {
    initializeSocket,
    getIO
}