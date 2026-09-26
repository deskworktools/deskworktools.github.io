const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const opentype = require("opentype.js");

const NAVY = "#0B132A";
const BLUE = "#0066FF";
const WHITE = "#FFFFFF";

// Load Plus Jakarta Sans ExtraBold
const fontPJSBold = opentype.parse(
  fs.readFileSync("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff").buffer
);

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

// Custom Geometric DT Monogram for monitor display
function buildDTMonogram(cx, cy, scale = 1.0) {
  // Stem thickness: 14 * scale
  // Total height: 64 * scale
  // D width: 48 * scale
  // T width: 44 * scale
  // Gap: 9 * scale
  const s = scale;
  const h = 64 * s;
  const stroke = 13.5 * s;
  const skew = -11; // 11 degree italic slant

  return `
    <g transform="translate(${cx}, ${cy}) skewX(${skew})">
      <!-- Letter 'D' in Navy -->
      <path d="
        M -50 -32
        L -20 -32
        C -2 -32, 8 -18, 8 0
        C 8 18, -2 32, -20 32
        L -50 32
        Z
        M -36 -19
        L -20 -19
        C -8 -19, -5 -9, -5 0
        C -5 9, -8 19, -20 19
        L -36 19
        Z
      " fill="${NAVY}" fill-rule="evenodd" />

      <!-- Letter 'T' in Electric Blue -->
      <path d="
        M -2 -32
        L 48 -32
        L 48 -19
        L 29.5 -19
        L 29.5 32
        L 16.5 32
        L 16.5 -19
        L -2 -19
        Z
      " fill="${BLUE}" />
    </g>
  `;
}

