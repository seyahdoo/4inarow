var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var MyGame;
(function (MyGame) {
    var Boot = (function (_super) {
        __extends(Boot, _super);
        function Boot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Boot.prototype.init = function () {
            this.input.maxPointers = 1;
            this.stage.disableVisibilityChange = true;
            if (this.game.device.desktop) {
                this.scale.pageAlignHorizontally = true;
            }
            else {
                this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                this.scale.pageAlignHorizontally = true;
            }
        };
        Boot.prototype.preload = function () {
            this.load.image('preloadBar', 'assets/loader.png');
        };
        Boot.prototype.create = function () {
            this.game.state.start('Preloader');
        };
        return Boot;
    }(Phaser.State));
    MyGame.Boot = Boot;
})(MyGame || (MyGame = {}));
var MyGame;
(function (MyGame) {
    var Game = (function (_super) {
        __extends(Game, _super);
        function Game() {
            var _this = _super.call(this, window.innerHeight, window.innerHeight, Phaser.CANVAS, 'content', null) || this;
            _this.state.add('Boot', MyGame.Boot, false);
            _this.state.add('Preloader', MyGame.Preloader, false);
            _this.state.add('Main', MyGame.Main, false);
            _this.state.start('Boot');
            return _this;
        }
        return Game;
    }(Phaser.Game));
    MyGame.Game = Game;
    window.onload = function () {
        MyGame.game = new MyGame.Game();
    };
})(MyGame || (MyGame = {}));
var MyGame;
(function (MyGame) {
    function syncGame(table_info, myPieceColor, isMyTurn) {
        MyGame.game.state.states["Main"].syncGame(table_info, myPieceColor, isMyTurn);
    }
    MyGame.syncGame = syncGame;
    function rivaldroppedToColumnEvent(column) {
        MyGame.game.state.states["Main"].rivaldroppedToColumnEvent(column);
    }
    MyGame.rivaldroppedToColumnEvent = rivaldroppedToColumnEvent;
    function gameFinishedEvent() {
        MyGame.game.state.states["Main"].gameFinishedEvent();
    }
    MyGame.gameFinishedEvent = gameFinishedEvent;
})(MyGame || (MyGame = {}));
var MyGame;
(function (MyGame) {
    var Main = (function (_super) {
        __extends(Main, _super);
        function Main() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.touchStart = new MyGame.Vector2(0, 0);
            _this.holdCooldown = 1;
            _this.columnNumbers = [0.103, 0.235, 0.368, 0.499, 0.631, 0.763, 0.895];
            _this.rowNumbers = [0.137, 0.283, 0.429, 0.575, 0.721, 0.867];
            return _this;
        }
        Main.prototype.create = function () {
            var _this = this;
            this.pieces = [];
            for (var i = 0; i < 7; i++) {
                this.pieces[i] = [];
            }
            var bg1 = this.add.sprite(0, 0, "backPart");
            bg1.bringToTop();
            bg1.scale.x = this.game.width / bg1.width;
            bg1.scale.y = this.game.height / bg1.height;
            var bg2 = this.add.sprite(0, 0, "backPartMainBg");
            bg2.bringToTop();
            bg2.scale.x = this.game.width / bg2.width;
            bg2.scale.y = this.game.height / bg2.height;
            var fp = this.add.sprite(0, 0, "frontPart");
            fp.bringToTop();
            fp.scale.x = this.game.width / fp.width;
            fp.scale.y = this.game.height / fp.height;
            this.scaleFactor = bg1.scale.x;
            this.redPiecePool = new MyGame.Pool(function () { return new MyGame.Piece(_this.game, "redStone", _this.scaleFactor); }, 18);
            this.yellowPiecePool = new MyGame.Pool(function () { return new MyGame.Piece(_this.game, "yellowStone", _this.scaleFactor); }, 18);
            this.game.input.onDown.add(function (pointer) {
                if (_this.finished)
                    return;
                if (!_this.myTurn)
                    return;
                if (!pointer.withinGame)
                    return;
                _this.activePointer = pointer;
                _this.touchStart.x = pointer.position.x;
                _this.touchStart.y = pointer.position.y;
                var col = _this.findCol(_this.input.activePointer.position.x / _this.game.width);
                _this.droppingColumn = col;
                _this.dropToColumn(col, _this.myColor, false, false);
            }, this);
            this.game.input.onUp.add(function (pointer) {
                if (!pointer.withinGame) {
                    return;
                }
                if (pointer != _this.activePointer) {
                    return;
                }
                if (_this.piece != null && _this.myTurn) {
                    _this.drop();
                }
            }, this);
        };
        Main.prototype.drop = function () {
            this.myTurn = false;
            this.piece.fallable = true;
            this.piece = null;
            this.activePointer = null;
            this.droppedToColumnEvent(this.droppingColumn);
            this.droppingColumn = null;
        };
        Main.prototype.droppedToColumnEvent = function (column) {
            try {
                window.webkit.messageHandlers.interop.postMessage(column);
            }
            catch (err) { }
            return;
        };
        Main.prototype.rivaldroppedToColumnEvent = function (column) {
            if (this.myTurn) {
                console.error("rival played at my turn, some stuff must be funky");
                return;
            }
            if (this.myColor == MyGame.PieceType.yellow)
                this.dropToColumn(column, MyGame.PieceType.red, true, false);
            else
                this.dropToColumn(column, MyGame.PieceType.yellow, true, false);
            this.myTurn = true;
        };
        Main.prototype.gameFinishedEvent = function () {
            this.finished = true;
        };
        Main.prototype.update = function () {
            var pointer = this.input.activePointer;
            if (this.piece != null && this.myTurn) {
                if (pointer.withinGame && pointer.isDown) {
                    var dist = (this.touchStart.y - pointer.position.y) / 5;
                    if (dist > this.piece.height)
                        dist = this.piece.height;
                    this.piece.position.y = (this.rowNumbers[0] * this.game.height) - (this.piece.height - (this.piece.height / 6)) - dist / 3;
                }
                else {
                    this.drop();
                }
            }
        };
        Main.prototype.findCol = function (x) {
            var n = 0;
            var dist = 1000000000;
            for (var i = 0; i < this.columnNumbers.length; i++) {
                var element = this.columnNumbers[i];
                if (Math.abs(x - element) < dist) {
                    n = i;
                    dist = Math.abs(x - element);
                }
            }
            return n;
        };
        Main.prototype.findRow = function (y) {
            var n = 0;
            var dist = 1000000000;
            for (var i = 0; i < this.rowNumbers.length; i++) {
                var element = this.rowNumbers[i];
                if (Math.abs(y - element) < dist) {
                    n = i;
                    dist = Math.abs(y - element);
                }
            }
            return n;
        };
        Main.prototype.syncGame = function (table_info, myPieceColor, isMyTurn) {
            this.redPiecePool.release_all();
            this.yellowPiecePool.release_all();
            this.pieces = [];
            for (var i = 0; i < 7; i++) {
                this.pieces[i] = [];
            }
            for (var i_1 = 0; i_1 < table_info.length; i_1++) {
                for (var j = 0; j < table_info[i_1].length; j++) {
                    var element = table_info[i_1][j];
                    this.dropToColumn(i_1, element, true, true);
                }
            }
            this.piece = null;
            this.activePointer = null;
            this.droppingColumn = null;
            this.myColor = myPieceColor;
            this.myTurn = isMyTurn;
        };
        Main.prototype.dropToColumn = function (col, piece_type, fall_now, immidiate) {
            if (0 > col || col > 6) {
                console.error("column numbers must be between 0 and 6 inclusive");
                return;
            }
            if (this.pieces[col].length >= 6) {
                console.error("cant spawn any more pieces here");
                return;
            }
            if (piece_type == MyGame.PieceType.empty) {
                return;
            }
            var piece = (piece_type == MyGame.PieceType.red) ?
                this.redPiecePool.get() :
                this.yellowPiecePool.get();
            piece.fallable = fall_now;
            this.pieces[col].push(this.piece);
            var spawn_point_x = this.columnNumbers[col] * this.game.width;
            var spawn_point_y = this.rowNumbers[0] * this.game.height;
            var settle_point_y = this.rowNumbers[6 - this.pieces[col].length] * this.game.height;
            if (immidiate) {
                piece.spawn(spawn_point_x, settle_point_y);
            }
            else {
                piece.spawn(spawn_point_x, spawn_point_y);
                piece.fall_to_position(settle_point_y);
            }
            if (this.myTurn)
                this.piece = piece;
            return;
        };
        return Main;
    }(Phaser.State));
    MyGame.Main = Main;
})(MyGame || (MyGame = {}));
var MyGame;
(function (MyGame) {
    var Piece = (function (_super) {
        __extends(Piece, _super);
        function Piece(game, color, scale) {
            var _this = _super.call(this, game, 0, 0, color, 0) || this;
            _this.bounciness = 0.3;
            _this.velocity = 0;
            _this.fallable = false;
            _this.scale.x = scale;
            _this.scale.y = scale;
            _this.acceleration = (30 / 768) * _this.game.height;
            _this.anchor.setTo(0.5, 0.5);
            game.add.existing(_this);
            _this.bringToTop();
            _this.moveDown();
            return _this;
        }
        Piece.prototype.spawn = function (x, y) {
            this.position.x = x;
            this.position.y = y;
            this.groundLevel = y;
        };
        Piece.prototype.fall_to_position = function (y) {
            this.groundLevel = y;
        };
        Piece.prototype.update = function () {
            if (this.fallable) {
                if (this.position.y <= this.groundLevel) {
                    this.velocity += this.acceleration * this.game.time.physicsElapsed;
                    this.position.y += this.velocity;
                    if (this.position.y > this.groundLevel) {
                        this.velocity *= -this.bounciness;
                        this.position.y = this.groundLevel;
                    }
                }
            }
        };
        return Piece;
    }(Phaser.Sprite));
    MyGame.Piece = Piece;
})(MyGame || (MyGame = {}));
var MyGame;
(function (MyGame) {
    var PieceType;
    (function (PieceType) {
        PieceType[PieceType["red"] = 0] = "red";
        PieceType[PieceType["yellow"] = 1] = "yellow";
        PieceType[PieceType["empty"] = 2] = "empty";
    })(PieceType = MyGame.PieceType || (MyGame.PieceType = {}));
    ;
})(MyGame || (MyGame = {}));
var MyGame;
(function (MyGame) {
    var Pool = (function () {
        function Pool(createFunction, initialSize) {
            this.cache = [];
            this.belongings = [];
            this.createFunction = createFunction;
            this.grow(initialSize);
        }
        Pool.prototype.grow = function (size) {
            for (var index = 0; index < size; index++) {
                var obj = this.createFunction();
                obj.renderable = false;
                this.belongings.push(obj);
                this.cache.push(obj);
            }
        };
        Pool.prototype.get = function () {
            if (this.cache.length <= 0) {
                this.grow(1);
            }
            var obj = this.cache.pop();
            obj.renderable = true;
            return obj;
        };
        Pool.prototype.release = function (thrash) {
            thrash.renderable = false;
            this.cache.push(thrash);
        };
        Pool.prototype.release_all = function () {
            var _this = this;
            this.cache = [];
            this.belongings.forEach(function (element) {
                _this.release(element);
            });
        };
        return Pool;
    }());
    MyGame.Pool = Pool;
})(MyGame || (MyGame = {}));
var MyGame;
(function (MyGame) {
    var Preloader = (function (_super) {
        __extends(Preloader, _super);
        function Preloader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.ready = false;
            return _this;
        }
        Preloader.prototype.preload = function () {
            this.preloadBar = this.add.sprite(300, 400, 'preloadBar');
            this.load.setPreloadSprite(this.preloadBar);
            this.load.image('backPart', 'assets/backPart.png');
            this.load.image('backPartMainBg', 'assets/backPartMainBg.png');
            this.load.image('bar', 'assets/bar.png');
            this.load.image('betBg', 'assets/betBg.png');
            this.load.image('betBgPending', 'assets/betBgPending.png');
            this.load.image('frontPart', 'assets/frontPart.png');
            this.load.image('lastPlacedCircle', 'assets/lastPlacedCircle.png');
            this.load.image('mainBg', 'assets/mainBg.png');
            this.load.image('moreButton', 'assets/moreButton.png');
            this.load.image('pressedColumn', 'assets/pressedColumn.png');
            this.load.image('redStone', 'assets/redStone.png');
            this.load.image('winnerCircle', 'assets/winnerCircle.png');
            this.load.image('yellowStone', 'assets/yellowStone.png');
        };
        Preloader.prototype.create = function () {
            this.game.state.start('Main');
        };
        return Preloader;
    }(Phaser.State));
    MyGame.Preloader = Preloader;
})(MyGame || (MyGame = {}));
var MyGame;
(function (MyGame) {
    var Vector2 = (function () {
        function Vector2(x, y) {
            x = this.x;
            y = this.y;
        }
        return Vector2;
    }());
    MyGame.Vector2 = Vector2;
})(MyGame || (MyGame = {}));
//# sourceMappingURL=game.js.map