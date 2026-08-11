const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const gameController = require('../controllers/game.controller')

router.post('/quizzes/:quizId/games', verifyToken, gameController.createGame)

router.post('/games/code/:code/join', verifyToken, gameController.joinGame)

router.get('/games/:gameId', verifyToken, gameController.getGameById)

router.patch('/games/:gameId/start', verifyToken, gameController.startGame)

router.post('/games/:gameId/answers', verifyToken, gameController.submitAnswer)

router.patch('/games/:gameId/cancel', verifyToken, gameController.cancelGame)

router.get('/games/:gameId/results', verifyToken, gameController.getGameResults)


module.exports = router