const mongoose = require("mongoose")

const answersSchema = new mongoose.Schema({
    question: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    selectedAnswer: {
        type: String,
        required: true
    },
    isCorrect: {
        type: Boolean,
        required: true,
    },
    pointsEarned: {
        type: Number,
        default: 0
    },
    answeredAt: {
        type: Date
    }
})

const participantSchema = new mongoose.Schema({
    score: {
        type: Number,
        required: true,
        default: 0
    },
    correct: {
        type: Number,
        default: 0
    },
    wrong: {
        type: Number,
        default: 0
    },
    answers: {
        type: [answersSchema],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
        required: true
    }
}, { timestamps: true })

const Participant = mongoose.model('Participant', participantSchema)

module.exports = Participant