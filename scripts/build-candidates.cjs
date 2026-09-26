const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const opentype = require("opentype.js");

const NAVY = "#0B132A";
const BLUE = "#0066FF";
const WHITE = "#FFFFFF";

// Fonts
const fontPJSBold = opentype.parse(fs.readFileSync("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff").buffer);
const fontPJSItalic = opentype.parse(fs.readFileSync("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-italic.woff").buffer);
const fontInter = opentype.parse(fs.readFileSync("node_modules/@fontsource/inter/files/inter-latin-800-normal.woff").buffer);

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

function getDTPaths(fontItalic, cx, cy, fontSize = 72, gap = 8) {
  const glyphD = fontItalic.charToGlyph("D");
  const glyphT = fontItalic.charToGlyph("T");

  const wD = (glyphD.advanceWidth / fontItalic.unitsPerEm) * fontSize;
  const wT = (glyphT.advanceWidth / fontItalic.unitsPerEm) * fontSize;
  const totalW = wD + gap + wT;

  const startX = cx - (totalW / 2) + 5;
  const baselineY = cy + (fontSize * 0.35);

  const pathD = glyphD.getPath(startX, baselineY, fontSize).toPathData();
  const pathT = glyphT.getPath(startX + wD + gap, baselineY, fontSize).toPathData();

  return { pathD, pathT, startX, baselineY, totalW };
}

