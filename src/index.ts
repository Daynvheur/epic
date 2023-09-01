import FFT from 'fft.js';
/* DEBUG!/let startTime: number, elapsedTime: number;/* !DEBUG */

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;
const event = document.createEvent('Event'); // Baseliner event (do not trust residual data!)

const points = new Array<{ x: number, y: number, segmentLength: number }>();
let unclosedLength = 0;
let unclosedPath = new Path2D();
let closedPath: Path2D | null = null;
let complexityPath: Path2D | null = null;
let circlePath: [Path2D] | [] = [];
let linePath: [Path2D] | [] = [];

let fftSize = 4096;
let fft = new FFT(fftSize);
let input = fft.createComplexArray() as number[];
let output = fft.createComplexArray() as number[];
const components = new Array<{ frequency: number, magnitude: number, phase: number }>();
const lines = new Array<{ x: number, y: number }>();
let autoplay = false;
let parameter = 0;
let repeatplay = false;
let complexity = 0;
let circles = false;
let hasCapture = false;
let playwait = 20480.0 / fftSize;

const parameterAutoplay = document.getElementById('autoplay-parameter-check') as HTMLInputElement;
parameterAutoplay.oninput = function() {
	autoplay = parameterAutoplay.checked;
	autoplayCallback();
};
const parameterSlider = document.getElementById('parameter-slider') as HTMLInputElement;
parameterSlider.oninput = function() {
	parameter = parameterSlider.valueAsNumber;
	redraw();
};
const parameterReplay = document.getElementById('repeatplay-parameter-check') as HTMLInputElement;
parameterReplay.oninput = function() {
	repeatplay = parameterReplay.checked;
};
const fftNumber = document.getElementById('fft-number') as HTMLInputElement;
fftNumber.oninput = function() {
	changeFftSize(fftNumber.valueAsNumber);
	redraw();
};
const complexityNumber = document.getElementById('complexity-number') as HTMLInputElement;
complexityNumber.oninput = function() {
	complexity = complexityNumber.valueAsNumber;
	complexityPath = null;
	redraw();
};
const complexityCircles = document.getElementById('complexity-circles-check') as HTMLInputElement;
complexityCircles.oninput = function() {
	circles = complexityCircles.checked;
	redraw();
};

function updateCanvasSize() {
	canvas.width = window.devicePixelRatio * canvas.clientWidth;
	canvas.height = window.devicePixelRatio * canvas.clientHeight;
}

function loadLocation() { // Inspiration from https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/21152762#21152762 (qd's not stored)
	window.location.search?.substring(1).split('&')
		.forEach(item => {
			switch (item) {
				case 'circles':
					circles = complexityCircles.checked = true;
					break;

				case 'autoplay':
					autoplay = parameterAutoplay.checked = true;
					break;

				case 'replay':
					repeatplay = parameterReplay.checked = true;
					break;

				default:
					{ // no-case-declaration
						const [k, v] = item.split('=');
						if (v !== null) { // Restriction to valued keys
							const w = v && decodeURIComponent(v);
							switch (k) {
								case 'pt':
									{ // no-case-declaration
										const [x, y] = w.split(';');
										if (x !== null && y !== null)
											addPoint(Number(x), Number(y), false);
									}
									break;

								case 'autoplay':
									autoplay = parameterAutoplay.checked = Boolean(Number(w));
									break;

								case 'range':
									parameterSlider.value = w;
									break;

								case 'rangemax':
									parameterSlider.max = w;
									break;

								case 'replay':
									repeatplay = parameterReplay.checked = Boolean(Number(w));
									break;

								case 'complexity':
									complexityNumber.value = w;
									break;

								case 'fft':
									changeFftSize(Number(w));
									break;

								case 'circles':
									circles = complexityCircles.checked = Boolean(Number(w));
									break;

								case 'cp':
									{ // no-case-declaration
										const [f, m, p] = w.split(';');
										if (f !== null && m !== null && p !== null)
											components.push({ frequency: Number(f), magnitude: Number(m), phase: Number(p) });
									}
									break;
							}
						}
					}
					break;
			}
		});
}

