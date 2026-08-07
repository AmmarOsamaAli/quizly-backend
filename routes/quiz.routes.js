const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const quizController = require('../controllers/quiz.controller');

router.get('/', quizController.getAllQuizzes)

module.exports = router;