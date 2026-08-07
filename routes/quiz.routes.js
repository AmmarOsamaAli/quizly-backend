const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const {getAllQuizzes, createQuiz, getQuizById, getMyQuizzes, updateQuiz} = require('../controllers/quiz.controller');

router.get('/', getAllQuizzes)

router.post('/', verifyToken, createQuiz)

router.get('/my-quizzes', verifyToken, getMyQuizzes)

router.get('/:quizId', verifyToken, getQuizById)

router.put('/:quizId', verifyToken, updateQuiz)

module.exports = router;