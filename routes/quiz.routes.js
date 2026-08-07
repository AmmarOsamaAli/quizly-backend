const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const {getAllQuizzes, createQuiz, getQuizById, getMyQuizzes} = require('../controllers/quiz.controller');

router.get('/', getAllQuizzes)

router.post('/', verifyToken, createQuiz)

router.get('/my-quizzes', verifyToken, getMyQuizzes)

router.get('/:quizId', verifyToken, getQuizById)

module.exports = router;