// MASTER REDESIGNED LOGO
function buildMasterRedesignSVG() {
  const W = 1660;
  const H = 530;

  // Wordmark typography
  const textX = 664;
  const deskworkY = 224;
  const toolsY = 428;
  const fontSize = 176;
  const tracking = -1.2;

  const deskworkRes = textToPathData(fontPJSBold, "Deskwork", textX, deskworkY, fontSize, tracking);
  const toolsRes = textToPathData(fontPJSBold, "Tools", textX, toolsY, fontSize, tracking);

  // Monitor center at cx = 458, cy = 124
  const monCX = 458;
  const monCY = 124;
  const dtMarkup = buildDTMonogram(monCX, monCY, 1.05);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <style>
      .navy-fill { fill: ${NAVY}; }
      .blue-fill { fill: ${BLUE}; }
      .white-fill { fill: ${WHITE}; }
    </style>
  </defs>

  <!-- ==================== NEW MASTER DESKWORK TOOLS ICON ==================== -->
  <g id="master-refined-icon">
    
    <!-- 1. ARCHITECTURAL DESK FRAME -->
    <!-- Left Leg: Clean modern architectural rectangular frame with refined leveling foot -->
    <rect id="desk-leg-left" x="58" y="240" width="22" height="224" rx="4" class="navy-fill" />
    <rect id="desk-foot-left" x="44" y="464" width="50" height="14" rx="4" class="navy-fill" />

    <!-- 2. FLUSH 3-DRAWER PEDESTAL CABINET (Right Side) -->
    <g id="pedestal-cabinet">
      <!-- Drawer 1 (Top) -->
      <rect x="366" y="250" width="202" height="62" rx="8" class="navy-fill" />
      <rect x="441" y="277" width="52" height="8" rx="4" class="white-fill" />

      <!-- Drawer 2 (Middle) -->
      <rect x="366" y="322" width="202" height="62" rx="8" class="navy-fill" />
      <rect x="441" y="349" width="52" height="8" rx="4" class="white-fill" />

      <!-- Drawer 3 (Bottom) -->
      <rect x="366" y="394" width="202" height="62" rx="8" class="navy-fill" />
      <rect x="441" y="421" width="52" height="8" rx="4" class="white-fill" />

      <!-- Recessed Plinth Base (Clean architectural foundation) -->
      <rect x="382" y="464" width="170" height="14" rx="4" class="navy-fill" />
    </g>

    <!-- 3. DESKTOP SURFACE BEAM (18px substantial profile) -->
    <rect id="desktop-surface" x="42" y="222" width="536" height="18" rx="6" class="navy-fill" />

    <!-- 4. MODERN WIDESCREEN DISPLAY & STAND -->
    <g id="monitor-unit">
      <!-- Stand Neck -->
      <rect x="448" y="194" width="20" height="30" rx="3" class="navy-fill" />
      <!-- Stand Base (Modern beveled low-profile plate) -->
      <path d="M 406 222 L 424 210 L 492 210 L 510 222 Z" class="navy-fill" />

      <!-- Display Bezel (Modern 16:10 ratio, 232x146, 12px corner radius) -->
      <rect x="342" y="48" width="232" height="146" rx="12" class="navy-fill" />
      <!-- Display Screen (Pure white background) -->
      <rect x="356" y="62" width="204" height="118" rx="6" class="white-fill" />

      <!-- Custom Integrated DT Monogram -->
      ${dtMarkup}
    </g>

    <!-- 5. REDESIGNED SEATED WORKER & ERGONOMIC TASK CHAIR -->
    <g id="worker-and-chair">
      <!-- Worker Head: Crisp, athletic, natural cranial silhouette with defined profile facing screen -->
      <path id="worker-head" d="
        M 200 74
        C 200 52, 214 36, 232 36
        C 250 36, 266 50, 268 70
        C 269 82, 264 94, 256 102
        C 248 110, 238 114, 226 114
        C 210 114, 200 96, 200 74 Z
      " class="navy-fill" />

      <!-- Ergonomic Neck -->
      <path id="worker-neck" d="M 220 108 L 242 108 L 246 132 L 218 132 Z" class="navy-fill" />

      <!-- Seated Upper Body & Active Arms (Reaching naturally to keyboard/desk surface) -->
      <path id="worker-body-arms" d="
        M 218 132
        C 192 136, 156 156, 142 182
        C 132 200, 134 222, 148 222
        L 282 222
        C 298 222, 308 212, 306 196
        C 302 174, 282 154, 252 138
        C 242 134, 230 132, 218 132 Z
      " class="navy-fill" />

      <!-- Clean Armpit / Armhole Negative Space Cutout -->
      <path d="M 164 206 C 162 192, 168 184, 178 182 C 180 196, 176 204, 164 206 Z" class="white-fill" />

      <!-- ERGONOMIC TASK CHAIR BACKREST -->
      <!-- Sculpted high-back with lumbar contour and white separation knockout -->
      <path id="chair-backrest" d="
        M 162 168
        C 162 154, 174 146, 188 146
        L 266 146
        C 280 146, 292 154, 292 168
        L 286 284
        C 286 296, 276 306, 262 306
        L 192 306
        C 178 306, 168 296, 168 284
        Z
      " class="navy-fill" stroke="${WHITE}" stroke-width="6" stroke-linejoin="round" />

      <!-- Ergonomic Lumbar Mesh Accent (Modern high-end task chair feature) -->
      <rect x="186" y="274" width="82" height="7" rx="3.5" class="white-fill" />

      <!-- Chair Seat Pan Cushion -->
      <rect id="chair-seat" x="142" y="318" width="168" height="24" rx="8" class="navy-fill" />

      <!-- MODERN TASK CHAIR HYDRAULIC COLUMN (Eliminates the 6 ugly legs!) -->
      <rect id="chair-stem" x="216" y="342" width="20" height="74" rx="4" class="navy-fill" />

      <!-- Sleek Arched 5-Star Caster Base -->
      <path id="chair-base" d="
        M 216 416
        L 150 454
        A 4 4 0 0 0 152 464
        L 166 464
        L 226 428
        L 286 464
        L 300 464
        A 4 4 0 0 0 302 454
        L 236 416
        Z
      " class="navy-fill" />

      <!-- Modern Roller Casters on Floor -->
      <circle cx="150" cy="466" r="7" class="navy-fill" />
      <circle cx="226" cy="466" r="7" class="navy-fill" />
      <circle cx="302" cy="466" r="7" class="navy-fill" />

      <!-- Natural Seated Legs (Ergonomically positioned above the wheeled base) -->
      <rect id="worker-leg-left" x="184" y="342" width="24" height="72" rx="6" class="navy-fill" />
      <rect id="worker-leg-right" x="244" y="342" width="24" height="72" rx="6" class="navy-fill" />
    </g>

  </g>

  <!-- ==================== REFINED WORDMARK ==================== -->
  <g id="wordmark">
    <!-- "Deskwork" in Dark Navy -->
    <path id="wordmark-deskwork" d="${deskworkRes.pathData}" class="navy-fill" />
    <!-- "Tools" in Vibrant Electric Blue -->
    <path id="wordmark-tools" d="${toolsRes.pathData}" class="blue-fill" />
  </g>
</svg>`;
}

// Standalone Mark: DT Monitor Only (Square 512x512)
function buildMarkSVG() {
  const S = 512;
  const dtMarkup = buildDTMonogram(256, 230, 2.0);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <style>
      .navy-fill { fill: ${NAVY}; }
      .blue-fill { fill: ${BLUE}; }
      .white-fill { fill: ${WHITE}; }
    </style>
  </defs>

  <g id="brand-mark">
    <!-- Stand Neck -->
    <rect x="238" y="360" width="36" height="52" rx="6" class="navy-fill" />
    <!-- Stand Base -->
    <path d="M 160 412 L 194 390 L 318 390 L 352 412 Z" class="navy-fill" />

    <!-- Monitor Frame -->
    <rect x="46" y="80" width="420" height="280" rx="24" class="navy-fill" />
    <!-- Screen -->
    <rect x="70" y="104" width="372" height="232" rx="12" class="white-fill" />

    <!-- DT Monogram -->
    ${dtMarkup}
  </g>
</svg>`;
}

