var express = require('express');
var router = express.Router();
var	Firebase = require('firebase');

// ** UI Services **

router.get('/', function(req, res, next) {
  res.render('home');
});

router.get('/play/:id([a-zA-Z0-9\-_]+)/:color(white|black)/?', function(req, res, next) {
    var gameID = req.params.id;
    var firebase = new Firebase('https://chessboard-io.firebaseio.com/game/');

	res.render('play', { title: 'hello', gameID: gameID });
});

// **

// ** Data Services **

// create a new game
router.get('/game/new', function(req, res, next) {
	console.log('/game/new');
	var gameRef = new Firebase('https://chessboard-io.firebaseio.com/game');
	var newGameRef = gameRef.push();
	var historyRef = newGameRef.child('history');
	var postID = historyRef.push({ position: "start" });

	res.json({gameID: newGameRef.key()});
});

// get game details
router.get('/game/:id([a-zA-Z0-9\-_]+)', function(req, res) {
	console.log('/game/id');

	var gameId = req.params.id;
	var firebase = new Firebase('https://chessboard-io.firebaseio.com/game/' + gameId + '/history');

	firebase.once("value", function(snapshot) {
		var gameHistory = snapshot.val();

		// game data already present
		if (gameHistory) {
			res.json(gameHistory);
			console.log('gameData: ', gameHistory);
		}
		else {
			res.json({
				error: true,
				statusMessage: 'game data not found'
			});
		}
	});
});

// update game information
router.put('/game/:id/?', function(req, res) {
	var gameId = req.params.id,
			gameRef = new Firebase('https://chessboard-io.firebaseio.com/game/' + gameId),
			historyRef = gameRef.child('history');

	historyRef.push(req.body, function(error) {
		if (error) {
			res.json({
				error: true,
				statusMessage: error
			});
			return;
		}
		else {
			res.json({
				success: true
			});
			return;
		}
	});
});

module.exports = router;
