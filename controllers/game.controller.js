const mongoose = require('mongoose')
const Game = require('../models/Game')
const Quiz = require('../models/Quiz')
const Participant = require('../models/Participant')

async function createGame(req, res) {
    try {
        const foundQuiz = await Quiz.findById(req.params.quizId)
        if (!foundQuiz) {
            return res.status(404).json({ message: "Quiz Not Found" })
        }
        if (foundQuiz.questions.length === 0) {
            return res.status(400).json({ message: "Please Add Questions First" })
        }

        if (foundQuiz.visibility === 'Private' && foundQuiz.owner._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You Cant' Host This Quiz" })
        }

        let foundCode, code

        do {
            code = Math.floor(100000 + Math.random() * 900000).toString()
            foundCode = await Game.findOne({ code: code })
        }
        while (foundCode)

        const createdGame = await Game.create({
            code: code,
            status: "Waiting",
            currentQuestionIndex: null,
            host: req.user._id,
            quiz: req.params.quizId
        })

        return res.status(201).json(createdGame)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

async function joinGame(req, res) {
    try {
        const foundGame = await Game.findOne({ code: req.params.code })
        if (!foundGame) {
            return res.status(404).json({ message: "No Such Game Found" })
        }


        if (foundGame.host.toString() === req.user._id.toString()) {
            return res.status(403).json({ message: "You are the host" })
        }
        if (foundGame.status !== "Waiting") {
            return res.status(400).json({ message: "You Can't Join this game. Game Already Started" })
        }

        const foundParticipant = await Participant.findOne({ user: req.user._id, game: foundGame._id })

        if (foundParticipant)
            return res.status(400).json({ message: "You Already Joined This Game" })


        const createdParticipant = await Participant.create({
            score: 0,
            correct: 0,
            wrong: 0,
            answers: [],
            user: req.user._id,
            game: foundGame._id
        })
        res.status(201).json({ message: "Game Joined Successfully" })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


async function getGameById(req, res) {
    try {
        const foundGame = await Game.findById(req.params.gameId)
        if (!foundGame) {
            return res.status(404).json({ message: "No Such Game Found" })
        }

        if (req.user._id.toString() === foundGame.host.toString()) {
            return res.status(200).json(foundGame)
        }

        const foundParticipant = await Participant.findOne({ user: req.user._id, game: foundGame._id })

        if (foundParticipant) {
            return res.status(200).json(foundGame)
        }

        return res.status(403).json({ message: "You Can't Access this page" })


    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


async function startGame(req, res) {
    try {
        const foundGame = await Game.findById(req.params.gameId)
        if (!foundGame) {
            return res.status(404).json({ message: "No Such Game Found" })
        }
        if (req.user._id.toString() !== foundGame.host.toString()) {
            return res.status(403).json({ message: "You Can't start this game" })
        }
        if (foundGame.status !== "Waiting") {
            return res.status(400).json({ message: "This game already started or is finished" })
        }

        foundGame.status = "Active"
        foundGame.currentQuestionIndex = 0

        await foundGame.save()

        return res.status(200).json(foundGame)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}



async function submitAnswer(req, res) {
    try {

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}



async function cancelGame(req, res) {
    try {

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

async function getGameResults(req, res) {
    try {

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


module.exports = {
    createGame,
    joinGame,
    getGameById,
    startGame,
    submitAnswer,
    cancelGame,
    getGameResults
}