var	Firebase = require('firebase');
var gameId = "-K-ZvOutfk9NCsnswAbE";
var gameRef = new Firebase('https://chessboard-io.firebaseio.com/game/' + gameId);

var move = {
	from: 'A1',
	to: 'B2',
	timestamp: 123123124,
	player: 'white',
	position: '11111/22222/8/8/4p3/N7/PPPP1PPP/R1BQKBNR w KQkq - 0 3'
};

gameRef.child('history').push(move);
