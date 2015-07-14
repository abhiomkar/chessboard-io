var io = require('socket.io')();

// ** Socket Services **
io.on('gameStart', function(req) {
    console.log('>>> Ready gameID - ', req.data.gameID);

    req.io.join(req.data.gameID);
    req.io.room(req.data.gameID).broadcast('joined', {
        playerColor: req.data.playerColor
    });
});

io.on('broadcastNewPosition', function(req) {
    console.log('>>> broadcastNewPosition to ', req.data.gameID);

    req.io.room(req.data.gameID).broadcast('newPosition', {
        fen: req.data.fen,
        gameID: req.data.gameID
    });
});

module.exports = io;