const Quiz = require('../models/Quiz')

async function getAllQuizzes(req,res){
    try{
        const allQuizzes = await Quiz.find({visibility: "Public"})
        res.status(200).json(allQuizzes)
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

module.exports = {
    getAllQuizzes
}