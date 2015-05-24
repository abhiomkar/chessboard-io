var express = require('express'),
	Firebase = require('firebase');

var router = express.Router();

// ** UI Services **

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/game/new', function(req, res, next) {
	console.log('/game/new');
	var firebase = new Firebase('https://chessboard-io.firebaseio.com/game');
	var postID = firebase.push({ position: "start" });

	res.set('Content-type', 'application/json');
	res.send(JSON.stringify({gameID: postID.key()}));
});

router.get('/play/:id([a-zA-Z0-9\-_]+)/:color(white|black)/?', function(req, res, next) {
  var gameID = req.params.id;

  res.render('index', { title: 'hello', gameID: gameID });
});	

// ** 

// ** Data Services **

router.get('/game/:id([a-zA-Z0-9\-_]+)', function(req, res) {
	console.log('/game/id');

	var gameId = req.params.id, 
		firebase = new Firebase('https://chessboard-io.firebaseio.com/game/' + gameId);

	firebase.once("value", function(snapshot) {
		var gameData = snapshot.val();

		// game data already present
		if (gameData) {
			res.set('Content-type', 'application/json');
			res.send(JSON.stringify(gameData));
		}
		// new game, use default game settings
		else {
			firebase.set({
				'position': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
			}, function(error) {
				if (error) {
					console.log('Error in fetching data', error);
				}
				else {
					res.set('Content-type', 'application/json');
					res.send(JSON.stringify({ position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}));
				}
			});
		}
	});
});

router.put('/game/:id/?', function(req, res) {
	var gameId = req.params.id,
		firebase = new Firebase('https://chessboard-io.firebaseio.com/game/' + gameId);

	console.log('firebase update()');

	firebase.update(req.body, function(error) {
		if (error) {
			console.log('Error in put', error);
			res.set('Content-type', 'application/json');
			res.send(JSON.stringify({}));
		}
		else {
			console.log('Put success.');
			res.set('Content-type', 'application/json');
			res.send(JSON.stringify({}));

			// io.broadcast.emit("newPosition");
			// www.newPosition();
		}
	});

});

// **

module.exports = router;