// =========================================================================
// CANDIDATE 1: Master Refined Vector (The True Polish of Current Concept)
// =========================================================================
function buildMasterLogo() {
  const W = 1660;
  const H = 530;

  // Wordmark positioning
  const textX = 648;
  const deskworkY = 224;
  const toolsY = 428;
  const fontSize = 176;
  const tracking = -1.2;

  const deskworkRes = textToPathData(fontPJSBold, "Deskwork", textX, deskworkY, fontSize, tracking);
  const toolsRes = textToPathData(fontPJSBold, "Tools", textX, toolsY, fontSize, tracking);

  // Monitor center cx = 456, cy = 126
  const monCX = 456;
  const monCY = 126;
  const dt = getDTPaths(fontPJSItalic, monCX, monCY, 74, 9);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <!-- Sharp rendering -->
    <style>
      .navy-fill { fill: ${NAVY}; }
      .blue-fill { fill: ${BLUE}; }
      .white-fill { fill: ${WHITE}; }
    </style>
  </defs>

  <!-- ==================== DESKWORK TOOLS REFINED ICON ==================== -->
  <g id="desk-worker-icon">
    
    <!-- 1. Left Desk Leg & Leveling Foot -->
    <rect id="desk-leg-left" x="66" y="246" width="22" height="226" rx="3" class="navy-fill" />
    <rect id="desk-foot-left" x="54" y="468" width="46" height="14" rx="4" class="navy-fill" />

    <!-- 2. Right Drawer Cabinet (Pedestal Unit) -->
    <g id="drawer-cabinet">
      <!-- Outer cabinet structure / 3 drawers with consistent 10px spacing -->
      <!-- Drawer 1 (Top) -->
      <g id="drawer-1">
        <rect x="354" y="256" width="214" height="58" rx="6" class="navy-fill" />
        <!-- Centered horizontal slot handle -->
        <rect x="435" y="280" width="52" height="10" rx="5" class="white-fill" />
      </g>

      <!-- Drawer 2 (Middle) -->
      <g id="drawer-2">
        <rect x="354" y="324" width="214" height="58" rx="6" class="navy-fill" />
        <rect x="435" y="348" width="52" height="10" rx="5" class="white-fill" />
      </g>

      <!-- Drawer 3 (Bottom) -->
      <g id="drawer-3">
        <rect x="354" y="392" width="214" height="58" rx="6" class="navy-fill" />
        <rect x="435" y="416" width="52" height="10" rx="5" class="white-fill" />
      </g>

      <!-- Cabinet Base Plinth / Feet -->
      <rect id="drawer-foot-left" x="372" y="450" width="28" height="32" rx="4" class="navy-fill" />
      <rect id="drawer-foot-right" x="522" y="450" width="28" height="32" rx="4" class="navy-fill" />
    </g>

    <!-- 3. Desktop Surface (Crisp horizontal architectural beam) -->
    <rect id="desktop-surface" x="44" y="226" width="536" height="20" rx="5" class="navy-fill" />

    <!-- 4. Monitor & Stand -->
    <g id="monitor-unit">
      <!-- Monitor Stand Neck -->
      <rect id="monitor-neck" x="446" y="200" width="20" height="30" rx="2" class="navy-fill" />
      <!-- Monitor Stand Desktop Foot -->
      <path id="monitor-stand-foot" d="M 402 226 L 418 214 L 494 214 L 510 226 Z" class="navy-fill" />

      <!-- Monitor Frame (16:10 modern widescreen display) -->
      <rect id="monitor-bezel" x="336" y="52" width="240" height="150" rx="12" class="navy-fill" />
      <!-- Inner Screen (Bright White Display Area) -->
      <rect id="monitor-screen" x="350" y="66" width="212" height="122" rx="6" class="white-fill" />

      <!-- DT Monogram inside Screen -->
      <!-- D in Navy -->
      <path id="dt-mark-d" d="${dt.pathD}" class="navy-fill" />
      <!-- T in Vibrant Blue -->
      <path id="dt-mark-t" d="${dt.pathT}" class="blue-fill" />
    </g>

    <!-- 5. Seated Person & Chair -->
    <g id="person-and-chair">
      
      <!-- Worker Head (Smooth, athletic silhouette with attentive posture looking at monitor) -->
      <path id="person-head" d="
        M 206 78
        C 206 56, 222 40, 244 40
        C 264 40, 280 54, 280 74
        C 280 88, 274 100, 264 108
        C 256 114, 242 116, 230 116
        C 214 116, 206 100, 206 78 Z
      " class="navy-fill" />

      <!-- Neck -->
      <path id="person-neck" d="M 230 112 L 252 112 L 256 138 L 232 138 Z" class="navy-fill" />

      <!-- Worker Shoulders, Back & Arms -->
      <!-- Left arm curves down to desk, right arm extends forward to keyboard -->
      <path id="person-torso-arms" d="
        M 232 136
        C 208 140, 168 156, 150 180
        C 140 194, 138 210, 146 226
        C 152 230, 168 230, 192 230
        L 282 230
        C 304 230, 318 222, 320 208
        C 322 192, 310 176, 290 158
        C 274 146, 258 138, 252 136
        Z
      " class="navy-fill" />

      <!-- Negative space armhole cutouts (Subtle armpit openings for natural anatomical depth) -->
      <!-- Left armpit opening -->
      <path d="M 172 208 C 172 192, 178 184, 186 182 C 186 196, 182 206, 172 208 Z" class="white-fill" />

      <!-- Chair Backrest (Ergonomic rounded backrest, centered behind worker at cx = 216) -->
      <!-- Width = 146, Height = 148, rx = 24 -->
      <!-- 4px white mask stroke so chair reads distinctly from upper body -->
      <rect id="chair-backrest" x="143" y="174" width="146" height="148" rx="24" class="navy-fill" stroke="${WHITE}" stroke-width="4" />

      <!-- Chair Seat Cushion (Horizontal support cushion) -->
      <rect id="chair-seat" x="135" y="330" width="162" height="26" rx="8" class="navy-fill" />

      <!-- Seated Legs (Clean vertical profiles extending down to floor) -->
      <!-- Left leg -->
      <rect id="leg-left" x="180" y="356" width="30" height="112" rx="4" class="navy-fill" />
      <!-- Right leg -->
      <rect id="leg-right" x="222" y="356" width="30" height="112" rx="4" class="navy-fill" />

      <!-- Shoes / Feet on floor -->
      <rect id="foot-left" x="174" y="468" width="40" height="14" rx="4" class="navy-fill" />
      <rect id="foot-right" x="218" y="468" width="48" height="14" rx="4" class="navy-fill" />

      <!-- Chair Frame & Legs (Clean, balanced structural legs flanking the worker legs) -->
      <!-- Left chair leg: x = 144 to 164 -->
      <rect id="chair-leg-left" x="144" y="356" width="18" height="114" rx="3" class="navy-fill" />
      <rect id="chair-foot-left" x="136" y="468" width="34" height="14" rx="4" class="navy-fill" />

      <!-- Right chair leg: x = 268 to 288 -->
      <rect id="chair-leg-right" x="270" y="356" width="18" height="114" rx="3" class="navy-fill" />
      <rect id="chair-foot-right" x="262" y="468" width="34" height="14" rx="4" class="navy-fill" />

    </g>

  </g>

  <!-- ==================== REFINED WORDMARK ==================== -->
  <g id="wordmark">
    <!-- "Deskwork" in Dark Navy -->
    <path id="wordmark-deskwork" d="${deskworkRes.pathData}" class="navy-fill" />
    <!-- "Tools" in Vibrant Blue -->
    <path id="wordmark-tools" d="${toolsRes.pathData}" class="blue-fill" />
  </g>

</svg>`;

  return svg;
}

// =========================================================================
// STANDALONE BRAND MARK (Secondary Asset: DT Monitor Symbol)
// =========================================================================
function buildBrandMark() {
  const S = 512; // Square 512x512 canvas

  // Centered monitor on 512x512 canvas
  // Monitor width = 384, height = 240, rx = 20
  // Centered at cx = 256, cy = 200
  const monX = 64;
  const monY = 80;
  const monW = 384;
  const monH = 240;
  const screenX = 84;
  const screenY = 100;
  const screenW = 344;
  const screenH = 200;

  const dt = getDTPaths(fontPJSItalic, 256, 200, 118, 14);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <style>
      .navy-fill { fill: ${NAVY}; }
      .blue-fill { fill: ${BLUE}; }
      .white-fill { fill: ${WHITE}; }
    </style>
  </defs>

  <!-- Monitor Stand Neck -->
  <rect x="238" y="320" width="36" height="60" rx="4" class="navy-fill" />
  
  <!-- Monitor Stand Base Foot -->
  <path d="M 160 380 L 190 360 L 322 360 L 352 380 Z" class="navy-fill" />
  <rect x="140" y="380" width="232" height="24" rx="6" class="navy-fill" />

  <!-- Monitor Outer Bezel -->
  <rect x="${monX}" y="${monY}" width="${monW}" height="${monH}" rx="22" class="navy-fill" />

  <!-- Monitor Screen (White Display Area) -->
  <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" rx="12" class="white-fill" />

  <!-- DT Monogram inside Screen -->
  <!-- D in Navy -->
  <path d="${dt.pathD}" class="navy-fill" />
  <!-- T in Vibrant Blue -->
  <path d="${dt.pathT}" class="blue-fill" />

</svg>`;

  return svg;
}

