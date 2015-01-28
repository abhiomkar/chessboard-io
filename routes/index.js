var express = require('express'),
	Firebase = require('firebase');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/game/:id/white', function(req, res) {
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

module.exports = router;