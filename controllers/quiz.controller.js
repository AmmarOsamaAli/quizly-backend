const Quiz = require('../models/Quiz')
const mongoose = require("mongoose")

async function getAllQuizzes(req, res) {
    try {
        const allQuizzes = await Quiz.find().select("-questions").populate("owner", "username")
        res.status(200).json(allQuizzes)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

async function createQuiz(req, res) {
    try {
        const { title, description, category, visibility, difficulty, questions } = req.body;
        const createdQuiz = await Quiz.create({
            title,
            description,
            category,
            visibility,
            difficulty,
            questions,
            owner: req.user._id
        })
        res.status(201).json(createdQuiz)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function getQuizById(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
            return res.status(400).json({ message: "Invalid Quiz ID format" });
        }
        const foundQuiz = await Quiz.findById(req.params.quizId).populate("owner", "username")
        if (!foundQuiz) {
            return res.status(404).json({ message: "Quiz Not Found" })
        }
        res.status(200).json(foundQuiz)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

async function getMyQuizzes(req, res) {
    try {
        const myQuizzes = await Quiz.find({ owner: req.user._id })
        res.status(200).json(myQuizzes)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

async function updateQuiz(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
            return res.status(400).json({ message: "Invalid Quiz ID format" });
        }
        const foundQuiz = await Quiz.findById(req.params.quizId)
        if (!foundQuiz) {
            return res.status(404).json({ message: "Quiz Not Found" })
        }
        if (foundQuiz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You do not own this quiz to edit!" })
        }
        const { title, description, category, visibility, difficulty, questions } = req.body;
        const updatedQuiz = await Quiz.findByIdAndUpdate(
            req.params.quizId, {
            title,
            description,
            category,
            visibility,
            difficulty,
            questions,
        }, { new: true, runValidators: true })
        res.status(200).json(updatedQuiz)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function deleteQuiz(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
            return res.status(400).json({ message: "Invalid Quiz ID format" });
        }
        const foundQuiz = await Quiz.findById(req.params.quizId)
        if (!foundQuiz) {
            return res.status(404).json({ message: "Quiz Not Found" })
        }
        if (foundQuiz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You do not own this quiz to delete!" })
        }
        await Quiz.findByIdAndDelete(req.params.quizId)
        res.status(200).json({ message: "Quiz deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

//Qestions Controller (as its embedded i decided to put it in the same file as the quiz controller to avoid mergeParams etc)

async function getAllQuestions(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
            return res.status(400).json({ message: "Invalid Quiz ID format" });
        }
        const foundQuiz = await Quiz.findById(req.params.quizId)
        if (!foundQuiz) {
            return res.status(404).json({ message: "Quiz Not Found" })
        }
        if (foundQuiz.visibility === "Private" && foundQuiz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied. Private quiz" })
        }
        res.json(foundQuiz.questions)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

async function getQuestionById(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
            return res.status(400).json({ message: "Invalid Quiz ID format" });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.questionId)) {
            return res.status(400).json({ message: "Invalid Question ID format" });
        }
        const foundQuiz = await Quiz.findById(req.params.quizId)
        if (!foundQuiz) {
            return res.status(404).json({ message: "Quiz Not Found" })
        }
        if (foundQuiz.visibility === "Private" && foundQuiz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied. Private quiz" })
        }
        const foundQuestion = foundQuiz.questions.id(req.params.questionId)
        if (!foundQuestion) {
            return res.status(404).json({ message: "Question not found!" })
        }
        res.json(foundQuestion)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

async function createQuestion(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
            return res.status(400).json({ message: "Invalid Quiz ID format" });
        }
        const foundQuiz = await Quiz.findById(req.params.quizId)
        if (!foundQuiz) {
            return res.status(404).json({ message: "Quiz Not Found" })
        }
        if (foundQuiz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied. You do not own the quiz" })
        }
        const { text, choices, answer, timeLimit, points } = req.body
        foundQuiz.questions.push({
            text,
            choices,
            answer,
            timeLimit,
            points
        })
        await foundQuiz.save()
        const newQuestion = foundQuiz.questions[foundQuiz.questions.length - 1]
        res.status(201).json(newQuestion)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function updateQuestion(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
            return res.status(400).json({ message: "Invalid Quiz ID format" });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.questionId)) {
            return res.status(400).json({ message: "Invalid Question ID format" });
        }
        const foundQuiz = await Quiz.findById(req.params.quizId)
        if (!foundQuiz) {
            return res.status(404).json({ message: "Quiz Not Found" })
        }
        if (foundQuiz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied. You do not own the quiz" })
        }
        const foundQuestion = foundQuiz.questions.id(req.params.questionId)
        if (!foundQuestion) {
            return res.status(404).json({ message: "Question Not Found" })
        }
        const { text, choices, answer, timeLimit, points } = req.body
        foundQuestion.text = text
        foundQuestion.choices = choices
        foundQuestion.answer = answer
        foundQuestion.timeLimit = timeLimit
        foundQuestion.points = points
        await foundQuiz.save()
        res.status(200).json(foundQuestion)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function deleteQuestion(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
            return res.status(400).json({ message: "Invalid Quiz ID format" });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.questionId)) {
            return res.status(400).json({ message: "Invalid Question ID format" });
        }
        const foundQuiz = await Quiz.findById(req.params.quizId)
        if (!foundQuiz) {
            return res.status(404).json({ message: "Quiz Not Found" })
        }
        if (foundQuiz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied. You do not own the quiz" })
        }
        const foundQuestion = foundQuiz.questions.id(req.params.questionId)
        if (!foundQuestion) {
            return res.status(404).json({ message: "Question Not Found" })
        }
        foundQuestion.deleteOne()
        await foundQuiz.save()
        res.status(204).json({ message: "Question Deleted Successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    getAllQuizzes,
    createQuiz,
    getQuizById,
    getMyQuizzes,
    updateQuiz,
    deleteQuiz,
    //Question functions
    getAllQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion
}