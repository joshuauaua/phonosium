// Phonosium — Outdoor Sound Installation
// p5.js GUI — runs in Bela IDE browser tab or standalone
// WebSocket attempts connection to Bela; falls back to animated demo mode

const BG         = [8, 8, 18];
const ACCENT     = [80, 200, 255];
const FX_COLORS  = [
  [100, 180, 255],  // pitch shift  — blue
  [180, 100, 255],  // autotune     — purple
  [255, 180,  80],  // granular     — amber
  [ 80, 255, 180],  // reverb       — teal
];
const FX_NAMES   = ['PITCH SHIFT', 'AUTOTUNE', 'GRANULAR', 'REVERB'];

let masterVol  = 0.8;
let audioLevel = 0;
let time       = 0;
let levelHistory = [];

let ws        = null;
let connected = false;

// ─── Setup ───────────────────────────────────────────────────────────────────

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);

  for (let i = 0; i < 120; i++) levelHistory.push(0);

  tryConnect();
}

function tryConnect() {
  let host = (window.location.hostname !== '') ? window.location.hostname : 'bela.local';
  try {
    ws = new WebSocket('ws://' + host + ':5555');
    ws.onopen    = ()  => { connected = true; };
    ws.onclose   = ()  => { connected = false; };
    ws.onerror   = ()  => { connected = false; };
    ws.onmessage = (e) => {
      try {
        let d = JSON.parse(e.data);
        if (d.level     !== undefined) audioLevel = constrain(d.level, 0, 1);
        if (d.masterVol !== undefined) masterVol  = constrain(d.masterVol, 0, 1);
      } catch (_) {}
    };
  } catch (_) {}
}

function sendToBela(key, val) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ [key]: val }));
}

// ─── Draw ────────────────────────────────────────────────────────────────────

function draw() {
  background(BG[0], BG[1], BG[2], 45);
  time += 0.016;

  // Simulate audio level in demo mode
  if (!connected) {
    let target = 0.3
      + 0.22 * sin(time * 0.7)
      + 0.12 * sin(time * 2.4)
      + 0.08 * sin(time * 5.3);
    audioLevel = lerp(audioLevel, target, 0.04);
  }

  levelHistory.push(audioLevel);
  if (levelHistory.length > 120) levelHistory.shift();

  drawTitle();
  drawCentralRing();
  drawFXChain();
  drawVolumeSlider();
  drawStatusBar();
}

// ─── Title ───────────────────────────────────────────────────────────────────

function drawTitle() {
  let cx = width / 2;
  textAlign(CENTER, CENTER);

  // Glow layers
  noStroke();
  for (let d = 5; d >= 1; d--) {
    fill(ACCENT[0], ACCENT[1], ACCENT[2], 8);
    textSize(50);
    text('PHONOSIUM', cx, 46);
  }

  fill(ACCENT[0], ACCENT[1], ACCENT[2], 220);
  textSize(50);
  text('PHONOSIUM', cx, 46);

  fill(160, 160, 180);
  textSize(11);
  text('OUTDOOR SOUND INSTALLATION', cx, 80);
}

// ─── Central Ring ────────────────────────────────────────────────────────────

