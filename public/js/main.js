$(function() {

    var App = function($el) {
        this.gameID;
        this.init();
        this.load();
    };

    App.fn = App.prototype;

    App.fn.init = function() {
        var self = this;

        console.log("Init");

        this.regex = {
            validPlay: /play\/([a-zA-Z0-9\-_]+)\//g,
            playerColor: /play\/[a-zA-Z0-9\-_]+\/(white|black)\/?/g
        };

        this.$app = $("#chessboard-app");
        this.$status = this.$app.find("#board-status");

        console.log('connecting...');
        this.socket = io();

        this.Events().onNewGame();

        // TODO: move to load()
        this.socket.on('newPosition', function (position) {
          console.log('socket: new position', position);

          self.board.position(position);
          self.game.load(position);
        });
    };

    App.fn.load = function() {
        var self = this,
            urlFields = this.parseUrl();

        this.gameID = urlFields.gameID;
        this.playerColor = urlFields.playerColor || 'white';

        if (this.gameID) {
            this.getGameData(this.gameID, (function(data) {
               console.log(this.gameID + " position is " + data.position);
                this.gameConfig = {
                    pieceTheme: '/libs/chessboardjs/img/chesspieces/wikipedia/{piece}.png',
                    draggable: true,
                    orientation: this.playerColor,
                    onDragStart: this.Events().onDragStart,
                    onDrop: this.Events().onDrop,
                    onSnapEnd: this.Events().onSnapEnd,
                    position: data.position
                };

                this.game = new Chess();
                this.game.load(data.position);
                this.board = new ChessBoard('board', this.gameConfig);

                this.socket.emit('game data', {gameId: this.gameID});
                // this.board.start();

                window.board = this.board;
            }).bind(this));
        }
    };

    App.fn.newGame = function() {
      var self = this;
      $.getJSON('/play/new')
       .done(function(data) {
          this.gameID = data.gameID;
       })
    };

    App.fn.getGameData = function(gameId, callback) {
        $.ajax({
            url: "/game/" + gameId,
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

    App.fn.parseUrl = function() {
        var path = window.location.pathname,
            gameIdMatch = this.regex.validPlay.exec(path),
            playerColorMatch = this.regex.playerColor.exec(path),
            fields = {};

        if (gameIdMatch && (gameIdMatch.length > 1) && gameIdMatch[1]) {
          fields['gameID'] = gameIdMatch[1];
        }

        if (playerColorMatch) {
          fields['playerColor'] = playerColorMatch[1];
        }

        return fields;
    };

    App.fn.Events = function() {
        var self = this;

        return {
            // do not pick up pieces if the game is over
            // only pick up pieces for the side to move
            onDragStart: function(source, piece, position, orientation) {
              if (self.game.game_over() === true ||
                  (self.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
                  (self.game.turn() === 'b' && piece.search(/^w/) !== -1) ||
                  (orientation[0] === 'w' && piece.search('^b') !== -1) ||
                  (orientation[0] === 'b' && piece.search('^w') !== -1)
                  ) {
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
              self.render();
            },

            onNewGame: function() {
              var self = this;

              $('.new-game').on('click', function(e) {
                e.preventDefault();

                // retrieve new game ID
                $.getJSON("/game/new")
                 .done(function(data) {
                      window.location = '/play/' + data.gameID + '/white';
                 });

                return false;
              })
            }

            // update the board position after the piece snap 
            // for castling, en passant, pawn promotion

            // onSnapEnd: function() {
            //   board.position(self.game.fen());
            // }
        }
    };

    App.fn.updateStatus = function() {
      var status = '',
          self = this,
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

      console.log("gameId: ", this.gameID);
      console.log("fen: ", fen);

      $.ajax({
        url: "/game/" + this.gameID,
        type: "PUT",
        dataType: "json",
        data: { position: fen }
      })
      .done(function(response) {
         self.game.load(fen);
         console.log('Updated.');

         self.socket.emit('broadcastNewPosition', fen);
      })
      .error(function(error) {
         console.log('Error: ', error);
      });

      // Update the other client
      console.log('emit ', {"position": fen, gameId: this.gameID});
      // this.socket.emit('move', {gameId: this.gameID, fen:fen});
    };

    App.fn.render = function() {
      this.$status.find('.game-turn');
    };

    // position: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR',

    var app = new App();

    // var socket = io.connect('http://localhost:3000');
    // socket.on('update', function(data) {
    //   if(data.gameID === app.gameID) {
    //     var fen = data.fen.split(" ")[0];
    //     console.log("from update socket's callback");
    //     app.board.position(fen);
    //   }
    // });
});