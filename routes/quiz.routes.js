const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const {getAllQuizzes, createQuiz, getQuizById, getMyQuizzes, updateQuiz, deleteQuiz} = require('../controllers/quiz.controller');

router.get('/', getAllQuizzes)

router.post('/', verifyToken, createQuiz)

router.get('/my-quizzes', verifyToken, getMyQuizzes)

router.get('/:quizId', verifyToken, getQuizById)

router.put('/:quizId', verifyToken, updateQuiz)

router.delete("/:quizId", verifyToken, deleteQuiz)

module.exports = router;