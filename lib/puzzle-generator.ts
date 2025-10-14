import { createCanvas, loadImage } from "canvas";

// Exact implementation from the GitHub repository
// Random number generator using sine function (matches the original)
let globalSeed = 1;
function random(): number {
  const x = Math.sin(globalSeed) * 10000;
  globalSeed += 1;
  return x - Math.floor(x);
}

function uniform(min: number, max: number): number {
  const r = random();
  return min + r * (max - min);
}

function rbool(): boolean {
  return random() > 0.5;
}

// Variables for the jigsaw generation algorithm
let a: number, b: number, c: number, d: number, e: number, t: number, j: number;
let flip: boolean, xi: number, yi: number, xn: number, yn: number;
let vertical: boolean, offset: number, width: number, height: number, radius: number;

function first(): void {
  e = uniform(-j, j);
  next();
}

function next(): void {
  const flipold = flip;
  flip = rbool();
  a = (flip === flipold ? -e : e);
  b = uniform(-j, j);
  c = uniform(-j, j);
  d = uniform(-j, j);
  e = uniform(-j, j);
}

function sl(): number {
  return vertical ? height / yn : width / xn;
}

function sw(): number {
  return vertical ? width / xn : height / yn;
}

function ol(): number {
  return offset + sl() * (vertical ? yi : xi);
}

function ow(): number {
  return offset + sw() * (vertical ? xi : yi);
}

function l(v: number): number {
  const ret = ol() + sl() * v;
  return Math.round(ret * 100) / 100;
}

function w(v: number): number {
  const ret = ow() + sw() * v * (flip ? -1.0 : 1.0);
  return Math.round(ret * 100) / 100;
}

// Point generation functions (exact from GitHub repo)
function p0l(): number { return l(0.0); }
function p0w(): number { return w(0.0); }
function p1l(): number { return l(0.2); }
function p1w(): number { return w(a); }
function p2l(): number { return l(0.5 + b + d); }
function p2w(): number { return w(-t + c); }
function p3l(): number { return l(0.5 - t + b); }
function p3w(): number { return w(t + c); }
function p4l(): number { return l(0.5 - 2.0 * t + b - d); }
function p4w(): number { return w(3.0 * t + c); }
function p5l(): number { return l(0.5 + 2.0 * t + b - d); }
function p5w(): number { return w(3.0 * t + c); }
function p6l(): number { return l(0.5 + t + b); }
function p6w(): number { return w(t + c); }
function p7l(): number { return l(0.5 + b + d); }
function p7w(): number { return w(-t + c); }
function p8l(): number { return l(0.8); }
function p8w(): number { return w(e); }
function p9l(): number { return l(1.0); }
function p9w(): number { return w(0.0); }

// Generate horizontal lines (exact from GitHub repo)
function genDh(): string {
  let str = "";
  vertical = false;
  
  for (yi = 1; yi < yn; ++yi) {
    xi = 0;
    first();
    str += `M ${p0l()},${p0w()} `;
    for (; xi < xn; ++xi) {
      str += `C ${p1l()} ${p1w()} ${p2l()} ${p2w()} ${p3l()} ${p3w()} `;
      str += `C ${p4l()} ${p4w()} ${p5l()} ${p5w()} ${p6l()} ${p6w()} `;
      str += `C ${p7l()} ${p7w()} ${p8l()} ${p8w()} ${p9l()} ${p9w()} `;
      next();
    }
  }
  return str;
}

// Generate vertical lines (exact from GitHub repo)
function genDv(): string {
  let str = "";
  vertical = true;
  
  for (xi = 1; xi < xn; ++xi) {
    yi = 0;
    first();
    str += `M ${p0w()},${p0l()} `;
    for (; yi < yn; ++yi) {
      str += `C ${p1w()} ${p1l()} ${p2w()} ${p2l()} ${p3w()} ${p3l()} `;
      str += `C ${p4w()} ${p4l()} ${p5w()} ${p5l()} ${p6w()} ${p6l()} `;
      str += `C ${p7w()} ${p7l()} ${p8w()} ${p8l()} ${p9w()} ${p9l()} `;
      next();
    }
  }
  return str;
}

// Generate border (exact from GitHub repo)
function genDb(): string {
  let str = "";
  
  str += `M ${offset + radius} ${offset} `;
  str += `L ${offset + width - radius} ${offset} `;
  str += `A ${radius} ${radius} 0 0 1 ${offset + width} ${offset + radius} `;
  str += `L ${offset + width} ${offset + height - radius} `;
  str += `A ${radius} ${radius} 0 0 1 ${offset + width - radius} ${offset + height} `;
  str += `L ${offset + radius} ${offset + height} `;
  str += `A ${radius} ${radius} 0 0 1 ${offset} ${offset + height - radius} `;
  str += `L ${offset} ${offset + radius} `;
  str += `A ${radius} ${radius} 0 0 1 ${offset + radius} ${offset} `;
  return str;
}

