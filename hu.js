var canvas = document.getElementById("canvas");
var context = canvas.getContext('2d');
var HEIGHT = WIDTH = 200;
canvas.height = HEIGHT;
canvas.width = WIDTH;

var CELLW = 10;
var NROWS = HEIGHT/CELLW;
var NCOLS = WIDTH/CELLW;

var GAME_STATE = [];

var ui = (function(){
  var game_context = window.context;
  var canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.id = "ui";
  var context = canvas.getContext("2d");
  document.getElementById("wrapper").appendChild(canvas);
  var _h,_c;
  function draw() {
    context.clearRect(0,0,WIDTH,HEIGHT);
    //draw grid
    for (var i=1;i<NROWS;i++) { rect({x:0,y:i*CELLW,h:1,w:WIDTH,color:"gray"},context) }
    for (var i=1;i<NCOLS;i++) { rect({x:i*CELLW,y:0,h:HEIGHT,w:1,color:"gray"},context) }

    // hover and click
    if (_h) { rect({x:_h[0]*CELLW,y:_h[1]*CELLW,w:CELLW,h:CELLW,color:"rgba(255,0,0,0.5)"},context); }
    if (_c) {
      rect({x:_h[0]*CELLW,y:_h[1]*CELLW,w:CELLW,h:CELLW,color:"white"},game_context);
      _c = undefined;
      window.getStateFromCanvas();
    }
  }
  canvas.addEventListener("mousemove",function(e) {_h = [~~(e.layerX/CELLW),~~(e.layerY/CELLW)];});
  canvas.addEventListener("mousedown",function(e) {_c = [~~(e.layerX/CELLW),~~(e.layerY/CELLW)];});
  canvas.addEventListener("mouseout",function(e) {_h=undefined;});
  setInterval(draw,50);
})();
  
function resetState () {
  GAME_STATE = [];
  var _r;
  for (var row=0;row<NROWS*NCOLS;row++) {
    GAME_STATE.push(0);
  }
}

getCellByIndex = (function() {
  //cache these two for later
  ROW_MAX = NROWS-1;
  COL_MAX = NCOLS-1;
  return function (row,col) {
    if (row == -1) { row = NROWS -1; }
    else if (row == NROWS) { row = 0; }
    if (col == -1) { col = NCOLS -1; }
    else if (col == NCOLS) { col = 0; }
    return GAME_STATE[row*NCOLS+col];
  }
})()

function getStateFromCanvas() {
  resetState();
  var _r;
  var data = context.getImageData(0,0, WIDTH, HEIGHT).data;
  var i = data.length/4;
  count = 0;
  while(i--) {
    count +=1;
    row = Math.floor(i/(NCOLS*CELLW*CELLW));
    col = Math.floor(i/CELLW)%(NCOLS);
    GAME_STATE[NCOLS*row+col] += data[i*4];
    //console.log("i"+i+" r"+row+" c"+col+" v"+data[i*4]);
  }
  var norm = CELLW*CELLW*255;
  for (var i=0;i<NROWS*NCOLS;i++) {
    GAME_STATE[i] = Math.round(GAME_STATE[i]/norm);
  }
}

function nextGameState() {
  var new_state = GAME_STATE.slice(); //done to make array of same dimensions
  var neighbors_alive,cell_number;
  for (var row=0;row<NROWS;row++) {
    for (var col=0;col<NCOLS;col++) {
      cell_number = row*NROWS+col;
      neighbors_alive = 0;
      neighbors_alive += getCellByIndex(row-1,col+1);
      neighbors_alive += getCellByIndex(row-1,col);
      neighbors_alive += getCellByIndex(row-1,col-1);
      neighbors_alive += getCellByIndex(row,col+1);
      neighbors_alive += getCellByIndex(row,col-1);
      neighbors_alive += getCellByIndex(row+1,col+1);
      neighbors_alive += getCellByIndex(row+1,col);
      neighbors_alive += getCellByIndex(row+1,col-1);
      if (GAME_STATE[cell_number] == 0) { //cell is dead
        new_state[cell_number] = 1*(neighbors_alive == 3);
      } else {
        new_state[cell_number] = 1*(neighbors_alive == 2 || neighbors_alive == 3);
      }
      //console.log(" r"+row+" c"+col+" na"+neighbors_alive+" new"+new_state[cell_number]);
    }
  }
  GAME_STATE = new_state;
}

function draw() {
  rect({x:0,y:0,w:WIDTH,h:HEIGHT,color:'#000'},context);
  for (var row=0;row<NROWS;row++) {
    for (var col=0;col<NCOLS;col++) {
      if (!!GAME_STATE[row*NCOLS+col]) {
        rect({x:col*CELLW,y:row*CELLW,w:CELLW,h:CELLW,color:"white"},context);
      }
    }
  }
}

function rect(r,ctx) {
  ctx.fillStyle = r.color;
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.fill();
  ctx.closePath();
}

rect({x:0,y:0,w:WIDTH,h:HEIGHT,color:'#FFF'},context);

(function() {var start = new Date().valueOf();
draw();
getStateFromCanvas();
console.log(new Date().valueOf()-start);
})()

var interval;
function start() {
  stop();
  window.interval = setInterval(function() {nextGameState();draw()},500);
}
function stop() {
  clearInterval(window.interval)
}
