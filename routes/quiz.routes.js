const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const {getAllQuizzes, createQuiz} = require('../controllers/quiz.controller');

router.get('/', getAllQuizzes)

router.post('/', verifyToken, createQuiz)


module.exports = router;