// Standalone Desk-Worker Icon without wordmark (Square 512x512)
function buildStandaloneIcon() {
  const S = 512;
  // Scaled and centered icon inside 512x512
  // Icon bounding box is approx 40..580 (width ~540), 40..490 (height ~450)
  // Scale factor ~ 0.88, translate
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <style>
      .navy-fill { fill: ${NAVY}; }
      .blue-fill { fill: ${BLUE}; }
      .white-fill { fill: ${WHITE}; }
    </style>
  </defs>

  <g transform="translate(20, 36) scale(0.86)">
    <!-- 1. Left Desk Leg & Foot -->
    <rect x="66" y="246" width="22" height="226" rx="3" class="navy-fill" />
    <rect x="54" y="468" width="46" height="14" rx="4" class="navy-fill" />

    <!-- 2. Drawer Cabinet -->
    <g>
      <rect x="354" y="256" width="214" height="58" rx="6" class="navy-fill" />
      <rect x="435" y="280" width="52" height="10" rx="5" class="white-fill" />

      <rect x="354" y="324" width="214" height="58" rx="6" class="navy-fill" />
      <rect x="435" y="348" width="52" height="10" rx="5" class="white-fill" />

      <rect x="354" y="392" width="214" height="58" rx="6" class="navy-fill" />
      <rect x="435" y="416" width="52" height="10" rx="5" class="white-fill" />

      <rect x="372" y="450" width="28" height="32" rx="4" class="navy-fill" />
      <rect x="522" y="450" width="28" height="32" rx="4" class="navy-fill" />
    </g>

    <!-- 3. Desktop Surface -->
    <rect x="44" y="226" width="536" height="20" rx="5" class="navy-fill" />

    <!-- 4. Monitor & Stand -->
    <g>
      <rect x="446" y="200" width="20" height="30" rx="2" class="navy-fill" />
      <path d="M 402 226 L 418 214 L 494 214 L 510 226 Z" class="navy-fill" />

      <rect x="336" y="52" width="240" height="150" rx="12" class="navy-fill" />
      <rect x="350" y="66" width="212" height="122" rx="6" class="white-fill" />

      <!-- DT Monogram -->
      <g>
        <path d="${getDTPaths(fontPJSItalic, 456, 126, 74, 9).pathD}" class="navy-fill" />
        <path d="${getDTPaths(fontPJSItalic, 456, 126, 74, 9).pathT}" class="blue-fill" />
      </g>
    </g>

    <!-- 5. Seated Person & Chair -->
    <g>
      <path d="
        M 206 78
        C 206 56, 222 40, 244 40
        C 264 40, 280 54, 280 74
        C 280 88, 274 100, 264 108
        C 256 114, 242 116, 230 116
        C 214 116, 206 100, 206 78 Z
      " class="navy-fill" />

      <path d="M 230 112 L 252 112 L 256 138 L 232 138 Z" class="navy-fill" />

      <path d="
        M 232 136
        C 208 140, 168 156, 150 180
        C 140 194, 138 210, 146 226
        C 152 230, 168 230, 192 230
        L 282 230
        C 304 230, 318 222, 320 208
        C 322 192, 310 176, 290 158
        C 274 146, 258 138, 252 136
        Z
      " class="navy-fill" />

      <path d="M 172 208 C 172 192, 178 184, 186 182 C 186 196, 182 206, 172 208 Z" class="white-fill" />

      <rect x="143" y="174" width="146" height="148" rx="24" class="navy-fill" stroke="${WHITE}" stroke-width="4" />
      <rect x="135" y="330" width="162" height="26" rx="8" class="navy-fill" />

      <rect x="180" y="356" width="30" height="112" rx="4" class="navy-fill" />
      <rect x="222" y="356" width="30" height="112" rx="4" class="navy-fill" />

      <rect x="174" y="468" width="40" height="14" rx="4" class="navy-fill" />
      <rect x="218" y="468" width="48" height="14" rx="4" class="navy-fill" />

      <rect x="144" y="356" width="18" height="114" rx="3" class="navy-fill" />
      <rect x="136" y="468" width="34" height="14" rx="4" class="navy-fill" />

      <rect x="270" y="356" width="18" height="114" rx="3" class="navy-fill" />
      <rect x="262" y="468" width="34" height="14" rx="4" class="navy-fill" />
    </g>
  </g>
</svg>`;

  return svg;
}

// Generate all assets
const primarySvg = buildMasterLogo();
fs.writeFileSync("brand-assets/deskwork-tools-logo-refined.svg", primarySvg);
fs.writeFileSync("public/brand-assets/deskwork-tools-logo-refined.svg", primarySvg);

// High-res 3320x1060 (2x) PNG
const resvgPrimary = new Resvg(primarySvg, {
  fitTo: { mode: "width", value: 3320 }
});
const primaryPng = resvgPrimary.render().asPng();
fs.writeFileSync("brand-assets/deskwork-tools-logo-refined.png", primaryPng);
fs.writeFileSync("public/brand-assets/deskwork-tools-logo-refined.png", primaryPng);

// Standard 1660x530 (1x) PNG
const resvg1x = new Resvg(primarySvg, {
  fitTo: { mode: "width", value: 1660 }
});
fs.writeFileSync("brand-assets/deskwork-tools-logo-refined-1x.png", resvg1x.render().asPng());
fs.writeFileSync("public/brand-assets/deskwork-tools-logo-refined-1x.png", resvg1x.render().asPng());

// Secondary Brand Mark (DT Monitor Symbol 512x512)
const markSvg = buildBrandMark();
fs.writeFileSync("brand-assets/deskwork-tools-mark-refined.svg", markSvg);
fs.writeFileSync("public/brand-assets/deskwork-tools-mark-refined.svg", markSvg);

const resvgMark = new Resvg(markSvg, {
  fitTo: { mode: "width", value: 1024 }
});
const markPng = resvgMark.render().asPng();
fs.writeFileSync("brand-assets/deskwork-tools-mark-refined.png", markPng);
fs.writeFileSync("public/brand-assets/deskwork-tools-mark-refined.png", markPng);

// Standalone Desk-Worker Icon (512x512)
const iconSvg = buildStandaloneIcon();
fs.writeFileSync("brand-assets/deskwork-tools-icon-refined.svg", iconSvg);
fs.writeFileSync("public/brand-assets/deskwork-tools-icon-refined.svg", iconSvg);

const resvgIcon = new Resvg(iconSvg, {
  fitTo: { mode: "width", value: 1024 }
});
const iconPng = resvgIcon.render().asPng();
fs.writeFileSync("brand-assets/deskwork-tools-icon-refined.png", iconPng);
fs.writeFileSync("public/brand-assets/deskwork-tools-icon-refined.png", iconPng);

console.log("All brand assets generated successfully!");