// Parse SVG path and convert to canvas drawing
function drawSVGPath(ctx: CanvasRenderingContext2D, pathData: string): void {
  // Split by commands and handle each one
  const parts = pathData.match(/[MmLlCcAa][^MmLlCcAa]*/g) || [];
  
  for (const part of parts) {
    const cmd = part[0];
    const coords = part.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    
    switch (cmd.toUpperCase()) {
      case 'M':
        if (coords.length >= 2) {
          ctx.moveTo(coords[0], coords[1]);
          for (let i = 2; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              ctx.lineTo(coords[i], coords[i + 1]);
            }
          }
        }
        break;
        
      case 'L':
        for (let i = 0; i < coords.length; i += 2) {
          if (i + 1 < coords.length) {
            ctx.lineTo(coords[i], coords[i + 1]);
          }
        }
        break;
        
      case 'C':
        for (let i = 0; i < coords.length; i += 6) {
          if (i + 5 < coords.length) {
            ctx.bezierCurveTo(
              coords[i], coords[i + 1],
              coords[i + 2], coords[i + 3],
              coords[i + 4], coords[i + 5]
            );
          }
        }
        break;
        
      case 'A':
        // Approximate arc with line for now
        for (let i = 0; i < coords.length; i += 7) {
          if (i + 6 < coords.length) {
            // Just draw a line to the end point
            ctx.lineTo(coords[i + 5], coords[i + 6]);
          }
        }
        break;
    }
  }
}