function changeFftSize(w: number) {
	if (fftSize !== w) {
		if (fftSize > w) {
			while (fftSize > w && fftSize > Number(fftNumber.min))
				fftSize /= 2;
			parameter = Math.floor(parameterSlider.valueAsNumber * fftSize / Number(parameterSlider.max));
		} else {
			while (fftSize < w) // && fftSize < Number(fftNumber.max))
				fftSize *= 2;
			parameter = Math.round(parameterSlider.valueAsNumber * fftSize / Number(parameterSlider.max));
		}
		parameterSlider.max = fftSize.toString();
		parameterSlider.valueAsNumber = parameter;
	}

	fftNumber.valueAsNumber = fftSize;
	fft = new FFT(fftSize);
	input = fft.createComplexArray() as number[];
	output = fft.createComplexArray() as number[];
	playwait = 20480.0 / fftSize;
	computeFft();
}

function setPointsLocation() {
	let pointsString = '';
	if (points.length > 0) {
		const lastPt = points[points.length - 1];
		pointsString += `&pt=${lastPt.x};${lastPt.y}`; // Starting by the last point (to close the loop)
		const maxI = Math.min(256, points.length - 1), scaleI = points.length / maxI;
		for (let i = 0; i < maxI; i++) {
			const pt = points[Math.floor(i * scaleI)]; // Scaling resolution up to 256 pts
			pointsString += `&pt=${pt.x};${pt.y}`;
		}
	}

	setLocation(pointsString);
}

function setComponentsLocation() {
	let componentsString = '';
	if (components.length > 0) {
		const maxI = Math.min(256, components.length - 1);
		for (let i = 0; i < maxI; i++) {
			const cp = components[i]; // Keeping resolution up to 256 components
			componentsString += `&cp=${cp.frequency};${cp.magnitude};${cp.phase}`;
		}
	}

	setLocation(componentsString);
}

function setLocation(complement: string) {
	const newRelativePathQuery = window.location.pathname + '?' + 'autoplay=' + Number(autoplay) + '&' + 'range=' + parameter + '&' + 'rangemax=' + parameterSlider.max + '&' + 'replay=' + Number(repeatplay) + '&' + 'complexity=' + complexity + '&' + 'fft=' + fftSize + '&' + 'circles=' + Number(circles) + complement;
	history.pushState(null, '', newRelativePathQuery);
}

function initControls() {
	parameterSlider.max = fftSize.toString();
	parameter = parameterSlider.valueAsNumber;

	complexity = complexityNumber.valueAsNumber;

	circles = complexityCircles.checked;

	redraw();
	autoplayCallback();
}

window.addEventListener('resize', function() { updateCanvasSize(); redraw(); });
updateCanvasSize();
loadLocation();
initControls();

canvas.onpointerdown = function(e) {
	if (e.button === 0) {
		hasCapture = true;
		autoplay = false;
		canvas.setPointerCapture(e.pointerId);
		addPoint(e.offsetX, e.offsetY);
	}
};

canvas.ontouchstart = canvas.ontouchmove = function(e) {
	if (e.touches.length === 1)
		e.preventDefault();
};

canvas.onpointermove = function(e) {
	if (hasCapture)
		addPoint(e.offsetX, e.offsetY);
};

canvas.onpointerup = function(e) {
	if (hasCapture) {
		hasCapture = false;
		canvas.releasePointerCapture(e.pointerId);
		if ((autoplay = parameterAutoplay.checked) === true)
			autoplayCallback();
		else
			redraw();
	}
};

document.getElementById('clear-button')!.onclick = function() {
	points.splice(0, points.length);
	unclosedLength = 0;
	unclosedPath = new Path2D();
	components.splice(0, components.length);

	autoplay = parameterAutoplay.checked = false;
	// reset computed Paths here

	redraw();
};

document.getElementById('save-points-button')!.onclick = setPointsLocation;
document.getElementById('save-components-button')!.onclick = setComponentsLocation;

function magnitude(x: number, y: number) { return Math.sqrt(x * x + y * y); }

function lerp(first: number, second: number, t: number) { return first + (second - first) * t; }