// Standalone Icon: Desk Worker Symbol Only (Square 512x512)
function buildIconSVG() {
  const S = 512;
  const dtMarkup = buildDTMonogram(390, 116, 0.95);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <style>
      .navy-fill { fill: ${NAVY}; }
      .blue-fill { fill: ${BLUE}; }
      .white-fill { fill: ${WHITE}; }
    </style>
  </defs>

  <g id="desk-worker-icon" transform="translate(-18, 12) scale(0.97)">
    <!-- Desk Left Leg & Foot -->
    <rect x="58" y="240" width="22" height="224" rx="4" class="navy-fill" />
    <rect x="44" y="464" width="50" height="14" rx="4" class="navy-fill" />

    <!-- 3-Drawer Cabinet -->
    <rect x="316" y="250" width="190" height="62" rx="8" class="navy-fill" />
    <rect x="385" y="277" width="52" height="8" rx="4" class="white-fill" />

    <rect x="316" y="322" width="190" height="62" rx="8" class="navy-fill" />
    <rect x="385" y="349" width="52" height="8" rx="4" class="white-fill" />

    <rect x="316" y="394" width="190" height="62" rx="8" class="navy-fill" />
    <rect x="385" y="421" width="52" height="8" rx="4" class="white-fill" />

    <rect x="330" y="464" width="162" height="14" rx="4" class="navy-fill" />

    <!-- Desktop Surface -->
    <rect x="42" y="222" width="474" height="18" rx="6" class="navy-fill" />

    <!-- Monitor & Stand -->
    <rect x="380" y="184" width="20" height="38" rx="3" class="navy-fill" />
    <path d="M 338 222 L 356 210 L 424 210 L 442 222 Z" class="navy-fill" />

    <rect x="286" y="48" width="216" height="136" rx="12" class="navy-fill" />
    <rect x="300" y="62" width="188" height="108" rx="6" class="white-fill" />
    ${dtMarkup}

    <!-- Worker & Chair -->
    <!-- Head -->
    <path d="
      M 174 74
      C 174 52, 188 36, 206 36
      C 224 36, 240 50, 242 70
      C 243 82, 238 94, 230 102
      C 222 110, 212 114, 200 114
      C 184 114, 174 96, 174 74 Z
    " class="navy-fill" />

    <!-- Neck -->
    <path d="M 194 108 L 216 108 L 220 132 L 192 132 Z" class="navy-fill" />

    <!-- Torso & Arms -->
    <path d="
      M 192 132
      C 166 136, 130 156, 116 182
      C 106 200, 108 222, 122 222
      L 256 222
      C 272 222, 282 212, 280 196
      C 276 174, 256 154, 226 138
      C 216 134, 204 132, 192 132 Z
    " class="navy-fill" />
    <path d="M 138 206 C 136 192, 142 184, 152 182 C 154 196, 150 204, 138 206 Z" class="white-fill" />

    <!-- Chair Backrest -->
    <path d="
      M 136 168
      C 136 154, 148 146, 162 146
      L 240 146
      C 254 146, 266 154, 266 168
      L 260 284
      C 260 296, 250 306, 236 306
      L 166 306
      C 152 306, 142 296, 142 284
      Z
    " class="navy-fill" stroke="${WHITE}" stroke-width="6" stroke-linejoin="round" />
    <rect x="160" y="274" width="82" height="7" rx="3.5" class="white-fill" />

    <!-- Seat Cushion -->
    <rect x="116" y="318" width="168" height="24" rx="8" class="navy-fill" />

    <!-- Stem -->
    <rect x="190" y="342" width="20" height="74" rx="4" class="navy-fill" />

    <!-- Base -->
    <path d="
      M 190 416
      L 124 454
      A 4 4 0 0 0 126 464
      L 140 464
      L 200 428
      L 260 464
      L 274 464
      A 4 4 0 0 0 276 454
      L 210 416
      Z
    " class="navy-fill" />
    <circle cx="124" cy="466" r="7" class="navy-fill" />
    <circle cx="200" cy="466" r="7" class="navy-fill" />
    <circle cx="276" cy="466" r="7" class="navy-fill" />

    <!-- Legs -->
    <rect x="158" y="342" width="24" height="72" rx="6" class="navy-fill" />
    <rect x="218" y="342" width="24" height="72" rx="6" class="navy-fill" />
  </g>
</svg>`;
}

// Generate files
const masterSVG = buildMasterRedesignSVG();
const markSVG = buildMarkSVG();
const iconSVG = buildIconSVG();

fs.writeFileSync("brand-assets/deskwork-tools-logo-refined.svg", masterSVG);
fs.writeFileSync("brand-assets/deskwork-tools-mark-refined.svg", markSVG);
fs.writeFileSync("brand-assets/deskwork-tools-icon-refined.svg", iconSVG);

// Copy to public/brand-assets/ for preview access
fs.mkdirSync("public/brand-assets", { recursive: true });
fs.writeFileSync("public/brand-assets/deskwork-tools-logo-refined.svg", masterSVG);
fs.writeFileSync("public/brand-assets/deskwork-tools-mark-refined.svg", markSVG);
fs.writeFileSync("public/brand-assets/deskwork-tools-icon-refined.svg", iconSVG);

// Render high-res PNGs
function exportPNG(svgString, filename, scale = 1) {
  const resvg = new Resvg(svgString, { fitTo: { mode: "zoom", value: scale } });
  const pngData = resvg.render().asPng();
  fs.writeFileSync(`brand-assets/${filename}`, pngData);
  fs.writeFileSync(`public/brand-assets/${filename}`, pngData);
}

// Export 1X and 2X
exportPNG(masterSVG, "deskwork-tools-logo-refined-1x.png", 1);
exportPNG(masterSVG, "deskwork-tools-logo-refined-2x.png", 2);
exportPNG(masterSVG, "deskwork-tools-logo-refined.png", 2); // Default high-res

// Export Mark & Icon
exportPNG(markSVG, "deskwork-tools-mark-refined.png", 1);
exportPNG(iconSVG, "deskwork-tools-icon-refined.png", 1);

// Favicons
exportPNG(markSVG, "deskwork-tools-favicon-64.png", 64 / 512);
exportPNG(markSVG, "deskwork-tools-favicon-32.png", 32 / 512);

console.log("Master Redesigned Suite Generated Successfully!");
