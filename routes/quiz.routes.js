const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const {getAllQuizzes, createQuiz, getQuizById, getMyQuizzes, updateQuiz, deleteQuiz, getAllQuestions, getQuestionById, createQuestion, updateQuestion} = require('../controllers/quiz.controller');

router.get('/', getAllQuizzes)

router.post('/', verifyToken, createQuiz)

router.get('/my-quizzes', verifyToken, getMyQuizzes)

router.get('/:quizId', verifyToken, getQuizById)

router.put('/:quizId', verifyToken, updateQuiz)

router.delete("/:quizId", verifyToken, deleteQuiz)

router.get('/:quizId/questions', verifyToken, getAllQuestions)

router.get('/:quizId/questions/:questionId', verifyToken, getQuestionById)

router.post('/:quizId/questions', verifyToken, createQuestion)

router.put('/:quizId/questions/:questionId', verifyToken, updateQuestion)

module.exports = router;