var express = require('express'),
	Firebase = require('firebase');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/play/:id([a-zA-Z]+)/:color(white|black)/?', function(req, res, next) {
  console.log('play!');
  res.render('index', {title: 'hello'});
});

router.get('/game/:id', function(req, res) {
	var gameId = req.params.id, 
		firebase = new Firebase('https://chessboard-io.firebaseio.com/' + gameId);

	firebase.on("value", function(snapshot) {
		var gameData = snapshot.val();

		if (gameData) {
			res.set('Content-type', 'application/json');
			res.send(JSON.stringify(gameData));
		}
		else {
			firebase.set({
				'position': 'start'
			}, function(error) {
				res.set('Content-type', 'application/json');
				res.send(JSON.stringify({ position: "start"}));	
			});
		}
	});
});

router.put('/game/:id/?', function(req, res) {
	var gameId = req.params.id,
		firebase = new Firebase('https://chessboard-io.firebaseio.com/');

	console.log('gameId: ', gameId);
	firebase.child(gameId);
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
		}
	});
});

module.exports = router;
