import FFT from 'fft.js'

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;

const points = new Array<{ x: number, y: number, segmentLength: number }>();
let unclosedLength = 0;
let unclosedPath = new Path2D();

const fftSize = 4096;
const fft = new FFT(fftSize);
const input = fft.createComplexArray() as number[];
const output = fft.createComplexArray() as number[];
const components = new Array<{ frequency: number, magnitude: number, phase: number }>();
const arcs = new Array<{ x: number, y: number, ray: number }>();
let parameter = 0;
let complexity = 0;
let circles: boolean = false;
let hasCapture = false;

function updateCanvasSize() {
    canvas.width = window.devicePixelRatio * canvas.clientWidth;
    canvas.height = window.devicePixelRatio * canvas.clientHeight;
}

window.addEventListener('resize', function () { updateCanvasSize(); redraw(); });
updateCanvasSize();

canvas.onmousedown = function (e) {
    if (e.button === 0) {
        hasCapture = true;
        //canvas.setPointerCapture((e as PointerEvent).pointerId);
        addPoint(e.offsetX, e.offsetY);
    }
};

canvas.ontouchstart = canvas.ontouchmove = function (e) {
    if (e.touches.length === 1) {
        addPoint(e.changedTouches[0].clientX - canvas.offsetLeft, e.changedTouches[0].clientY - canvas.offsetTop);
        e.preventDefault();
    }
};

canvas.onmousemove = function (e) {
    if (hasCapture) addPoint(e.offsetX, e.offsetY);
};

canvas.onmouseup = function (e) {
    if (hasCapture) {
        hasCapture = false;
        //canvas.releasePointerCapture((e as PointerEvent).pointerId);
    }
};

document.getElementById('clear-button')!.onclick = function () {
    points.splice(0, points.length);
    unclosedLength = 0;
    unclosedPath = new Path2D();
    components.splice(0, components.length);
    redraw();
};

const parameterSlider = document.getElementById('parameter-slider') as HTMLInputElement;
parameterSlider.max = (fftSize - 1).toString();
parameterSlider.oninput = function () {
    parameter = parameterSlider.valueAsNumber * Math.PI * 2 / fftSize;
    redraw();
};
const complexityNumber = document.getElementById('complexity-number') as HTMLInputElement;
complexityNumber.max = fftSize.toString();
complexityNumber.oninput = function () {
    complexity = complexityNumber.valueAsNumber;
    redraw();
};
const complexityCircles = document.getElementById('complexity-circles-check') as HTMLInputElement;
circles = complexityCircles.checked;
complexityCircles.oninput = function () {
    circles = complexityCircles.checked;
    redraw();
};

function magnitude(x: number, y: number) { return Math.sqrt(x * x + y * y); }

function lerp(first: number, second: number, t: number) { return first + (second - first) * t; }

function addPoint(x: number, y: number) {
    if (points.length === 0) {
        points.push({ x, y, segmentLength: 0 });
        points.push({ x, y, segmentLength: 0 });
    } else {
        const previousPoint = points[points.length - 1];
        const segmentLength = magnitude(x - previousPoint.x, y - previousPoint.y);
        unclosedLength += segmentLength;
        points[points.length - 1] = { x, y, segmentLength };
        const firstPoint = points[0];
        points.push({ x: firstPoint.x, y: firstPoint.y, segmentLength: magnitude(firstPoint.x - x, firstPoint.y - y) });
    }

    unclosedPath.lineTo(x, y);

    if (unclosedLength > 0) {
        samplePathIntoInput();
        fft.transform(output, input);
        calculateSortedComponentsFromOutput();
    } else {
        components.splice(0, components.length);
    }

    redraw();
}

function samplePathIntoInput() {
    let lengthIncludingSegment = 0;

    let previousPoint = points[0];
    let segmentStartSample = 0;

    const closedLength = unclosedLength + points[points.length - 1].segmentLength;

    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        lengthIncludingSegment += point.segmentLength;

        const segmentEndSample = Math.round(fftSize * lengthIncludingSegment / closedLength);
        const segmentSampleLength = segmentEndSample - segmentStartSample + 1;

        for (let s = segmentStartSample; s < segmentEndSample; s++) {
            const t = (s - segmentStartSample) / segmentSampleLength;
            input[2 * s] = lerp(previousPoint.x, point.x, t);
            input[2 * s + 1] = lerp(previousPoint.y, point.y, t);
        }

        previousPoint = point;
        segmentStartSample = segmentEndSample;
    }
}

function calculateSortedComponentsFromOutput() {
    components.splice(0, components.length);

    for (let i = 0; i < fftSize; i++) {
        const x = output[2 * i], y = output[2 * i + 1];
        components.push({
            frequency: i < fftSize / 2 ? i : i - fftSize,
            magnitude: magnitude(x, y) / fftSize,
            phase: Math.atan2(y, x)
        });
    }

    components.sort((a, b) => b.magnitude - a.magnitude);
}

function redraw() {
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const closedPath = new Path2D(unclosedPath);
    closedPath.closePath();
    context.strokeStyle = 'black';
    context.stroke(closedPath);

    if (components.length > 0) {

        let x = 0, y = 0, maxI = Math.min(components.length, (complexity <= 0 ? components.length : (complexity + 1)));

        if (circles) {
            let new_x, new_y, ray;
            context.beginPath(); //New drawing part
            for (let i = 0; i < maxI; i++) {
                const component = components[i];
                const angle = parameter * component.frequency + component.phase;
                new_x = x + component.magnitude * Math.cos(angle);
                new_y = y + component.magnitude * Math.sin(angle);
                if (i >= 1) { //Draw arc? (min first segment)
                    ray = Math.sqrt(Math.pow(new_x - x, 2) + Math.pow(new_y - y, 2));
                    arcs.push({
                        x: x,
                        y: y,
                        ray: ray,
                    })
                }
                else {
                    arcs.splice(0, arcs.length); //Reset arcs
                }

                context.lineTo(new_x, new_y); //Draw the line starting from old to new coords

                x = new_x;
                y = new_y;
            }
            context.strokeStyle = 'red';
            context.stroke(); //Actually draw

            context.beginPath(); //New drawing part
            for (let i = 0; i < arcs.length; i++) {
                context.moveTo(arcs[i].x + arcs[i].ray, arcs[i].y); //Move to the right most circle point (0�)
                context.arc(arcs[i].x, arcs[i].y, arcs[i].ray, 0, 2 * Math.PI); //Draw the circle starting from 0 rad (0�) to 2*PI rad (360�)
            }
            context.strokeStyle = 'burlywood';
            context.stroke(); //Actually draw

            arcs.splice(0, arcs.length); //Reset arcs
        }
        else {
            context.beginPath(); //New drawing part
            for (let i = 0; i < maxI; i++) {
                const component = components[i];
                const angle = parameter * component.frequency + component.phase;
                x += component.magnitude * Math.cos(angle);
                y += component.magnitude * Math.sin(angle);
                context.lineTo(x, y); //Draw the line starting from old to new coords
            }
            context.strokeStyle = 'red';
            context.stroke(); //Actually draw
        }

        if (complexity > 0) {
            context.beginPath();
            for (let p = 0; p < fftSize; p++) { //fftSize
                x = 0; y = 0;
                for (let i = 0; i < maxI; i++) {
                    const component = components[i];
                    const angle = p * component.frequency + component.phase;
                    x += component.magnitude * Math.cos(angle);
                    y += component.magnitude * Math.sin(angle);
                }
                context.rect(x, y, 1, 1);
            }
            context.strokeStyle = "green";
            context.stroke();
        }
    }
}
