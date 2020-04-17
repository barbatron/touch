const {Mouse} = require('./mouse.js');

const mouse = new Mouse();

// Spans deduced from previous runs
const X_SPAN = 510; 
const Y_SPAN = 382;

let x = X_SPAN / 2;
let y = Y_SPAN / 2;

let count = 0;

let minx = x;
let miny = y;
let maxx = x;
let maxy = y;

let lastEvent;

const AUTOCENTER_FACTOR = 0.8;
const AUTOCENTER_INTERVAL = 2000;

const trunc = (value) => Math.floor(value);
const autoCenter = (old) => trunc(old * AUTOCENTER_FACTOR);

const show = () => {
  const {type, xDelta, yDelta} = lastEvent;
  const xSpan = trunc(Math.abs(maxx - minx));
  const ySpan = trunc(Math.abs(maxy - miny));
  console.clear();
  console.log('Event count: ', count);
  console.table({x, y, xDelta, yDelta, maxx, minx, miny, maxy, xSpan, ySpan});
  console.log();
  console.log(lastEvent);
};

setInterval(() => {
  x = autoCenter(x);
  y = autoCenter(y);
  minx = autoCenter(minx);
  maxx = autoCenter(maxx);
  miny = autoCenter(miny);
  maxy = autoCenter(maxy);
  if (lastEvent) { 
    show();
  }
}, AUTOCENTER_INTERVAL);

const onMove = (ev) => {
 count++;
 lastEvent = ev;
 const {type, xDelta, yDelta} = ev;
 x += xDelta;
 y += yDelta;
 minx = Math.min(x, minx);
 maxx = Math.max(x, maxx);
 miny = Math.min(y, miny);
 maxy = Math.max(y, maxy);
 show();
};

mouse.on('mice', onMove);
