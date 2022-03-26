let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");
resize(window.innerWidth - screen.width / 4, window.innerHeight - screen.height / 8);

// Used as a parser to convert the brush.rgb attribute to a hex
function getterRGBA(rgba) {
    return "rgba(" + rgba[0].toString() + ", " + rgba[1].toString() + ", " + rgba[2].toString() + ", " + rgba[3].toString() + ")";
}

// Updates the brush attributes
function updateBrush() {
    ctx.lineWidth = brush.strokeWeight;
    ctx.lineCap = brush.lineCap;
    ctx.strokeStyle = getterRGBA(brush.rgba);
}

// Function called to resize the canvas
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

// Get the values from sliders in htmldoc and update brush attributes
function sliderGetterSetter() {
    let red_slider = document.getElementsByName('red_slider')[0];
    let green_slider = document.getElementsByName('green_slider')[0];
    let blue_slider = document.getElementsByName('blue_slider')[0];
    let opacity_slider = document.getElementsByName('opacity_slider')[0];
    let thickness_slider = document.getElementsByName('thickness_slider')[0];
    brush.strokeWeight = parseInt(thickness_slider.value);
    brush.rgba = [parseInt(red_slider.value), parseInt(green_slider.value), parseInt(blue_slider.value), parseInt(opacity_slider.value) / 100];
    updateBrush();
}

let brush = {
    objName: "Brush",
    strokeWeight: 2, // 2w
    lineCap: "round",
    draw: false, // Used to check if drawing mode is on or off
    rgba: [150, 150, 150, 1], // Makes black the default
    previous: {x: 0, y: 0}, // Used for when connecting a line to an endpoint, this (x,y) pair is the beggining point of the line
    current: {x: 0, y: 0} // Used for when connecting a line to an endpoint, this (x,y) pair is the ending point of the line
};

let curves = {
    objName: "Curves",
    points: [], // A list used as a cache by the draw/stop functions. When the stop function is called, the element is added to the paths list.
    paths: [], // All paths draw in the canvas. (Every element of this list is a set of moves required to draw the line.) First element is (x_start, y_start) and the last element is (x_end, y_end)
    redo_stack: [], // A implementation of a stack used for the redo function
    previous_rgbas: [], // All RGBA sets corresponding to the paths.
    previous_thickness: [],
    redo_previous_rgbas: [],
    redo_previous_thickness: []
}

canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);
window.addEventListener('keydown', catchKeyPress);
window.addEventListener('resize', resizeCanvas);
function resizeCanvas () {
    resize(window.innerWidth - screen.width / 2.4, window.innerHeight - screen.height / 6);
}

// Function called on mousedown event
function start(e) {
    sliderGetterSetter();
    brush.previous = {x: brush.current.x, y: brush.current.y};
    brush.draw = true;
    
    brush.current = oMousePos(e);

    curves.points = [];
    curves.points.push({x: brush.current.x, y: brush.current.y});
}

// Function called on mouseup event
function stop(e) {
    brush.draw = false;
    curves.paths.push(curves.points);
    curves.previous_rgbas.push(brush.rgba);
    curves.previous_thickness.push(brush.strokeWeight);
    ctx.beginPath();
}

// Function to calc relative mouse pos
function oMousePos(e) {
    var ClientRect = canvas.getBoundingClientRect();
    return { 
        x: Math.round(e.clientX - ClientRect.left),
        y: Math.round(e.clientY - ClientRect.top)
    }
}

// Function called onmousemove
function draw (e) {
    if (!brush.draw) return;

    brush.previous = {x: brush.current.x, y: brush.current.y};
    brush.current = oMousePos(e);
    curves.points.push({x: brush.current.x, y: brush.current.y});

    // Draw Algorithm
    ctx.beginPath();
    ctx.moveTo(brush.previous.x,brush.previous.y);
    ctx.lineTo(brush.current.x,brush.current.y);
    ctx.stroke();
}

// Function called to clear the canvas
function clear(flush) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (flush) {
        curves.points = [];
        curves.paths = [];
        curves.redo_stack = [];
        curves.previous_rgbas = [];
        curves.previous_thickness = [];
    }
}

// Keybind Controler
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

// Undo Feature (ctrl+z)
function Undo() {
    if (curves.paths.length > 0) {
        let t = curves.paths.pop();
        let s = curves.previous_rgbas.pop();
        let u = curves.previous_thickness.pop();
        curves.redo_stack.push(t);
        curves.redo_previous_rgbas.push(s);
        curves.redo_previous_thickness.push(u);
        drawPaths();
    }
}

// Redo Feature (ctrl+y)
function Redo() {
    if (curves.redo_stack.length > 0) {
        let t = curves.redo_stack.pop();
        let s = curves.redo_previous_rgbas.pop();
        let u = curves.redo_previous_thickness.pop();
        curves.paths.push(t);
        curves.previous_rgbas.push(s);
        curves.previous_thickness.push(u);
        drawPaths();
    }
}

// Function used by the Undo() and Redo() functions to redraw the canvas after the stack changes have been made.
function drawPaths() {
    clear(false);
    updateBrush();
    for (let j = curves.paths.length - 1; j >= 0; j--) {
        path = curves.paths[j];
        ctx.strokeStyle = getterRGBA(curves.previous_rgbas[j]);
        ctx.lineWidth = curves.previous_thickness[j];
        for (let i = 0; i < path.length - 1; i++) {
            ctx.beginPath();
            ctx.moveTo(path[i].x, path[i].y);
            ctx.lineTo(path[i+1].x, path[i+1].y);
            ctx.stroke();
        }
    }
}