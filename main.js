window.onload = function() {
	this.Game = (function() {
		const viewportWidth = 1920;
		const viewportHeight = 1080;
		const tileSize = 50;
		
		var Camera = {
			x: 0,
			y: 0,
			w: 720,
			h: 480,
			stiffness: 1
		};
		
		var Player = (function() {
			var x = 50;
			var y = 50;
			var speed = 5;
			
			function getRelX() {
				return x - Camera.x;
			}
			
			function getRelY() {
				return y - Camera.y;
			}
			/*
			var data = {
				x: 50,
				y: 50,
				get relX() {
					return x - Camera.x;
				},
				get relY() {
					return y - Camera.y;
				},
				
				speed: 1
			};*/
			
			
			 
			var move = function(t,s) {
				console.log(t);
				if ((getRelX() + t > Camera.w) || (getRelX() + t < 0))
					Camera.x += t*speed;
				x += t*speed;
				console.log(x);
				
				if ((getRelY() + s > Camera.h) || (getRelY() + s < 0))
					Camera.y += s*speed;
				y += s*speed;
			};
			
			var player_exported = {
				get x() {
					return x;
				},
				get y() {
					return y;
				},
				speed: speed,
			    get relX() {
					return getRelX();
				},
				get relY() {
					return getRelY();
				},
				move: move
			};
			return player_exported;
		})();
		
		var Map = (function() {
			//In tiles
			const mapWidth = 500;
			const mapHeight = 100;
			
			function Tile() {
				this.isFloor = false;
			}
			
			var tiles = (function() {
				var L = [];
				for (i in mapHeight) {
					let Q = [];
					for (j in mapWidth)
						Q.push(new Tile());
					L.push(Q);
				}
				return L;
			})();
			
			var tileAt = function(x,y) {
				return tiles[y][x];
			};
			
			var map_exported = {
				width: mapWidth,
				height: mapHeight,
				tiles: tiles,
				tileAt: tileAt
			};
			return map_exported;
		})();
		
		var Canvas = (function() {
			var canvas = document.getElementById("gameCanvas");
			var ctx = canvas.getContext("2d");
			
			var tileColor = "#aaa";
			
			//Self-running
			var init = (function() {
				var inner = function() {
					canvas.setAttribute("width", viewportWidth);
					canvas.setAttribute("height", viewportHeight);
					ctx.strokeStyle = tileColor;
				};
				inner();
				return inner;
			})();
			
			
			function gCoordsToC(x,y) {
				return {
					x: x - Camera.x,
					y: y - Camera.y
				};
			}
			
			var clear = function() {
				ctx.clearRect(0,0,viewportWidth,viewportHeight);
			}
			
			var drawTiles = function() {
				ctx.beginPath();
				for (var i = Camera.x%(tileSize); i <= Camera.w; i+=tileSize) {
					ctx.moveTo(i,0);
					ctx.lineTo(i,Camera.h);
				}
				for (var j = Camera.y%(tileSize); j <= Camera.h; j+=tileSize) {
					ctx.moveTo(0,j);
					ctx.lineTo(Camera.w,j);
				}
				ctx.stroke();
			};
			
			var drawPlayer = function() {
				ctx.beginPath();
				ctx.arc(Player.relX,Player.relY,50,0,2*Math.PI);
				ctx.closePath();
				ctx.fill();
			};
			
			var draw = function() {
				drawTiles();
				drawPlayer();
			};
			
			var redraw = function() {
				clear();
				draw();
			};
			
			var canvas_exported = {
				redraw: redraw
			};
			return canvas_exported;
		})();
		
		var Engine = (function() {
			var fps = 1/60;
			var iid;
			
			var Input = (function() {
				const keyCodes = {
					UP: 87,
					RIGHT: 68,
					DOWN: 83,
					LEFT: 65,
					JUMP: 32
				};
				
				var keyStates = (function() {
					var states = {};
					
					//Build state list based on defined keyCodes
					for (i of Object.values(keyCodes)) {
						console.log(i);
						states[i] = false;
					}
					
					return states;
				})();
				
				console.log(keyStates);
				
				/*var keyMap = {
					87: UP,			//W
					38: UP,			//UpArrow
					68: RIGHT,		//D
					39: RIGHT,		//RightArrow
					83: DOWN,		//S
					40: DOWN,		//DownArrow
					65: LEFT,		//A
					37: LEFT,		//LeftArrow
				}*/
				
				var keyDown = function(key) {
					keyStates[key] = true;
				};
				
				var keyUp = function(key) {
					keyStates[key] = false;
				};
				
				var keySwitch = function(key) {
					keyStates[key] = !key.keyMap[key];
				}
				
				var getKey = function(key) {
					return keyStates[key];
				}
				
				var getKeysPressed = function() {
					var L = [];
					for (i of Object.keys(keyStates)) {
						if (getKey(i))
							L.push(i);
					}
					return L;
				};
				
				//Event Listeners
				document.addEventListener('keydown', function(e) {
					switch (e.which) {
						case keyCodes.UP:
							keyDown(e.which);
							break;
						case keyCodes.RIGHT:
							keyDown(e.which);
							break;
						case keyCodes.DOWN:
							keyDown(e.which);
							break;
						case keyCodes.LEFT:
							keyDown(e.which);
							break;
						case keyCodes.JUMP:
							keyDown(e.which);
							break;
						default:
					}
				});
				
				document.addEventListener('keyup', function(e) {
					switch (e.which) {
						case keyCodes.UP:
							keyUp(e.which);
							break;
						case keyCodes.RIGHT:
							keyUp(e.which);
							break;
						case keyCodes.DOWN:
							keyUp(e.which);
							break;
						case keyCodes.LEFT:
							keyUp(e.which);
							break;
						case keyCodes.JUMP:
							keyUp(e.which);
							break;
						default:
					}
				});
				
				var input_exported = {
					getKey: getKey,
					keyDown: keyDown,
					keyUp: keyUp,
					keySwitch: keySwitch,
					keyCodes: keyCodes,
					get keysPressed() {
						return getKeysPressed();
					},
				};
				return input_exported;
			})();
			
			var keysPressedLastFrame = [];
			var keysPressedThisFrame = [];
			
			//Main Game Loop////////
			var step = function() {
				//Update input for this frame
				keysPressedLastFrame = keysPressedThisFrame.slice();
				keysPressedThisFrame = Input.keysPressed.slice();
				
				console.log(Player.x);
				
				if (Input.getKey(Input.keyCodes.UP))
					Player.move(0,-1);
				if (Input.getKey(Input.keyCodes.RIGHT))
					Player.move(1,0);
				if (Input.getKey(Input.keyCodes.DOWN))
					Player.move(0,1);
				if (Input.getKey(Input.keyCodes.LEFT))
					Player.move(-1,0);
				
				Canvas.redraw();
				iid = window.requestAnimationFrame(step)
			};
			
			var start = function() {
				iid = window.requestAnimationFrame(step);
				console.log("started game");
			};
			
			var stop = function() {
				window.cancelAnimationFrame(iid);
			}
			
			var engine_exported = {
				Input: Input,
				start: start,
				stop: stop
			};
			return engine_exported;
		})();
		
		
		var game_exported = {
			Engine: Engine
		};
		return game_exported;
	})();
	
	Game.Engine.start();
};