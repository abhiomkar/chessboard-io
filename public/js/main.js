$(function() {

    var App = function($el) {
        this.gameId;
        this.init();
        this.load();
    };

    App.fn = App.prototype;

    App.fn.init = function() {

        console.log("Init");

        this.regex = {
            validPlay: /play\/(\w+).*/g
        };
    };

    App.fn.load = function() {
        var self = this;

        this.gameId = this.getGameIdFromUrl();



        if (this.gameId) {
            this.getGameData((function(data) {
               console.log(this.gameId + " position is " + data.position);
                this.gameConfig = {
                    pieceTheme: '/libs/chessboardjs/img/chesspieces/wikipedia/{piece}.png',
                    draggable: true,
                    orientation: 'white',
                    onDragStart: this.Events().onDragStart,
                    onDrop: this.Events().onDrop,
                    onSnapEnd: this.Events().onSnapEnd,
                    position: data.position
                };

                this.game = new Chess(data.position);
                this.board = new ChessBoard('board', this.gameConfig);
                // this.board.start();

                window.board = this.board;
            }).bind(this));
        }
    };

    App.fn.getGameData = function(callback) {
            $.ajax({
                url: "/game/" + this.gameId,
                method: "get",
                dataType: "json"
            })
            .done(function(data) {
                callback(data);
            })
            .error(function() {
                console.log("Error loading game data.");
            });
    };

    App.fn.getGameIdFromUrl = function() {
        var match = this.regex.validPlay.exec(window.location.pathname),
            gameId;

        if (match) {
            gameId = match[1];
            return gameId;
        }
        else {
            return null;
        }
    };

    App.fn.Events = function() {
        var self = this;

        return {
            // do not pick up pieces if the game is over
            // only pick up pieces for the side to move
            onDragStart: function(source, piece, position, orientation) {
              if (self.game.game_over() === true ||
                  (self.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
                  (self.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
                return false;
              }
            },

            onDrop: function(source, target) {
              // see if the move is legal
              var move = self.game.move({
                from: source,
                to: target,
                promotion: 'q' // NOTE: always promote to a queen for example simplicity
              });

              // illegal move
              if (move === null) return 'snapback';

              self.updateStatus();
            },

            // update the board position after the piece snap 
            // for castling, en passant, pawn promotion

            // onSnapEnd: function() {
            //   board.position(self.game.fen());
            // }
        }
    };

    App.fn.updateStatus = function() {
      var status = '',
          fen = this.game.fen(); //.split(' ')[0];

      var moveColor = 'White';
      if (this.game.turn() === 'b') {
        moveColor = 'Black';
      }

      // checkmate?
      if (this.game.in_checkmate() === true) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
      }

      // draw?
      else if (this.game.in_draw() === true) {
        status = 'Game over, drawn position';
      }

      // game still on
      else {
        status = moveColor + ' to move';

        // check?
        if (this.game.in_check() === true) {
          status += ', ' + moveColor + ' is in check';
        }
      }

      console.log("gameId: ", this.gameId);
      console.log("fen: ", fen);

      $.ajax({
        url: "/game/" + this.gameId,
        type: "PUT",
        dataType: "json",
        data: { position: fen }
      })
      .done(function(response) {
         console.log('Updated.');
      })
      .error(function(error) {
         console.log('Error: ', error);
      });

      // Update the other client
      console.log("Emitting a 'moved' event");
      socket.emit('moved', {gameId:this.gameId, fen:fen});
    };

    // position: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR',

    var app = new App();

    var socket = io.connect('http://localhost:3000');
    socket.on('update', function(data) {
      if(data.gameId == app.gameId) {
        var fen = data.fen.split(" ")[0];
        console.log("from update socket's callback");
        app.board.position(fen);
      }
    });
});