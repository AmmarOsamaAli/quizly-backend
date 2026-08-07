const Quiz = require('../models/Quiz')
const mongoose = require("mongoose")

async function getAllQuizzes(req,res){
    try{
        const allQuizzes = await Quiz.find({visibility: "Public"})
        res.status(200).json(allQuizzes)
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

async function createQuiz(req,res){
    try{
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
    }catch(error){
        res.status(400).json({message: error.message})
    }
}

async function getQuizById(req,res){
        try{
        if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
            return res.status(404).json({ message: "Quiz Not Found" });
        }
        const foundQuiz = await Quiz.findById(req.params.quizId)
        if(!foundQuiz){
            return res.status(404).json({message: "Quiz Not Found"})
        }
        if(foundQuiz.visibility === "Private"){
            if(!req.user || foundQuiz.owner.toString() !== req.user._id.toString()){
                return res.status(403).json({message: "Access denied. Private quiz"})
            }
        }
        res.status(200).json(foundQuiz)
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

async function getMyQuizzes(req,res){
        try{
        const myQuizzes = await Quiz.find({owner: req.user._id})
        if(myQuizzes.length === 0){
            return res.status(200).json({message: "You have no quizzes yet!"})
        }
        res.status(200).json(myQuizzes)
    }catch(error){
        res.status(500).json({message: error.message})
    }
}


module.exports = {
    getAllQuizzes,
    createQuiz,
    getQuizById,
    getMyQuizzes
}