// whiteboard collaborate on brainstorming 
// ideas, doodle, or play drawing games together.

const canvas = document.getElementById('drawing-board');
const clearBtn = document.getElementById('clear');
const widthOfLine = document.getElementById('lineWidth');
const stroke = document.getElementById('stroke');
const canvas2d = canvas.getContext('2d');

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;

canvas.width = window.innerWidth - canvasOffsetX;
canvas.height = window.innerHeight - canvasOffsetY;

let isPainting = false;
let newLineWidth = 5; 
let startX;
let startY;

clearBtn.addEventListener('click', function() {
    // Clears the canvas
    canvas2d.clearRect(0, 0, canvas.width, canvas.height);
});

stroke.addEventListener('input', function() { 
    // Changes the stroke color
    canvas2d.strokeStyle = stroke.value; 
});

widthOfLine.addEventListener('input', function() { 
    // Changes the stroke width
    newLineWidth = widthOfLine.value;
});

function draw(e){
    if(!isPainting){
        return;
    }
    canvas2d.lineWidth = newLineWidth; 
    canvas2d.lineCap = 'round';

    canvas2d.lineTo(e.clientX - canvasOffsetX, e.clientY - canvasOffsetY); // Corrected offsetY
    canvas2d.stroke();
}

canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    startX = e.clientX - canvasOffsetX;
    startY = e.clientY - canvasOffsetY;
    canvas2d.beginPath();
    canvas2d.moveTo(startX, startY);
});

canvas.addEventListener('mouseup', (e) => {
    isPainting = false;
    // Otherwise the lines will connect
    canvas2d.closePath();
});

canvas.addEventListener('mousemove', draw);
