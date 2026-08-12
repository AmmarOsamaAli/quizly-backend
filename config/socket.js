const { Server } = require("socket.io")
const { jwt } = require('jsonwebtoken')
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
                const foundGame = await Game.findById(gameId).populate('quiz')

                if (!foundGame) {
                    return socket.emit("gameRoomError", {
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

                const participants = await Participant.find({ game: foundGame._id }).populate("user", "username")

                const lobbyPlayers = participants.map((participant) => ({
                    _id: participant.user._id,
                    username: participant.user.username
                }))

                io.to(foundGame._id.toString()).emit("lobbyPlayers", lobbyPlayers)

                if (foundGame.status === "Active") {
                    const currentQuestion =
                        foundGame.quiz.questions[foundGame.currentQuestionIndex]

                    if (currentQuestion) {
                        const questionForPlayer = {
                            _id: currentQuestion._id,
                            text: currentQuestion.text,
                            choices: currentQuestion.choices,
                            timeLimit: currentQuestion.timeLimit,
                            points: currentQuestion.points,
                            currentQuestionIndex: foundGame.currentQuestionIndex,
                            totalQuestions: foundGame.quiz.questions.length,
                            startedAt: foundGame.currentQuestionStartedAt
                        }

                        socket.emit("questionStarted", questionForPlayer)
                    }
                }

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