export async function generatePuzzle(
  imageBuffer: Buffer,
  numPieces: number = 12,
  cornerRadius: number = 5,
  showNumbers: boolean = true
): Promise<Buffer> {
  const img = await loadImage(imageBuffer);
  const imgWidth = img.width;
  const imgHeight = img.height;

  // Create local random number generator for this puzzle generation
  const localSeed = Math.floor(Math.random() * 10000);
  let localRandomSeed = localSeed;
  
  function localRandom(): number {
    const x = Math.sin(localRandomSeed) * 10000;
    localRandomSeed += 1;
    return x - Math.floor(x);
  }

  function localUniform(min: number, max: number): number {
    const r = localRandom();
    return min + r * (max - min);
  }

  function localRbool(): boolean {
    return localRandom() > 0.5;
  }

  // Local algorithm parameters - completely isolated from global state
  const t = 20 / 200.0; // Tab size: 20% (converted to decimal like in the original)
  const j = 0 / 100.0; // Jitter: 0%
  const radius = 2; // Corner radius: 2mm
  const width = imgWidth;
  const height = imgHeight;
  const offset = 0;
  
  // Local algorithm variables - completely isolated from global state
  let a = 0, b = 0, c = 0, d = 0, e = 0;
  let xi = 0, yi = 0;
  let vertical = false;
  let flip = false;
  
  // Calculate grid dimensions based on numPieces - local variables
  const aspectRatio = imgWidth / imgHeight;
  let xn, yn;
  if (numPieces <= 50) {
    xn = Math.ceil(Math.sqrt(numPieces * aspectRatio));
    yn = Math.ceil(numPieces / xn);
  } else {
    // Use 15x10 ratio for larger puzzles
    xn = Math.ceil(Math.sqrt(numPieces * 1.5));
    yn = Math.ceil(numPieces / xn);
  }

  // Create canvas for output
  const canvas = createCanvas(imgWidth, imgHeight);
  const ctx = canvas.getContext("2d");

  // Clear the canvas completely
  ctx.clearRect(0, 0, imgWidth, imgHeight);

  // Draw the image
  ctx.drawImage(img, 0, 0);

  // Local coordinate functions
  function sl(): number { return vertical ? height / yn : width / xn; }
  function sw(): number { return vertical ? width / xn : height / yn; }
  function ol(): number { return offset + sl() * (vertical ? yi : xi); }
  function ow(): number { return offset + sw() * (vertical ? xi : yi); }
  function l(v: number): number { var ret = ol() + sl() * v; return Math.round(ret * 100) / 100; }
  function w(v: number): number { var ret = ow() + sw() * v * (flip ? -1.0 : 1.0); return Math.round(ret * 100) / 100; }
  
  function p0l(): number { return l(0.0); }
  function p0w(): number { return w(0.0); }
  function p1l(): number { return l(0.2); }
  function p1w(): number { return w(a); }
  function p2l(): number { return l(0.5 + b + d); }
  function p2w(): number { return w(-t + c); }
  function p3l(): number { return l(0.5 - t + b); }
  function p3w(): number { return w(t + c); }
  function p4l(): number { return l(0.5 - 2.0 * t + b - d); }
  function p4w(): number { return w(3.0 * t + c); }
  function p5l(): number { return l(0.5 + 2.0 * t + b - d); }
  function p5w(): number { return w(3.0 * t + c); }
  function p6l(): number { return l(0.5 + t + b); }
  function p6w(): number { return w(t + c); }
  function p7l(): number { return l(0.5 + b + d); }
  function p7w(): number { return w(-t + c); }
  function p8l(): number { return l(0.8); }
  function p8w(): number { return w(e); }
  function p9l(): number { return l(1.0); }
  function p9w(): number { return w(0.0); }

  // Create local versions of the algorithm functions with local random generator
  function localFirst(): void {
    e = localUniform(-j, j);
    localNext();
  }

  function localNext(): void {
    const flipold = flip;
    flip = localRbool();
    a = (flip == flipold ? -e: e);
    b = localUniform(-j, j);
    c = localUniform(-j, j);
    d = localUniform(-j, j);
    e = localUniform(-j, j);
  }

  function localGenDh(): string {
    let str = "";
    vertical = false;
    
    for (yi = 1; yi < yn; ++yi) {
      xi = 0;
      localFirst();
      str += `M ${p0l()},${p0w()} `;
      for (; xi < xn; ++xi) {
        str += `C ${p1l()} ${p1w()} ${p2l()} ${p2w()} ${p3l()} ${p3w()} `;
        str += `C ${p4l()} ${p4w()} ${p5l()} ${p5w()} ${p6l()} ${p6w()} `;
        str += `C ${p7l()} ${p7w()} ${p8l()} ${p8w()} ${p9l()} ${p9w()} `;
        localNext();
      }
    }
    return str;
  }

  function localGenDv(): string {
    let str = "";
    vertical = true;
    
    for (xi = 1; xi < xn; ++xi) {
      yi = 0;
      localFirst();
      str += `M ${p0w()},${p0l()} `;
      for (; yi < yn; ++yi) {
        str += `C ${p1w()} ${p1l()} ${p2w()} ${p2l()} ${p3w()} ${p3l()} `;
        str += `C ${p4w()} ${p4l()} ${p5w()} ${p5l()} ${p6w()} ${p6l()} `;
        str += `C ${p7w()} ${p7l()} ${p8w()} ${p8l()} ${p9w()} ${p9l()} `;
        localNext();
      }
    }
    return str;
  }

  function localGenDb(): string {
    let str = "";
    str += `M ${offset + radius} ${offset} `;
    str += `L ${offset + width - radius} ${offset} `;
    str += `A ${radius} ${radius} 0 0 1 ${offset + width} ${offset + radius} `;
    str += `L ${offset + width} ${offset + height - radius} `;
    str += `A ${radius} ${radius} 0 0 1 ${offset + width - radius} ${offset + height} `;
    str += `L ${offset + radius} ${offset + height} `;
    str += `A ${radius} ${radius} 0 0 1 ${offset} ${offset + height - radius} `;
    str += `L ${offset} ${offset + radius} `;
    str += `A ${radius} ${radius} 0 0 1 ${offset + radius} ${offset} `;
    return str;
  }

  // Generate the jigsaw paths using local algorithm functions
  const horizontalPath = localGenDh();
  const verticalPath = localGenDv();
  const borderPath = localGenDb();

  // Draw puzzle lines
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw horizontal lines
  ctx.beginPath();
  drawSVGPath(ctx, horizontalPath);
  ctx.stroke();

  // Draw vertical lines
  ctx.beginPath();
  drawSVGPath(ctx, verticalPath);
  ctx.stroke();

  // Draw border
  ctx.beginPath();
  drawSVGPath(ctx, borderPath);
  ctx.stroke();

  // Add piece numbers (only if showNumbers is true)
  if (showNumbers) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    const pieceWidth = width / xn;
    const pieceHeight = height / yn;
    let pieceNum = 1;

    for (let row = 0; row < yn; row++) {
      for (let col = 0; col < xn; col++) {
        const x = col * pieceWidth + pieceWidth / 2;
        const y = row * pieceHeight + pieceHeight / 2;
        
        const fontSize = Math.min(pieceWidth, pieceHeight) * 0.1;
        ctx.font = `bold ${fontSize}px Arial`;
        
        // Background circle for better contrast
        ctx.beginPath();
        ctx.arc(x, y, fontSize * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Black number
        ctx.fillStyle = "#000000";
        ctx.fillText(pieceNum.toString(), x, y);
        
        pieceNum++;
      }
    }
  }

  return canvas.toBuffer("image/png");
}

