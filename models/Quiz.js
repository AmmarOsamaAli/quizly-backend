const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    choices: [{
        type: String,
        required: true
    }],
    answer: {
        type: String,
        required: true, 
        validate: {
            validator: function(answerValue){return this.choices.includes(answerValue)},
            message: "Answer must be one of the provided choices"
        }
    },
    timeLimit: {
        type: Number,
        enum:[10, 20, 30, 40, 50, 60],
        default: 30
    },
    points: {
        type: Number,
        default: 1000
    }
})

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ["General Knowledge", "Science", "Technology", "History", "Sports", "Entertainment", "Other"],
        trim: true
    },
    visibility: {
        type: String,
        enum: ["Public", "Private"],
        default: "Public"
    },
    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Medium"
    },
    questions: {
        type: [questionSchema],
        validate: {
            validator: v => v.length > 0, message: "A quiz must at least have one question"
        }
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true})

const Quiz = mongoose.model('Quiz', quizSchema)

module.exports = Quiz