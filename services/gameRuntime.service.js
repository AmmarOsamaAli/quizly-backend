const Game = require("../models/Game")
const Participant = require("../models/Participant")
const { getIO } = require("../config/socket")

const gameTimers = new Map()

function clearGameTimer(gameId) {
    const timer = gameTimers.get(gameId.toString())

    if (timer) {
        clearTimeout(timer)
        gameTimers.delete(gameId.toString())
    }
}