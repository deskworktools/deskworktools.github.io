const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const opentype = require("opentype.js");

const NAVY = "#0B132A";
const BLUE = "#0066FF";
const WHITE = "#FFFFFF";

// Load fonts
const fontPJSBold = opentype.parse(fs.readFileSync("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff").buffer);
const fontPJSItalic = opentype.parse(fs.readFileSync("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-italic.woff").buffer);
const fontInter = opentype.parse(fs.readFileSync("node_modules/@fontsource/inter/files/inter-latin-800-normal.woff").buffer);

// Helper to convert text to SVG path data
function textToPathData(font, text, startX, baselineY, fontSize, tracking = 0) {
  let x = startX;
  let paths = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const glyph = font.charToGlyph(ch);
    const p = glyph.getPath(x, baselineY, fontSize);
    paths.push(p.toPathData());
    const advance = (glyph.advanceWidth / font.unitsPerEm) * fontSize;
    x += advance + tracking;
  }
  return { pathData: paths.join(" "), endX: x, width: x - startX };
}

// Generate DT monogram paths for monitor screen
function getDTPaths(cx, cy, fontSize = 72) {
  const glyphD = fontPJSItalic.charToGlyph("D");
  const glyphT = fontPJSItalic.charToGlyph("T");

  const gap = 8;
  const wD = (glyphD.advanceWidth / fontPJSItalic.unitsPerEm) * fontSize;
  const wT = (glyphT.advanceWidth / fontPJSItalic.unitsPerEm) * fontSize;
  const totalW = wD + gap + wT;

  const startX = cx - (totalW / 2) + 6;
  const baselineY = cy + (fontSize * 0.35);

  const pathD = glyphD.getPath(startX, baselineY, fontSize).toPathData();
  const pathT = glyphT.getPath(startX + wD + gap, baselineY, fontSize).toPathData();

  return { pathD, pathT };
}

