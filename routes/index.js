var express = require('express'),
	app = express(),
	swig = require('swig'),
	Firebase = require('firebase');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
// TODO: set cache to true in production
app.set('view cache', false);
swig.setDefaults({ cache: false });

// ** UI Services **

app.get('/', function(req, res, next) {
  res.render('home');
});

app.get('/game/new', function(req, res, next) {
	console.log('/game/new');
	var firebase = new Firebase('https://chessboard-io.firebaseio.com/game');
	var postID = firebase.push({ position: "start" });

	res.set('Content-type', 'application/json');
	res.send(JSON.stringify({gameID: postID.key()}));
});

app.get('/play/:id([a-zA-Z0-9\-_]+)/:color(white|black)/?', function(req, res, next) {
  var gameID = req.params.id;

  res.render('play', { title: 'hello', gameID: gameID });
});	

// ** 

// ** Data Services **

app.get('/game/:id([a-zA-Z0-9\-_]+)', function(req, res) {
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

app.put('/game/:id/?', function(req, res) {
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

module.exports = app
