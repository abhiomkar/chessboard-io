$(function() {

    var App = function($el) {
        this.gameID;
        this.cacheDOM();
        this.init();
        this.load();
    };

    App.fn = App.prototype;

    App.fn.cacheDOM = function() {
      this.$gameStatus = $(".game-status");
      this.$gameTurn = $(".game-turn");
      this.$piece = $("#board-status .piece");
    };

    App.fn.init = function() {
        var self = this;
        var urlFields;

        console.log("Init");

        this.regex = {
            validPlay: /play\/([a-zA-Z0-9\-_]+)\//g,
            playerColor: /play\/[a-zA-Z0-9\-_]+\/(white|black)\/?/g
        };

        this.$app = $("#chessboard-app");
        this.$status = this.$app.find("#board-status");

        urlFields = this.parseUrl();
        this.gameID = urlFields.gameID;
        this.playerColor = urlFields.playerColor || 'white';

        console.log('connecting...');
        this.io = io.connect();

        this.Events().onNewGame();

        // TODO: move to load()
        this.io.on('newPosition', function (data) {
          console.log('socket: new position', data.fen, data.gameID);

          self.board.position(data.fen);
          self.game.load(data.fen);
          self.renderToGameLog(data);
          self.renderGameStatus();
        });
    };

    App.fn.load = function() {
        var self = this;

        if (this.gameID) {
            this.getGameData(this.gameID, (function(data) {
              var gameHistory = data;
              var keys = Object.keys(gameHistory);
              keys.sort();
              var lastKey = keys.slice(-1)[0];
              var position = gameHistory[lastKey].position;

              console.log('loading data...', data);
               console.log(this.gameID + " position is " + position);
                this.gameConfig = {
                    pieceTheme: '/libs/chessboardjs/www/img/chesspieces/wikipedia-classic/{piece}.png',
                    draggable: true,
                    orientation: this.playerColor,
                    onDragStart: this.Events().onDragStart,
                    onDrop: this.Events().onDrop,
                    onSnapEnd: this.Events().onSnapEnd,
                    position: position
                };

                this.game = new Chess();
                this.game.load(position);
                this.board = new ChessBoard('board', this.gameConfig);
                this.renderGameLog(gameHistory);
                this.renderGameStatus();

                window.board = this.board;
            }).bind(this));
        }

        this.renderShareGameUrl();
        this.handleJoinGame();
        this.handleShareGame();
        this.isPlayerConnected();

        this.io.emit('gameStart', {
          gameID: this.gameID,
          playerColor: this.playerColor
        });
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

    App.fn.renderToGameLog = function(log) {
      var from = log.source;
      var to = log.target;
      var who = (log.piece[0] === this.playerColor[0]) ? 'You' : 'Opponent';
      var $li = $("<li class='log'><span class='left'>" + who + "</span> <span class='right'>" + from + " → " + to + "</span></li>");

      $('.game-log ul').prepend($li);
    };

    App.fn.renderGameStatus = function() {
      var who = 'You';
      var status = {};

      // who's turn?
      if (this.game.turn() === 'b') {
        if (this.playerColor === 'white') {
          who = 'Opponent';
        }
      }
      else if (this.game.turn() === 'w') {
        if (this.playerColor === 'black') {
          who = 'Opponent';
        }
      }

      // change piece color in game status
      if (this.game.turn() === 'w') {
        this.$piece.filter('.white-piece').removeClass('hide');
        this.$piece.filter('.black-piece').addClass('hide');
      }
      else if (this.game.turn() === 'b') {
        this.$piece.filter('.white-piece').addClass('hide');
        this.$piece.filter('.black-piece').removeClass('hide');
      }

      // in-check / in-checkmate / in-stalemate / in-draw ?
      if (this.game.in_check()) {
        if (this.game.in_checkmate()) {
          if (who === 'Opponent') {
            this.$gameTurn.text('You won! (Checkmate)');
          }
          else {
            this.$gameTurn.text('Opponent won! (Checkmate)');
          }
          this.$piece.filter('.white-piece').addClass('hide');
          this.$piece.filter('.black-piece').addClass('hide');

          status.in_checkmate = true;
        }
        else {
          if (who === 'Opponent') {
            this.$gameTurn.text("Opponent is in Check. Opponent's turn.");
          }
          else {
            this.$gameTurn.text("You are in Check. Your turn.");
          }
        }
      }
      else if (this.game.in_draw()) {
        if (this.game.in_stalemate()) {
          this.$gameTurn.text('Stalemate. Draw.');
          status.in_stalemate = true;
          status.in_draw = true;
        }
        else {
          this.$gameTurn.text('Draw.');
          status.in_draw = true;
        }
        this.$piece.filter('.white-piece').addClass('hide');
        this.$piece.filter('.black-piece').addClass('hide');
      }
      else {
        if (who === 'You') {
          this.$gameTurn.text('Your Turn');
        }
        else {
          this.$gameTurn.text("Opponent's Turn");
        }
      }

      return status;
    };

    App.fn.renderGameLog = function(gameHistory) {
      var that = this;
      var $logArray = [];

      var keys = Object.keys(gameHistory);
      keys.sort();
      keys.reverse();

      console.log('keys: ', keys);

      keys.forEach(function(key) {
        var h = gameHistory[key];

        var from = h.from;
        var to = h.from;

        if (h.position === 'start') {
          $logArray.push("<li class='log'><span class='left'>Game started</span></li>");
        }
        else {
          console.log(h);
          var who = (h.piece[0] === that.playerColor[0]) ? 'You' : 'Opponent';
          $logArray.push("<li class='log'><span class='left'>" + who + "</span> <span class='right'>" + from + " → " + to + "</span></li>");
        }
      });

      $('.game-log ul').append($logArray.join(''));
    };

    App.fn.renderShareGameUrl = function() {
      var href = window.location.href,
          shareUrl,
          $box = this.$app.find('.share-game-box'),
          $input = this.$app.find('.share-game-box input'),
          $closeBtn = this.$app.find('.share-game-box a');

      if (href.indexOf('/black') > 0) {
        shareUrl = href.replace('/black', '/white');
      }
      else if (href.indexOf('/white') > 0) {
        shareUrl = href.replace('/white', '/black');
      }

      $input.on('click', function() {
        $(this).select();
      });

      $closeBtn.on('click', function(e) {
        e.preventDefault();
        $box.addClass('hide');
      });

      $input.val(shareUrl);
    };

    App.fn.handleJoinGame = function() {
      var self = this;

      $('.game-action-btns .join-game').on('click', function() {
        $(".game-demo-image")
          .removeClass('hide')
          .addClass("fadeInUp");
      });
    };

    App.fn.handleShareGame = function() {
      var self = this;

      $('.game-action-btns .share-game').on('click', function() {
        $(".share-game-box")
          .removeClass('hide')
          .addClass("fadeIn");
      });
    };

    App.fn.isPlayerConnected = function() {
      if (this.playerColor === "white") {
        // if (this.socket.connected) {
        // }
      }
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

            onDrop: function(source, target, piece) {
              // see if the move is legal
              console.log(source + ' --> ' + target);

              var move = self.game.move({
                from: source,
                to: target,
                promotion: 'q' // NOTE: always promote to a queen for example simplicity
              });

              // To fix the castling move - reload the fen (workaround) - but not updating the position immediatley?
              self.game.load(self.game.fen());

              // illegal move
              if (move === null) return 'snapback';

              var criticalStatus = self.renderGameStatus();
              var gameStatus = {
                source: source,
                target: target,
                piece: piece
              };

              gameStatus = $.extend({}, gameStatus, criticalStatus);

              self.updateStatus(gameStatus);
              self.renderToGameLog({
                source: source,
                target: target,
                piece: piece
              });
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
            },

            onClickJoinGameBtn: function(){
              var self = this;

              $('.join-game').on('click', function(e) {
                e.preventDefault();

                $('.join-game-box').removeClass('hide');
              })
            }

            // update the board position after the piece snap
            // for castling, en passant, pawn promotion

            // onSnapEnd: function() {
            //   board.position(self.game.fen());
            // }
        }
    };

    App.fn.updateStatus = function(options) {
      var self = this,
          fen = this.game.fen(),
          data = {
            from: options.source,
            to: options.target,
            timestamp: (new Date()).getTime(),
            position: fen,
            piece: options.piece
          };

      console.log("gameId: ", this.gameID);
      console.log("fen: ", fen);

      $.ajax({
        url: "/game/" + this.gameID,
        type: "PUT",
        dataType: "json",
        data: data
      })
      .done(function(response) {
         // self.game.load(fen);
         console.log('Updated.');

         self.io.emit('broadcastNewPosition', {
           gameID: self.gameID,
           fen: fen,
           piece: options.piece,
           source: options.source,
           target: options.target
         });
      })
      .error(function(error) {
         console.log('Error: ', error);
      });

      // Update the other client
      console.log('emit ', {"position": fen, gameID: this.gameID});
      // this.socket.emit('move', {gameId: this.gameID, fen:fen});
    };

    // position: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR',

    var app = new App();

});