function drawCentralRing() {
  let cx      = width / 2;
  let cy      = height / 2;
  let baseR   = min(width, height) * 0.21;
  let pts     = 256;

  // Outer glow
  noFill();
  for (let r = 4; r >= 1; r--) {
    stroke(ACCENT[0], ACCENT[1], ACCENT[2], 10 * r);
    strokeWeight(r * 4);
    ellipse(cx, cy, baseR * 2 + r * 18, baseR * 2 + r * 18);
  }

  // Waveform ring
  beginShape();
  noFill();
  stroke(ACCENT[0], ACCENT[1], ACCENT[2], 200);
  strokeWeight(1.5);
  for (let i = 0; i <= pts; i++) {
    let angle  = TWO_PI * i / pts;
    let n      = noise(cos(angle) * 2 + 3, sin(angle) * 2 + 3, time * 0.45);
    let ripple = audioLevel * sin(angle * 8 + time * 3.5) * 20;
    let r      = baseR + (n - 0.5) * 35 * audioLevel * 2.5 + ripple;
    vertex(cx + cos(angle) * r, cy + sin(angle) * r);
  }
  endShape(CLOSE);

  // Inner fill
  fill(ACCENT[0], ACCENT[1], ACCENT[2], 6 + audioLevel * 18);
  noStroke();
  ellipse(cx, cy, baseR * 1.85, baseR * 1.85);

  // Waveform history arc inside ring
  noFill();
  stroke(ACCENT[0], ACCENT[1], ACCENT[2], 80);
  strokeWeight(1);
  beginShape();
  for (let i = 0; i < levelHistory.length; i++) {
    let angle = map(i, 0, levelHistory.length - 1, -HALF_PI, HALF_PI * 3);
    let r     = baseR * 0.55 + levelHistory[i] * baseR * 0.28;
    vertex(cx + cos(angle) * r, cy + sin(angle) * r);
  }
  endShape();

  // Center dot + readout
  fill(ACCENT[0], ACCENT[1], ACCENT[2], 190 + audioLevel * 65);
  noStroke();
  ellipse(cx, cy, 10, 10);

  fill(ACCENT[0], ACCENT[1], ACCENT[2], 180);
  textAlign(CENTER, CENTER);
  textSize(22);
  text(nf(audioLevel * 100, 2, 0) + '%', cx, cy - 2);

  fill(140, 160, 180);
  textSize(10);
  text('AUDIO LEVEL', cx, cy + 20);
}

// ─── FX Chain ────────────────────────────────────────────────────────────────

function drawFXChain() {
  let bx   = 40;
  let by0  = height * 0.2;
  let boxW = 190;
  let boxH = 68;
  let gap  = 18;

  fill(160, 160, 190);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(10);
  text('FX CHAIN  ─────────────', bx, by0 - 22);

  for (let i = 0; i < 4; i++) {
    let by       = by0 + i * (boxH + gap);
    let c        = FX_COLORS[i];
    let activity = constrain(0.25 + 0.45 * audioLevel + 0.2 * sin(time * (1.4 + i * 0.5) + i), 0, 1);

    // Box bg
    fill(c[0], c[1], c[2], 12);
    stroke(c[0], c[1], c[2], 55);
    strokeWeight(1);
    rect(bx, by, boxW, boxH, 5);

    // Activity bar
    fill(c[0], c[1], c[2], 65);
    noStroke();
    rect(bx + 1, by + 1, (boxW - 2) * activity, boxH - 2, 4);

    // Name
    fill(c[0], c[1], c[2], 230);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(FX_NAMES[i], bx + 13, by + boxH * 0.38);

    // Stage label
    fill(c[0], c[1], c[2], 110);
    textSize(9);
    text('STAGE ' + (i + 1), bx + 13, by + boxH * 0.68);

    // LED
    let pulse = 0.55 + 0.45 * sin(time * 2.8 + i * 0.9);
    fill(c[0], c[1], c[2], 130 + 125 * pulse);
    noStroke();
    ellipse(bx + boxW - 16, by + boxH / 2, 9, 9);

    // Connector arrow
    if (i < 3) {
      let ax = bx + boxW / 2;
      let ay = by + boxH;
      stroke(80, 80, 110, 100);
      strokeWeight(1);
      line(ax, ay, ax, ay + gap);
      line(ax, ay + gap, ax - 4, ay + gap - 6);
      line(ax, ay + gap, ax + 4, ay + gap - 6);
    }
  }

  // Output label
  let bottomY = by0 + 4 * (boxH + gap);
  fill(120, 120, 150);
  noStroke();
  textSize(10);
  textAlign(LEFT, CENTER);
  text('→  DAC OUTPUT  (ch 1 & 2)', bx + 50, bottomY);
}

// ─── Volume Slider ───────────────────────────────────────────────────────────

