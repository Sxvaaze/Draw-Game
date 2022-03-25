let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

let brush = {
    objName: "Brush",
    strokeWeight: 2, // 1w
    opacity: 0.1, // 10% opacity
    draw: false, // Used to check if drawing mode is on or off
    rgb: [255, 255, 255], // Makes black the default
    previous: {x: 0, y: 0}, // Used for when connecting a line to an endpoint, this (x,y) pair is the beggining point of the line
    current: {x: 0, y: 0} // Used for when connecting a line to an endpoint, this (x,y) pair is the ending point of the line
};

let curves = {
    objName: "Curves",
    points: [], // A list used as a cache by the draw/stop functions. When the stop function is called, the element is added to the paths list.
    paths: [], // All paths draw in the canvas. (Every element of this list is a set of moves required to draw the line.) First element is (x_start, y_start) and the last element is (x_end, y_end)
    redo_stack: [] // A implementation of a stack used for the redo function
}

canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);
window.addEventListener('keydown', catchKeyPress);

function start (e) {
    brush.previous = {x: brush.current.x, y: brush.current.y};
    brush.draw = true;
    
    brush.current = oMousePos(e);

    curves.points = [];
    curves.points.push({x: brush.current.x, y: brush.current.y});
}

function oMousePos(e) {
    var ClientRect = canvas.getBoundingClientRect();
    return { 
        x: Math.round(e.clientX - ClientRect.left),
        y: Math.round(e.clientY - ClientRect.top)
    }
}

function draw (e) {
    if (!brush.draw) return;
    ctx.lineWidth = brush.strokeWeight;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    brush.previous = {x: brush.current.x, y: brush.current.y};
    brush.current = oMousePos(e);
    curves.points.push({x: brush.current.x, y: brush.current.y});

    // Draw Algorithm
    ctx.beginPath();
    ctx.moveTo(brush.previous.x,brush.previous.y);
    ctx.lineTo(brush.current.x,brush.current.y);
    ctx.stroke();
}

function clear(flush) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (flush) {
        curves.points = [];
        curves.paths = [];
    }
}

function catchKeyPress(e) {
    switch (e.code) {
        case 'KeyC':
            clear(true);
            break;
        case 'KeyZ':
            if (e.ctrlKey) {
                Undo();
            }
            break;
        case 'KeyY':
            if (e.ctrlKey) {
                Redo();
            }
            break;
    }
}

function stop(e) {
    brush.draw = false;
    curves.paths.push(curves.points);
    ctx.beginPath();
}

function Undo() {
    if (curves.paths.length > 0) {
        let t = curves.paths.splice(-1, 1);
        curves.redo_stack.push(t);
        drawPaths();
    }
}

function Redo() {
    if (curves.redo_stack.length > 0) {
        let s = curves.redo_stack.splice(-1, 1);
        curves.paths.push(s[0][0]);
        drawPaths();
    }
}

function drawPaths() {
    clear(false);
    ctx.lineWidth = brush.strokeWeight;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    curves.paths.forEach(path => {
        for (let i = 0; i < path.length-1; i++) {
            ctx.beginPath();
            ctx.moveTo(path[i].x, path[i].y);
            ctx.lineTo(path[i+1].x, path[i+1].y);
            ctx.stroke();
        }
    })
}

function resize(w, h){
    // Create a temporary canvas obj to cache the pixel data
    var temp_cnvs = document.createElement('canvas');
    var temp_cntx = temp_cnvs.getContext('2d');
    // Set it to the new width & height and draw the current canvas data into it 
    temp_cnvs.width = w; 
    temp_cnvs.height = h;
    temp_cntx.fillStyle = "white";  // the original canvas' background color
    temp_cntx.fillRect(0, 0, w, h);
    temp_cntx.drawImage(canvas, 0, 0);
    // Resize & clear the original canvas and copy back in the cached pixel data
    canvas.width = w; 
    canvas.height = h;
    ctx.drawImage(temp_cnvs, 0, 0);
    }

window.addEventListener('resize', resizeCanvas);
function resizeCanvas () {
    resize(window.innerWidth - screen.width / 4, window.innerHeight - screen.height / 8);
}