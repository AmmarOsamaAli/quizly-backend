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

async function startQuestion(gameId) {
    const foundGame = await Game.findById(gameId).populate('quiz')

    if (!foundGame) {
        throw new Error("Game Not Found")
    }

    const currentQuestion = foundGame.quiz.questions[foundGame.currentQuestionIndex]

    if (!currentQuestion) {
        throw new Error("Question Not Found")
    }

    foundGame.status = "Active"
    foundGame.currentQuestionStartedAt = new Date()


    await foundGame.save()

    const io = getIO()

    const questionForPlayers = {
        _id: currentQuestion._id,
        text: currentQuestion.text,
        choices: currentQuestion.choices,
        timeLimit: currentQuestion.timeLimit,
        points: currentQuestion.points,
        currentQuestionIndex: foundGame.currentQuestionIndex,
        totalQuestions: foundGame.quiz.questions.length,
        startedAt: foundGame.currentQuestionStartedAt
    }

    io.to(gameId.toString()).emit(
        "questionStarted", questionForPlayers
    )

    clearGameTimer(gameId)

    const timer = setTimeout(async () => {
        try {
            await finishQuestion(gameId)
        } catch (error) {
            console.error(`Error finishing question for game ${gameId}:`, error.message)
        }
    }, currentQuestion.timeLimit * 1000)
    gameTimers.set(gameId.toString(), timer)
}


async function finishQuestion(gameId) {
    const foundGame = await Game.findOneAndUpdate(
        { _id: gameId, status: "Active" }, { status: "Results" }, { new: true })
        .populate('quiz')

    if (!foundGame) {
        return
    }

    const currentQuestion = foundGame.quiz.questions[foundGame.currentQuestionIndex]

    if (!currentQuestion) {
        throw new Error("Question Not Found")
    }

    clearGameTimer(gameId)

    const participants = await Participant.find({ game: foundGame._id })

    for (const participant of participants) {
        const answered = participant.answers.some(
            (answer) => answer.question.toString() === currentQuestion._id.toString()
        )

        if (!answered) {
            participant.wrong += 1
            await participant.save()
        }
    }

    const io = getIO()

    io.to(gameId.toString()).emit("questionResults", {
        questionId: currentQuestion._id,
        correctAnswer: currentQuestion.answer,
        currentQuestionIndex: foundGame.currentQuestionIndex
    })

    const resultsTimer = setTimeout(async () => {
        try {
            await advanceGame(gameId)
        } catch (error) {
            console.log(`Error Advancing Game ${gameId}: `, error.message)
        }
    }, 5000)
    gameTimers.set(gameId.toString(), resultsTimer)
}


async function advanceGame(gameId) {
    const foundGame = await Game.findById(gameId).populate('quiz')

    if (!foundGame) {
        throw new Error("Game Not Found")
    }

    if (foundGame.status !== "Results") {
        return
    }

    const nextQuestionIndex = foundGame.currentQuestionIndex + 1

    if (nextQuestionIndex < foundGame.quiz.questions.length) {
        foundGame.currentQuestionIndex = nextQuestionIndex

        await foundGame.save()

        await startQuestion(gameId)
    }
    else {
        await finishGame(gameId)
    }
}

async function finishGame(gameId) {
    const foundGame = await Game.findById(gameId)

    if (!foundGame) {
        throw new Error("Game Not Found")
    }

    clearGameTimer(gameId)

    foundGame.status = "Finished"

    await foundGame.save()

    const participants = await Participant.find({ game: foundGame._id })
        .populate("user", "username").sort({ score: -1 })

    const leaderboard = participants.map((participant, index) => ({
        position: index + 1,
        user: participant.user,
        score: participant.score,
        correct: participant.correct,
        wrong: participant.wrong
    }))

    const io = getIO()

    io.to(gameId.toString()).emit("gameFinished", {
        leaderboard
    })
}

async function checkAllAnswered(gameId) {
    const foundGame = await Game.findById(gameId).populate('quiz')

    if (!foundGame) {
        throw new Error("Game Not Found")
    }

    if (foundGame.status !== "Active") {
        return
    }

    const currentQuestion = foundGame.quiz.questions[foundGame.currentQuestionIndex]

    if (!currentQuestion) {
        throw new Error("Question Not Found")
    }

    const participants = await Participant.find({ game: foundGame._id })


    const allAnswered = participants.every((participant) =>
        participant.answers.some(
            (answer) => answer.question.toString() === currentQuestion._id.toString()
        )
    )

    if (allAnswered) {
        await finishQuestion(gameId)
    }

}

module.exports = {
    startQuestion,
    finishQuestion,
    advanceGame,
    finishGame,
    clearGameTimer,
    checkAllAnswered
}