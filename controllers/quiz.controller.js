const Quiz = require('../models/Quiz')

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


module.exports = {
    getAllQuizzes,
    createQuiz
}