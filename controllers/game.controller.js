const Game = require('../models/Game')
const Quiz = require('../models/Quiz')
const Participant = require('../models/Participant')
const { startQuestion, checkAllAnswered, clearGameTimer } = require('../services/gameRuntime.service')
const { getIO } = require('../config/socket')

async function createGame(req, res) {
    try {
        const foundQuiz = await Quiz.findById(req.params.quizId)
        if (!foundQuiz) {
            return res.status(404).json({ message: "Quiz Not Found" })
        }
        if (foundQuiz.questions.length === 0) {
            return res.status(400).json({ message: "Please Add Questions First" })
        }

        if (foundQuiz.visibility === 'Private' && foundQuiz.owner.toString() !== req.user._id.toString()) {
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
        res.status(201).json({
            message: "Game Joined Successfully",
            gameId: foundGame._id,
            participant: createdParticipant
        })

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

        const foundParticipant = await Participant.findOne({ game: foundGame._id })

        if (!foundParticipant) {
            return res.status(400).json({ message: "At least one participant must join before starting" })
        }

        foundGame.currentQuestionIndex = 0

        await foundGame.save()

        await startQuestion(foundGame._id)

        return res.status(200).json({ message: "Game Started Successfully" })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}



async function submitAnswer(req, res) {
    try {
        const foundGame = await Game.findById(req.params.gameId).populate('quiz')
        if (!foundGame) {
            return res.status(404).json({ message: "No Such Game Found" })
        }

        if (foundGame.status !== "Active") {
            return res.status(400).json({ message: "Answers can only be submitted while the question is active" })
        }

        const foundParticipant = await Participant.findOne({ user: req.user._id, game: foundGame._id })

        if (!foundParticipant) {
            return res.status(403).json({ message: "You are not a participant in this game" })
        }

        const currentQuestion = foundGame.quiz.questions[foundGame.currentQuestionIndex]

        if (!currentQuestion) {
            return res.status(404).json({ message: "Current question not found" })
        }

        const { selectedAnswer } = req.body

        if (!selectedAnswer) {
            return res.status(400).json({ message: "Please Select an Answer" })
        }

        const alreadyAnswered = foundParticipant.answers.some(
            (answer) => answer.question.toString() === currentQuestion._id.toString()
        )

        if (alreadyAnswered) {
            return res.status(400).json({ message: "You already answered this question" })
        }

        if (!currentQuestion.choices.includes(selectedAnswer)) {
            return res.status(400).json({ message: "Invalid Answer Choice" })
        }

        const answeredAt = new Date()

        const timeTakenMilliseconds = answeredAt - foundGame.currentQuestionStartedAt

        const timeTakenSeconds = timeTakenMilliseconds / 1000

        if (timeTakenSeconds > currentQuestion.timeLimit) {
            return res.status(400).json({ message: "Time is over for this question" })
        }

        const isCorrect = selectedAnswer === currentQuestion.answer

        let pointsEarned = 0

        if (isCorrect) {
            const remainingTime = Math.max(currentQuestion.timeLimit - timeTakenSeconds, 0)

            const remainingPercentage = remainingTime / currentQuestion.timeLimit

            pointsEarned = Math.round(currentQuestion.points * remainingPercentage)

            foundParticipant.correct += 1
            foundParticipant.score += pointsEarned
        }
        else {
            foundParticipant.wrong += 1
        }

        foundParticipant.answers.push({
            question: currentQuestion._id,
            selectedAnswer,
            isCorrect,
            pointsEarned,
            answeredAt
        })

        await foundParticipant.save()

        await checkAllAnswered(foundGame._id)

        return res.status(200).json({
            message: "Answer submitted successfully",
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}



async function cancelGame(req, res) {
    try {
        const foundGame = await Game.findById(req.params.gameId)

        if (!foundGame) {
            return res.status(404).json({ message: "No Such Game Found" })
        }

        if (foundGame.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the host can cancel this game" })
        }

        if (foundGame.status === "Finished") {
            return res.status(400).json({ message: "A finsihed game cannot be canceled" })
        }

        if (foundGame.status === "Cancelled") {
            return res.status(400).json({ message: "This game is already canceled" })
        }

        clearGameTimer(foundGame._id)

        foundGame.status = "Cancelled"

        await foundGame.save()

        const io = getIO()

        io.to(foundGame._id.toString()).emit("gameCancelled", {
            message: "The host cancelled this game"
        })

        return res.status(200).json({ message: "Game Cancelled Successfully" })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

async function getGameResults(req, res) {
    try {
        const foundGame = await Game.findById(req.params.gameId)

        if (!foundGame) {
            return res.status(404).json({ message: "No Such Game Found" })
        }

        const isHost = foundGame.host.toString() === req.user._id.toString()

        const foundParticipant = await Participant.findOne({ user: req.user._id, game: foundGame._id })

        if (!isHost && !foundParticipant) {
            return res.status(403).json({ message: "You Can't Access This Game's Results" })
        }

        const participants = await Participant.find({ game: foundGame._id })
            .populate("user", "username").sort({ score: -1 })

        const leaderboard = participants.map((participant, index) => ({
            position: index + 1,
            user: participant.user,
            score: participant.score,
            correct: participant.correct,
            wrong: participant.wrong
        }))

        return res.status(200).json({
            gameId: foundGame._id,
            status: foundGame.status,
            leaderboard
        })

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