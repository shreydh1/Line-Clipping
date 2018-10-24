var inputLines = document.getElementById("lines");
    numLines = inputLines.value;
var inputPoints = document.getElementById("points");
    numPoints = inputPoints.value;

var pt = 2;

function resizeCanvas(canvas) {
    canvas.width = 480;
    canvas.height = 480;
}

function Box(name, color) {
    this.el = document.getElementById(name);
    resizeCanvas(this.el);
    this.width = this.el.width;
    this.height = this.el.height;
    this.color = color;
    this.ctx = this.el.getContext("2d");
    this.clear = function () {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(0,0, this.width, this.height);
    };
    this.draw_points = function(points) {
        for(var i = 0; i < points.length; i++) {
            if (arguments[1]) {
                this.ctx.fillStyle = arguments[1];
            } else {
                this.ctx.fillStyle = 'rgb(' + rand(0,255) + ', ' + rand(0,255) + ', ' + rand(0, 255) + ')';
            }
            this.ctx.fillRect(points[i][0], points[i][1], pt, pt);
        }
    };
    this.draw_lines = function (points) {
        for(var i = 0; i < points.length - 1; i += 2) {
            if (arguments[1]) {
                this.ctx.strokeStyle = arguments[1];
            } else {
                this.ctx.strokeStyle = 'rgb(' + rand(0,255) + ', ' + rand(0,255) + ', ' + rand(0, 255) + ')';
            }
            this.ctx.beginPath();
            this.ctx.moveTo(points[i][0], points[i][1]);
            this.ctx.lineTo(points[i + 1][0], points[i + 1][1]);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    };
}

function ClippingWindow(ctx, x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.draw = function() {
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.closePath();
        ctx.stroke();
    };
}

function clip_points(points, clippingWindow) {
    var i,x,y,
        clipped = [];
    for (i = 0; i < points.length; i++) {
        x = points[i][0];
        y = points[i][1];
        if(x > clippingWindow.x && x < clippingWindow.x + clippingWindow.w &&
            y > clippingWindow.y && y < clippingWindow.y + clippingWindow.h) {
            clipped.push([x, y]);
        }
    }
    return clipped;
}

var INSIDE = 0; // 0000
var LEFT = 1;   // 0001
var RIGHT = 2;  // 0010
var BOTTOM = 4; // 0100
var TOP = 8;    // 1000

function computeOutCode(x, y, clip) {
	var code = INSIDE;
	if (x < clip.x)
		code |= LEFT;
	else if (x > clip.x + clip.w)
		code |= RIGHT;
	if (y < clip.y)
		code |= BOTTOM;
	else if (y > clip.y + clip.h)
		code |= TOP;

    return code;
}
function cohenSuther(x0, y0, x1, y1, clip) {
	var outcode0 = computeOutCode(x0, y0, clip),
    outcode1 = computeOutCode(x1, y1, clip),
    accept = false;

    while(true) {
        if(!(outcode0 | outcode1)) {
            accept = true;
            break;
        } else if (outcode0 & outcode1) {
            break;
        } else {
            var x, y,
                outcodeOut = outcode0 ? outcode0 : outcode1;

            if(outcodeOut & TOP) {
                x = x0 + (x1 - x0) * (clip.y + clip.h - y0) / (y1 - y0);
                y = clip.y + clip.h;
            } else if(outcodeOut & BOTTOM) {
                x = x0 + (x1 - x0) * (clip.y - y0) / (y1 - y0);
                y = clip.y;
            }

            if(outcodeOut & RIGHT) {
                y = y0 + (y1- y0) * (clip.x + clip.w - x0) / (x1 - x0);
                x = clip.x + clip.w;
            } else if(outcodeOut & LEFT) {
                y = y0 + (y1- y0) * (clip.x - x0) / (x1 - x0);
                x = clip.x;
            }

            if(outcodeOut === outcode0) {
                x0 = x;
                y0 = y;
                outcode0 = computeOutCode(x0, y0, clip);
            } else {
                x1 = x;
                y1 = y;
                outcode1 = computeOutCode(x1, y1, clip);
            }
        }
    }
    if (accept) {
        return [[x0, y0], [x1, y1]];
    }
}

function clip_lines(points, clippingWindow) {
    var i,x0,y0,x1,y1,
        clippedLine = [],
        clipped = [];
    for (i = 0; i < points.length - 1; i+= 2) {
        x0 = points[i][0];
        y0 = points[i][1];
        x1 = points[i + 1][0];
        y1 = points[i + 1][1];
        clippedLine = cohenSuther(x0, y0, x1, y1, clippingWindow);
        if (clippedLine) {
            clipped.push(clippedLine[0]);
            clipped.push(clippedLine[1]);
        }
    }
    return clipped;
}

function scale(clipped) {
    var i,x,y,
        scaled = [],
        sx = world.width / clippingWindow.w;
        sy = world.height / clippingWindow.h;

    for(i = 0; i < clipped.length; i++) {
        x = (clipped[i][0] - clippingWindow.x) * sx;
        y = (clipped[i][1] - clippingWindow.y) * sy;
        console.log(x);
        scaled.push([x,y]);
    }

    return scaled;
}

function rand(min, max) {
    'use strict';
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function gen_points(numPoints) {
    var i,x,y,
        pt = 2,
        points = [];

    for(i = 0; i < numPoints; i++) {
        x = rand(0, world.width);
        y = rand(0, world.height);
        points.push([x,y]);
    }

    return points;
}

function gen_lines(numLines) {
    var i,x,y,
        pt = 2,
        lines = [];

    for(i = 0; i < numLines * 2; i++) {
        x = rand(0, world.width);
        y = rand(0, world.height);
        lines.push([x,y]);
    }

    return lines;
}

var world = new Box("world", 'black');
var viewport = new Box("viewport", 'white');
var clippingWindow = new ClippingWindow(world.ctx,10,10, 200,100);
var points = [];
var lines = [];

function setup() {
    points = gen_points(inputPoints.value);
    lines = gen_lines(inputLines.value);
    update();
}

function update() {
    world.clear();
    viewport.clear();
    clippingWindow.draw();
    world.draw_points(points);
    world.draw_lines(lines);
    viewport.draw_points(scale(clip_points(points, clippingWindow)), 'red');
    viewport.draw_lines(scale(clip_lines(lines, clippingWindow)), 'red');
}

window.onload = setup;
inputPoints.onchange = setup;
inputLines.onchange = setup;

window.addEventListener('keydown', function (e) {
    if (e.keyCode === 38) {
        clippingWindow.y -= 10;
    }
    if (e.keyCode === 40) {
        clippingWindow.y += 10;
    }
    if (e.keyCode === 37) {
        clippingWindow.x -= 10;
    }
    if (e.keyCode === 39) {
        clippingWindow.x += 10;
    }
    if (e.keyCode === 61 || e.keyCode === 187) {
        clippingWindow.w += 10;
        clippingWindow.h += 10;
    }
    if (e.keyCode === 61 || e.keyCode === 187) {
        clippingWindow.w += 10;
        clippingWindow.h += 10;
    }
    if (e.keyCode === 173 || e.keyCode == 189) {
        clippingWindow.w -= 10;
        clippingWindow.h -= 10;
    }
    update();
}, false);