function drawVolumeSlider() {
  let sx = width - 110;
  let sy = height * 0.2;
  let sh = height * 0.5;
  let sw = 34;
  let cx = sx + sw / 2;

  // Labels
  fill(160, 160, 190);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(10);
  text('MASTER', cx, sy - 30);
  text('VOLUME', cx, sy - 16);

  // Track
  fill(20, 20, 40);
  stroke(50, 50, 80);
  strokeWeight(1);
  rect(sx, sy, sw, sh, 5);

  // Fill
  let fillH = sh * masterVol;
  fill(ACCENT[0], ACCENT[1], ACCENT[2], 100);
  noStroke();
  rect(sx + 1, sy + sh - fillH + 1, sw - 2, fillH - 2, 4);

  // Thumb
  let ty = sy + sh - sh * masterVol;
  fill(30, 30, 60);
  stroke(ACCENT[0], ACCENT[1], ACCENT[2], 200);
  strokeWeight(1.5);
  rect(sx - 8, ty - 9, sw + 16, 18, 5);

  // Thumb grip lines
  stroke(ACCENT[0], ACCENT[1], ACCENT[2], 120);
  strokeWeight(1);
  for (let d = -4; d <= 4; d += 4) {
    line(sx + 6, ty + d, sx + sw - 6, ty + d);
  }

  // Value
  fill(ACCENT[0], ACCENT[1], ACCENT[2], 210);
  noStroke();
  textSize(14);
  textAlign(CENTER, CENTER);
  text(nf(masterVol * 100, 2, 0) + '%', cx, sy + sh + 22);

  // ── Loop status box ──
  let lx = sx - 12;
  let ly = sy + sh + 50;
  let lw = sw + 24;
  let lh = 46;
  let pulse = 0.5 + 0.5 * sin(time * 1.8);

  fill(10, 30, 20);
  stroke(80, 255, 120, 70);
  strokeWeight(1);
  rect(lx, ly, lw, lh, 5);

  // Pulsing LED
  fill(80, 255, 120, 140 + 115 * pulse);
  noStroke();
  ellipse(cx, ly + 15, 9, 9);

  fill(80, 220, 110, 200);
  textSize(9);
  textAlign(CENTER, CENTER);
  text('LOOP PLAYING', cx, ly + 32);
}

// ─── Status Bar ──────────────────────────────────────────────────────────────

function drawStatusBar() {
  let bary = height - 34;

  fill(12, 12, 24);
  noStroke();
  rect(0, bary, width, 34);

  stroke(35, 35, 60);
  strokeWeight(1);
  line(0, bary, width, bary);

  noStroke();
  textSize(10);

  // Connection dot + label
  if (connected) fill(80, 255, 120);
  else           fill(255, 90, 80);
  ellipse(18, bary + 17, 7, 7);

  if (connected) fill(80, 220, 110);
  else           fill(180, 70, 60);
  textAlign(LEFT, CENTER);
  text(connected ? 'BELA CONNECTED' : 'DEMO MODE — not connected', 30, bary + 17);

  // Centre info
  fill(120, 120, 150);
  textAlign(CENTER, CENTER);
  text('4 MIC  →  PITCH SHIFT  →  AUTOTUNE  →  GRANULAR  →  REVERB  →  DAC', width / 2, bary + 17);

  // Clock
  fill(80, 80, 110);
  textAlign(RIGHT, CENTER);
  let d = new Date();
  text(d.getHours() + ':' + nf(d.getMinutes(), 2) + ':' + nf(d.getSeconds(), 2), width - 18, bary + 17);
}

// ─── Interaction ─────────────────────────────────────────────────────────────

function mousePressed()  { updateSlider(); }
function mouseDragged()  { updateSlider(); }

function updateSlider() {
  let sx = width - 110;
  let sy = height * 0.2;
  let sh = height * 0.5;
  let sw = 34;

  if (mouseX > sx - 14 && mouseX < sx + sw + 14 &&
      mouseY > sy       && mouseY < sy + sh) {
    masterVol = constrain(1 - (mouseY - sy) / sh, 0, 1);
    sendToBela('masterVol', masterVol);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