function addPoint(x: number, y: number, draw = true) {
	if (points.length === 0)
		points.push({ x, y, segmentLength: 0 });
	else {
		const previousPoint = points[Math.max(0, points.length - 2)];
		const segmentLength = magnitude(x - previousPoint.x, y - previousPoint.y);
		unclosedLength += segmentLength;

		const addedPoint = { x, y, segmentLength };
		points.splice(points.length - 1, 0, addedPoint);

		const startAndEndPoint = points[points.length - 1];
		startAndEndPoint.segmentLength = magnitude(startAndEndPoint.x - x, startAndEndPoint.y - y);
	}

	unclosedPath.lineTo(x, y);

	if (!computeFft())
		components.splice(0, components.length);

	if (draw)
		redraw();
}

function computeFft() {
	if (unclosedLength <= 0)
		return false;

	samplePathIntoInput();
	fft.transform(output, input);
	calculateSortedComponentsFromOutput();

	// reset computed Paths here
	closedPath = null;
	complexityPath = null;
	circlePath = [];
	linePath = [];
	return true;
}

function samplePathIntoInput() {
	const startAndEndPoint = points[points.length - 1];
	const closedLength = unclosedLength + startAndEndPoint.segmentLength;

	let lengthIncludingSegment = 0;
	let previousPoint = startAndEndPoint;
	let segmentStartSample = 0;

	for (let i = 0; i < points.length; i++) {
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
			phase: Math.atan2(y, x),
		});
	}

	components.sort((a, b) => b.magnitude - a.magnitude);
}

