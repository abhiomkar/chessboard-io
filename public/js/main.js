$(function() {
	var cfg = {
		pieceTheme: 'libs/chessboardjs/img/chesspieces/wikipedia/{piece}.png',
		draggable: true,
		position: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR',
		orientation: 'black'
	};

	var board = new ChessBoard('board', cfg);

	window.board = board;
});