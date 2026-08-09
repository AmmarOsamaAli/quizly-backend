const mongoose = require("mongoose")

const participantSchema = new mongoose.Schema({
    score: {
        type: Number,
        required: true
    },
    correct: {
        type: Number,
        default: 0
    },
    wrong: {
        type: Number,
        default: 0
    },
    submittedAnswer: {
        type: String,
        required: true,            
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game"
    }
})

const Participant = mongoose.model('Participant', participantSchema)

module.exports = Participation