function redraw() {
	context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
	context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

	if (unclosedLength > 0) {
		if (closedPath === null) { // Compute closedPath?
			closedPath = new Path2D(unclosedPath);
			closedPath.closePath();
		}
		context.strokeStyle = 'black';
		context.stroke(closedPath);
	}

	if (components.length > 0) {
		const maxI = Math.min(components.length, (complexity <= 0 ? components.length : (complexity + 1))), pi2 = 2 * Math.PI, p = (parameter * pi2 / fftSize), _x = 0, _y = 0;

		if (circles) { // Draw arcs?
			/* DEBUG!/StartTime('circlePath');/* !DEBUG */
			if (!(p in circlePath)) { // Compute circlePath[p]?
				const path = new Path2D();

				let x = _x, y = _y, ray;

				for (let i = 0; i < maxI; i++) {
					const component = components[i];
					const angle = p * component.frequency + component.phase;
					const newX = x + component.magnitude * Math.cos(angle);
					const newY = y + component.magnitude * Math.sin(angle);

					if (i < 1)
						lines.splice(0, lines.length); // Reset lines
					else { // (min first segment)
						ray = magnitude(newX - x, newY - y);
						path.moveTo(x, y); // Move to the center, drawing a line to the right most circle point (0°)
						path.arc(x, y, ray, 0, pi2); // Draw the circle starting from 0 rad (0°) to 2*PI rad (360°)
						// path.arc do take the x-rightmost point as 0rad, and pathes cursor from the previous position to the modulated position of the center+ray distance circle.
						// path.arc(A, B, Math.Pi, 2 * Math.Pi) will draw a top-half circle (having it's center on [A, B]), with a line reaching [A, B] if the cursor was not already on this position.
						// ^ There is no use to begin circles from the [newX, newY] point, as it'd still require the ray calculation, and introduces a new angle -> angle + 2*PI calculation.
					}

					lines.push({ x: newX, y: newY }); // Draw the line starting from old to new coords

					x = newX;
					y = newY;
				}
				circlePath[p] = path; // Store computation
			}

			context.strokeStyle = 'burlywood';
			context.stroke(circlePath[p]);
			/* DEBUG!/ElapsedTime('circlePath');/* !DEBUG */

			/* DEBUG!/StartTime('linePath');/* !DEBUG */
			if (!(p in linePath)) { // Compute linePath[p]?
				const path = new Path2D();
				path.moveTo(lines[0].x, lines[0].y);
				for (let i = 1; i < lines.length; i++)
					path.lineTo(lines[i].x, lines[i].y);
				linePath[p] = path; // Store computation
			}
			context.strokeStyle = 'red';
			context.stroke(linePath[p]);
			/* DEBUG!/ElapsedTime('linePath');/* !DEBUG */

			lines.splice(0, lines.length); // Reset lines
		} else {
			/* DEBUG!/StartTime('linePath2');/* !DEBUG */
			if (!(p in linePath)) { // Compute linePath[p]?
				const path = new Path2D();
				drawComponentsLineIn(maxI, p, _x, _y, path);
				linePath[p] = path; // Store computation
			}
			context.strokeStyle = 'red';
			context.stroke(linePath[p]);
			/* DEBUG!/ElapsedTime('linePath2');/* !DEBUG */
		}

		if (complexity > 0 && !hasCapture) { // Show complexity path
			/* DEBUG!/StartTime('complexityPath');/* !DEBUG */
			if (complexityPath === null) { // Compute complexityPath?
				complexityPath = new Path2D();
				for (let cp = 0; cp < fftSize; cp++)
					drawComponentsLineOut(maxI, (cp * pi2 / fftSize), _x, _y, complexityPath);
				drawComponentsLineOut(maxI, 0, _x, _y, complexityPath); // End loop
			}
			context.strokeStyle = 'green';
			context.stroke(complexityPath);
			/* DEBUG!/ElapsedTime('complexityPath');/* !DEBUG */
		}
	}
	/*
Starting timer circlePath
index.ts:475 3.7999999998137355 on circlePath
index.ts:469 Starting timer linePath
index.ts:475 0.2999999998137355 on linePath
index.ts:469 Starting timer complexityPath
index.ts:475 755.4000000003725 on complexityPath
index.ts:469 Starting timer circlePath
index.ts:475 2.599999999627471 on circlePath
index.ts:469 Starting timer linePath
index.ts:475 0.2999999998137355 on linePath
index.ts:469 Starting timer complexityPath
index.ts:475 736 on complexityPath
index.ts:469 Starting timer circlePath
index.ts:475 3.400000000372529 on circlePath
index.ts:469 Starting timer linePath
index.ts:475 0.20000000018626451 on linePath
index.ts:469 Starting timer complexityPath
index.ts:475 676.0999999996275 on complexityPath
index.ts:469 Starting timer circlePath
index.ts:475 2.099999999627471 on circlePath
index.ts:469 Starting timer linePath
index.ts:475 0.6999999992549419 on linePath
index.ts:469 Starting timer complexityPath
index.ts:475 653.2999999998137 on complexityPath
index.ts:469 Starting timer circlePath
index.ts:475 3.599999999627471 on circlePath <- drawComponentsLineOut!!
index.ts:469 Starting timer linePath
index.ts:475 0.19999999925494194 on linePath
index.ts:469 Starting timer complexityPath
index.ts:475 552.2000000001863 on complexityPath
	*/

	function drawComponentsLineIn(maxI: number, p: number, x: 0, y: 0, path: Path2D) {
		for (let i = 0; i < maxI; i++) {
			const component = components[i];
			const angle = p * component.frequency + component.phase;
			x += component.magnitude * Math.cos(angle);
			y += component.magnitude * Math.sin(angle);
			path.lineTo(x, y);
		}
	}

	function drawComponentsCallable(maxI: number, p: number, bla: CallableFunction) {
		for (let i = 0; i < maxI; i++) {
			const component = components[i];
			const angle = p * component.frequency + component.phase;
			bla(angle);
		}
	}

	function drawComponentsLineOut(maxI: number, p: number, x: 0, y: 0, path: Path2D) {
		for (let i = 0; i < maxI; i++) {
			const component = components[i];
			const angle = p * component.frequency + component.phase;
			x += component.magnitude * Math.cos(angle);
			y += component.magnitude * Math.sin(angle);
		}
		path.lineTo(x, y);
	}
}

function autoplayCallback() {
	if (!autoplay)
		return;
	if (parameterSlider.value === parameterSlider.max)
		if (!repeatplay) {
			autoplay = parameterAutoplay.checked = false;
			return;
		} else
			parameterSlider.value = parameterSlider.min;

	parameterSlider.valueAsNumber++;
	parameterSlider.oninput?.(event);

	setTimeout(autoplayCallback, Math.max(playwait, 5)); // 5ms wait time min (strict)
}

/* DEBUG!/
function StartTime(timer: string) {
	console.log('Starting timer ' + timer);
	startTime = performance.now();
}

function ElapsedTime(timer: string) {
	elapsedTime = performance.now() - startTime;
	console.log(elapsedTime + ' on ' + timer);
}
/* !DEBUG */
