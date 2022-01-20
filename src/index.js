let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

let brush = {
    objName: "Brush",
    strokeWeight: 1, // 1w
    opacity: 0.1, // 10% opacity
    draw: false, // Used to check if drawing mode is on or off
    rgb: [255, 255, 255], // Makes black the default
    //last_key: 'a', // Last key pressed. Now deprecated, used to be for the undo function (control + z).
    previous: {x: 0, y: 0}, // Used for when connecting a line to an endpoint, this (x,y) pair is the beggining point of the line
    current: {x: 0, y: 0} // Used for when connecting a line to an endpoint, this (x,y) pair is the ending point of the line
};

let curves = {
    objName: "Curves",
    points: [],
    paths: []
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
    }
}

function stop(e) {
    brush.draw = false;
    curves.paths.push(curves.points);
    ctx.beginPath();
}

function Undo() {
    curves.paths.splice(-1, 1);
    drawPaths();
}

function drawPaths() {
    clear(false);
    ctx.lineWidth = brush.strokeWeight * 1.3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    curves.paths.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0].x,path[0].y);  
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x,path[i].y); 
        }
        ctx.stroke();
    })
}

window.addEventListener('resize', resizeCanvas);
function resizeCanvas () {
    // To-do: make this function return a respective ratio of the resize, and fix canvas being cleared when resizing.
    //(a): FIX: upon resizing, control z first functions as a UNDO once, but load the canvas that was unloaded upon resizing, lol....
    canvas.width = window.innerWidth - screen.width / 4;
    canvas.height = window.innerHeight - screen.height / 8;
}