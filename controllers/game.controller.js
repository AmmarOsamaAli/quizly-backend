const mongoose = require('mongoose')
const Game = require('../models/Game')
const verifyToken = require('../middleware/verifyToken')
const quizController = require('../controllers/quiz.controller')

async function createGame() {
    try {
        const { code, status, currentQuestionIndex } = req.body
        const createdGame = await Game.create({
            code,
            status,
            currentQuestionIndex,
            host = req.user._id,
            quiz = quizController.getQuizById()
        })
        res.status(201).json(createdGame)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}