function buildLogoV2() {
  const W = 1660;
  const H = 530;

  // Wordmark
  const textX = 660;
  const deskworkY = 226;
  const toolsY = 426;
  const fontSize = 176;
  const tracking = -1.5;

  const deskworkRes = textToPathData(fontPJSBold, "Deskwork", textX, deskworkY, fontSize, tracking);
  const toolsRes = textToPathData(fontPJSBold, "Tools", textX, toolsY, fontSize, tracking);

  // Monitor center at cx = 460, cy = 126
  const monCX = 460;
  const monCY = 126;
  const dtPaths = getDTPaths(monCX, monCY, 74);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  
  <!-- ==================== REFINED DESKWORK TOOLS ICON ==================== -->
  <g id="desk-worker-icon">
    
    <!-- 1. Left Desk Leg & Foot -->
    <rect id="desk-leg-left" x="65" y="248" width="20" height="220" rx="3" fill="${NAVY}" />
    <rect id="desk-foot-left" x="53" y="468" width="44" height="12" rx="4" fill="${NAVY}" />

    <!-- 2. Right Drawer Cabinet (Pedestal Unit) -->
    <g id="drawer-pedestal">
      <!-- Drawer 1 (Top) -->
      <g id="drawer-1">
        <rect x="360" y="258" width="205" height="58" rx="6" fill="${NAVY}" />
        <!-- Horizontal pill handle -->
        <rect x="437" y="282" width="50" height="10" rx="5" fill="${WHITE}" />
      </g>

      <!-- Drawer 2 (Middle) -->
      <g id="drawer-2">
        <rect x="360" y="326" width="205" height="58" rx="6" fill="${NAVY}" />
        <rect x="437" y="350" width="50" height="10" rx="5" fill="${WHITE}" />
      </g>

      <!-- Drawer 3 (Bottom) -->
      <g id="drawer-3">
        <rect x="360" y="394" width="205" height="58" rx="6" fill="${NAVY}" />
        <rect x="437" y="418" width="50" height="10" rx="5" fill="${WHITE}" />
      </g>

      <!-- Cabinet Base Feet -->
      <rect id="drawer-foot-left" x="378" y="452" width="26" height="28" rx="4" fill="${NAVY}" />
      <rect id="drawer-foot-right" x="525" y="452" width="26" height="28" rx="4" fill="${NAVY}" />
    </g>

    <!-- 3. Desktop Surface (Horizontal anchor beam) -->
    <rect id="desktop-surface" x="42" y="228" width="530" height="20" rx="5" fill="${NAVY}" />

    <!-- 4. Monitor & Stand -->
    <g id="monitor-unit">
      <!-- Stand Neck -->
      <rect id="monitor-neck" x="451" y="200" width="18" height="30" rx="2" fill="${NAVY}" />
      <!-- Stand Base Foot -->
      <path id="monitor-base" d="M 408 228 L 424 216 L 496 216 L 512 228 Z" fill="${NAVY}" />

      <!-- Monitor Outer Frame -->
      <rect id="monitor-bezel" x="340" y="52" width="240" height="150" rx="12" fill="${NAVY}" />
      <!-- Monitor Inner Display Screen (Crisp White) -->
      <rect id="monitor-screen" x="354" y="66" width="212" height="122" rx="6" fill="${WHITE}" />

      <!-- DT Monogram inside Screen -->
      <!-- D in Navy -->
      <path id="dt-letter-d" d="${dtPaths.pathD}" fill="${NAVY}" />
      <!-- T in Bright Blue -->
      <path id="dt-letter-t" d="${dtPaths.pathT}" fill="${BLUE}" />
    </g>

    <!-- 5. Seated Person (Worker) & Ergonomic Chair -->
    <g id="worker-and-chair">
      
      <!-- Worker Head (Natural posture facing monitor) -->
      <!-- Circle crown with subtle jaw/hair profile -->
      <path id="person-head" d="
        M 200 80
        C 200 58, 218 42, 240 42
        C 260 42, 276 56, 276 76
        C 276 90, 270 102, 260 110
        C 252 116, 238 118, 226 118
        C 210 118, 200 102, 200 80 Z
      " fill="${NAVY}" />

      <!-- Neck -->
      <path id="person-neck" d="M 224 114 L 246 114 L 250 142 L 226 142 Z" fill="${NAVY}" />

      <!-- Worker Shoulders & Torso -->
      <!-- Left shoulder slopes smoothly to arm, right shoulder extends forward to desk -->
      <path id="person-body-arms" d="
        M 226 140
        C 200 144, 160 160, 142 184
        C 134 196, 134 210, 142 224
        C 148 228, 160 228, 185 228
        L 275 228
        C 298 228, 312 220, 314 206
        C 316 190, 304 176, 285 160
        C 268 148, 252 142, 246 140
        Z
      " fill="${NAVY}" />

      <!-- Chair Backrest (Ergonomic rounded backrest, perfectly centered behind worker) -->
      <!-- Centered at cx = 215, width = 144, height = 144, rx = 24 -->
      <!-- Framed with subtle 4px white knockout border for clean depth separation -->
      <rect id="chair-backrest" x="143" y="174" width="144" height="144" rx="24" fill="${NAVY}" stroke="${WHITE}" stroke-width="4" />

      <!-- Chair Seat Cushion (Horizontal support cushion) -->
      <rect id="chair-seat" x="135" y="328" width="160" height="26" rx="8" fill="${NAVY}" />

      <!-- Worker Seated Legs (Descending cleanly from under desk) -->
      <rect id="person-leg-left" x="180" y="354" width="28" height="114" rx="4" fill="${NAVY}" />
      <rect id="person-leg-right" x="218" y="354" width="28" height="114" rx="4" fill="${NAVY}" />
      <!-- Shoes / Feet resting on floor -->
      <rect id="person-foot-left" x="174" y="468" width="38" height="12" rx="4" fill="${NAVY}" />
      <rect id="person-foot-right" x="214" y="468" width="46" height="12" rx="4" fill="${NAVY}" />

      <!-- Chair Base: Clean central post and modern arched base with casters -->
      <!-- Central hydraulic cylinder -->
      <rect id="chair-column" x="207" y="354" width="16" height="60" rx="3" fill="${NAVY}" />
      <!-- Arched 2-wing caster base -->
      <path id="chair-caster-wings" d="
        M 215 410
        L 138 456
        C 134 458, 132 464, 134 468
        C 136 472, 142 472, 146 468
        L 215 426
        L 284 468
        C 288 472, 294 472, 296 468
        C 298 464, 296 458, 292 456
        Z
      " fill="${NAVY}" />
      <!-- Casters wheels -->
      <circle cx="138" cy="470" r="6" fill="${NAVY}" />
      <circle cx="292" cy="470" r="6" fill="${NAVY}" />

    </g>

  </g>

  <!-- ==================== REFINED WORDMARK ==================== -->
  <g id="wordmark">
    <!-- "Deskwork" in Dark Navy -->
    <path id="wordmark-deskwork" d="${deskworkRes.pathData}" fill="${NAVY}" />
    <!-- "Tools" in Vibrant Blue -->
    <path id="wordmark-tools" d="${toolsRes.pathData}" fill="${BLUE}" />
  </g>

</svg>`;

  return svg;
}

const svg2 = buildLogoV2();
fs.writeFileSync("brand-assets/test-logo-v2.svg", svg2);
const resvg = new Resvg(svg2);
fs.writeFileSync("brand-assets/test-logo-v2.png", resvg.render().asPng());
console.log("Rendered test-logo-v2.png successfully!");