export function generatePuzzleSVG(
  imgWidth: number,
  imgHeight: number,
  numPieces: number = 12,
  cornerRadius: number = 5
): string {
  // Initialize seed
  seed = Math.floor(Math.random() * 10000);
  
  // Use the exact parameters from the GitHub repository
  t = 20 / 200.0; // Tab size: 20%
  j = 0 / 100.0; // Jitter: 0%
  radius = 2; // Corner radius: 2mm
  
  // Set dimensions for the GitHub algorithm
  width = imgWidth;
  height = imgHeight;
  offset = 0;
  
  // Calculate grid dimensions
  const aspectRatio = imgWidth / imgHeight;
  if (numPieces <= 50) {
    xn = Math.ceil(Math.sqrt(numPieces * aspectRatio));
    yn = Math.ceil(numPieces / xn);
  } else {
    xn = Math.ceil(Math.sqrt(numPieces * 1.5));
    yn = Math.ceil(numPieces / xn);
  }

  // Generate the jigsaw paths using the exact GitHub algorithm
  const horizontalPath = genDh();
  const verticalPath = genDv();
  const borderPath = genDb();

  // Create SVG - include border path for complete puzzle outline
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="${imgWidth}mm" height="${imgHeight}mm" viewBox="0 0 ${imgWidth} ${imgHeight}">`;
  const combinedPath = horizontalPath + " " + verticalPath + " " + borderPath;
  svg += `<path fill="none" stroke="black" stroke-width="0.1" d="${combinedPath}"></path>`;
  svg += `</svg>`;
  
  return svg;
}

export async function generatePuzzleSVGWithImage(
  imageBuffer: Buffer,
  imgWidth: number,
  imgHeight: number,
  numPieces: number = 12,
  cornerRadius: number = 5,
  showNumbers: boolean = true
): Promise<string> {
  // Convert image to base64 data URI
  const base64Image = imageBuffer.toString('base64');
  const imageDataUri = `data:image/png;base64,${base64Image}`;

  // Initialize seed
  seed = Math.floor(Math.random() * 10000);
  
  // Use the exact parameters from the GitHub repository
  t = 20 / 200.0; // Tab size: 20%
  j = 0 / 100.0; // Jitter: 0%
  radius = 2; // Corner radius: 2mm
  
  // Set dimensions for the GitHub algorithm
  width = imgWidth;
  height = imgHeight;
  offset = 0;
  
  // Calculate grid dimensions
  const aspectRatio = imgWidth / imgHeight;
  if (numPieces <= 50) {
    xn = Math.ceil(Math.sqrt(numPieces * aspectRatio));
    yn = Math.ceil(numPieces / xn);
  } else {
    xn = Math.ceil(Math.sqrt(numPieces * 1.5));
    yn = Math.ceil(numPieces / xn);
  }

  // Generate the jigsaw paths using the exact GitHub algorithm
  const horizontalPath = genDh();
  const verticalPath = genDv();
  const borderPath = genDb();

  // Create SVG with embedded image
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="${imgWidth}mm" height="${imgHeight}mm" viewBox="0 0 ${imgWidth} ${imgHeight}">`;
  
  // Add the background image
  svg += `<image href="${imageDataUri}" width="${imgWidth}" height="${imgHeight}" />`;
  
  // Add puzzle cut lines - create simple grid lines to avoid complex path overlaps
  const pieceWidth = imgWidth / xn;
  const pieceHeight = imgHeight / yn;
  
  // Draw horizontal lines
  for (let row = 1; row < yn; row++) {
    const y = row * pieceHeight;
    svg += `<line x1="0" y1="${y}" x2="${imgWidth}" y2="${y}" stroke="black" stroke-width="0.1"/>`;
  }
  
  // Draw vertical lines
  for (let col = 1; col < xn; col++) {
    const x = col * pieceWidth;
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${imgHeight}" stroke="black" stroke-width="0.1"/>`;
  }
  
  // Add piece numbers if requested
  if (showNumbers) {
    let pieceNum = 1;
    
    for (let row = 0; row < yn; row++) {
      for (let col = 0; col < xn; col++) {
        const x = col * pieceWidth + pieceWidth / 2;
        const y = row * pieceHeight + pieceHeight / 2;
        
        const fontSize = Math.min(pieceWidth, pieceHeight) * 0.08;
        
        // Add white circle background for better contrast
        svg += `<circle cx="${x}" cy="${y}" r="${fontSize * 1.5}" fill="white" stroke="black" stroke-width="0.2" />`;
        
        // Add the number
        svg += `<text x="${x}" y="${y}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="bold" fill="black">${pieceNum}</text>`;
        
        pieceNum++;
      }
    }
  }
  
  svg += `</svg>`;
  
  return svg;
}