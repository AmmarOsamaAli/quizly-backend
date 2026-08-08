const mongoose = require ('mongoose')

const gameSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        minLength: 6,
        maxLength: 6,
    },
    status: {
        type: String,
        required: true,
        default: "Waiting",
        enum: ["Waiting", "Active", "Results", "Finished", "Cancelled"]
    },
    currentQuestionIndex: {
        type: Number,
        default: null
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Quiz"
    }

}, {timestamps: true})


const Game = mongoose.model('Game', gameSchema)


module.exports = Game