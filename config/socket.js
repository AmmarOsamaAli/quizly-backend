const { Server } = require("socket.io")
const { jwt, decode } = require('jsonwebtoken')
const Game = require("../models/Game")
const Participant = require("../models/Participant")

let io

function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST", "PATCH", "DELETE"]
        }
    })

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token

            if (!token) {
                return next(new Error("Authentication Required"))
            }

            const decoded = jwt.verify(
                token, process.env.JWT_SECRET
            )

            socket.user = decoded

            next()

        } catch (error) {
            next(new Error("Invalid or expired token"))
        }
    })

    io.on("connection", (socket) => {
        console.log(`Socket Connected: ${socket.id} | User: ${socket.user.username}`)

        socket.on("joinGameRoom", async (gameId) => {
            try {
                const foundGame = await Game.findById(gameId)

                if (!foundGame) {
                    return socket.emit("GameRoomError", {
                        message: "Game Not Found"
                    })
                }

                const isHost = foundGame.host.toString() === socket.user._id.toString()

                let isParticipant = false

                if (!isHost) {
                    const foundParticipant = await Participant.findOne({
                        user: socket.user._id, game: foundGame._id
                    })

                    isParticipant = !!foundParticipant
                }

                if (!isHost && !isParticipant) {
                    return socket.emit("GameRoomError", {
                        message: "You do not have access to this game"
                    })
                }

                socket.join(foundGame._id.toString())

                console.log(`User ${socket.user.username} joined game room ${foundGame._id}`)

                socket.emit("gameRoomJoined", { gameId: foundGame._id })

            } catch (error) {
                console.error("Game room join error:", error.message)

                socket.emit("gameRoomError", { message: "Unable to join game room" })
            }
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