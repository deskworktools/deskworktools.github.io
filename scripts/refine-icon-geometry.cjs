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

// Custom Geometric DT Monogram for the monitor screen
function getCustomDTMonogram(cx, cy, scale = 1, italic = true) {
  // We craft pure geometric paths for D and T with matching stroke weights and heights
  // Total width ~ 100, height ~ 68
  const h = 64 * scale;
  const stroke = 13 * scale;
  const skew = italic ? -12 : 0; // degrees
  
  // D: outer round, inner cutout
  // T: top bar, center stem
  // Let's create D and T as precise SVG path strings
  return {
    renderSVG: (originX, originY) => {
      const transform = italic 
        ? `transform="translate(${originX}, ${originY}) skewX(${skew})"` 
        : `transform="translate(${originX}, ${originY})"`;
      
      return `
      <g ${transform}>
        <!-- D (Navy) -->
        <path d="
          M -54 -32
          L -22 -32
          A 32 32 0 0 1 -22 32
          L -54 32
          Z
          M -41 -19
          L -22 -19
          A 19 19 0 0 1 -22 19
          L -41 19
          Z
        " fill="${NAVY}" fill-rule="evenodd" />

        <!-- T (Bright Blue) -->
        <path d="
          M -4 -32
          L 50 -32
          L 50 -19
          L 29.5 -19
          L 29.5 32
          L 16.5 32
          L 16.5 -19
          L -4 -19
          Z
        " fill="${BLUE}" />
      </g>`;
    }
  };
}

// Candidate A: Modern Ergonomic Task Chair + Active Posture Worker + Sleek Architectural Desk
function buildCandidateA() {
  const W = 1660;
  const H = 530;
  const textX = 660;
  const deskworkRes = textToPathData(fontPJSBold, "Deskwork", textX, 224, 176, -1.2);
  const toolsRes = textToPathData(fontPJSBold, "Tools", textX, 428, 176, -1.2);

  const monCX = 460;
  const monCY = 126;
  const dtMonogram = getCustomDTMonogram(monCX, monCY, 1.05, true);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <style>
      .navy-fill { fill: ${NAVY}; }
      .blue-fill { fill: ${BLUE}; }
      .white-fill { fill: ${WHITE}; }
    </style>
  </defs>

  <!-- ICON GROUP -->
  <g id="candidate-a-icon">
    <!-- 1. Architectural Desk Frame -->
    <!-- Left Leg: Modern C-frame / Sleek loop leg -->
    <path id="desk-leg-left" d="
      M 54 242
      L 76 242
      L 76 454
      L 100 454
      A 4 4 0 0 1 104 458
      L 104 472
      A 4 4 0 0 1 100 476
      L 48 476
      A 4 4 0 0 1 44 472
      L 44 458
      A 4 4 0 0 1 48 454
      L 54 454
      Z
    " class="navy-fill" />

    <!-- 2. Right Drawer Cabinet (Pedestal Unit) -->
    <!-- Clean, flush 3-drawer unit with modern architectural pulls -->
    <g id="drawer-pedestal">
      <!-- Drawer 1 -->
      <rect x="364" y="254" width="204" height="60" rx="8" class="navy-fill" />
      <rect x="438" y="278" width="56" height="10" rx="5" class="white-fill" />

      <!-- Drawer 2 -->
      <rect x="364" y="324" width="204" height="60" rx="8" class="navy-fill" />
      <rect x="438" y="348" width="56" height="10" rx="5" class="white-fill" />

      <!-- Drawer 3 -->
      <rect x="364" y="394" width="204" height="60" rx="8" class="navy-fill" />
      <rect x="438" y="418" width="56" height="10" rx="5" class="white-fill" />

      <!-- Modern architectural plinth base under cabinet -->
      <rect x="382" y="460" width="168" height="16" rx="4" class="navy-fill" />
    </g>

    <!-- 3. Desktop Surface (Substantial 18px horizontal beam) -->
    <rect id="desktop-top" x="38" y="224" width="540" height="18" rx="6" class="navy-fill" />

    <!-- 4. Monitor & Stand -->
    <g id="monitor-unit">
      <!-- Stand Neck -->
      <rect x="450" y="198" width="20" height="28" rx="3" class="navy-fill" />
      <!-- Stand Base -->
      <path d="M 412 224 L 426 214 L 494 214 L 508 224 Z" class="navy-fill" />

      <!-- Display Bezel (16:10 slim modern bezel) -->
      <rect x="344" y="52" width="232" height="148" rx="12" class="navy-fill" />
      <!-- Screen Display Area -->
      <rect x="358" y="66" width="204" height="120" rx="6" class="white-fill" />

      <!-- Custom Integrated DT Monogram -->
      ${dtMonogram.renderSVG(460, 126)}
    </g>

    <!-- 5. Redesigned Worker & Modern Ergonomic Task Chair -->
    <g id="worker-and-task-chair">
      <!-- Head: Clean, focused silhouette leaning slightly toward screen -->
      <path id="worker-head" d="
        M 198 76
        C 198 52, 214 36, 234 36
        C 254 36, 270 52, 270 74
        C 270 90, 260 106, 248 112
        C 238 116, 226 116, 216 114
        C 204 110, 198 94, 198 76 Z
      " class="navy-fill" />

      <!-- Strong, natural neck -->
      <path id="worker-neck" d="M 224 110 L 244 110 L 248 136 L 222 136 Z" class="navy-fill" />

      <!-- Torso & Arms in active typing / desktop engagement -->
      <!-- Smooth, confident curves with clear negative space -->
      <path id="worker-torso" d="
        M 222 134
        C 194 138, 156 156, 142 182
        C 134 198, 134 214, 144 224
        C 152 228, 172 228, 198 228
        L 282 228
        C 304 228, 316 220, 318 206
        C 320 188, 306 170, 286 152
        C 268 140, 252 136, 246 134
        Z
      " class="navy-fill" />

      <!-- Ergonomic Armhole Cutout -->
      <path d="M 164 212 C 164 196, 170 186, 180 184 C 180 198, 176 208, 164 212 Z" class="white-fill" />

      <!-- Ergonomic Task Chair Backrest (Contoured high-back with lumbar taper) -->
      <path id="chair-back" d="
        M 166 172
        C 166 162, 176 156, 186 156
        L 274 156
        C 284 156, 294 162, 294 172
        L 290 288
        C 290 300, 280 310, 268 310
        L 192 310
        C 180 310, 170 300, 170 288
        Z
      " class="navy-fill" stroke="${WHITE}" stroke-width="5" stroke-linejoin="round" />

      <!-- Chair Seat Cushion (Generous ergonomic curve) -->
      <rect id="chair-seat" x="146" y="322" width="168" height="26" rx="10" class="navy-fill" />

      <!-- MODERN TASK CHAIR STEM & 5-STAR WHEELED BASE (Eliminates the 6 ugly legs!) -->
      <!-- Central Hydraulic Pneumatic Column -->
      <rect id="chair-stem" x="220" y="348" width="20" height="74" rx="4" class="navy-fill" />

      <!-- Arched Modern 5-Star Caster Base -->
      <!-- Center Hub -->
      <rect x="214" y="416" width="32" height="14" rx="4" class="navy-fill" />
      <!-- Left Arched Leg -->
      <path d="M 218 420 L 158 454 L 160 464 L 222 426 Z" class="navy-fill" />
      <!-- Right Arched Leg -->
      <path d="M 242 420 L 302 454 L 300 464 L 238 426 Z" class="navy-fill" />
      <!-- Center Down Leg -->
      <rect x="223" y="426" width="14" height="34" rx="3" class="navy-fill" />

      <!-- Caster Wheels (Clean modern roller balls/wheels on floor) -->
      <circle cx="156" cy="468" r="8" class="navy-fill" />
      <circle cx="230" cy="468" r="8" class="navy-fill" />
      <circle cx="304" cy="468" r="8" class="navy-fill" />

      <!-- Seated Legs (Natural ergonomic posture, cleanly framed above the base) -->
      <rect x="188" y="348" width="22" height="72" rx="6" class="navy-fill" />
      <rect x="250" y="348" width="22" height="72" rx="6" class="navy-fill" />
    </g>
  </g>

  <!-- WORDMARK -->
  <g id="wordmark">
    <path d="${deskworkRes.pathData}" class="navy-fill" />
    <path d="${toolsRes.pathData}" class="blue-fill" />
  </g>
</svg>`;
}

// Candidate B: Semi-Profile Modern Tech Worker (Active Flow State, Crisp Geometric Precision)
function buildCandidateB() {
  const W = 1660;
  const H = 530;
  const textX = 660;
  const deskworkRes = textToPathData(fontPJSBold, "Deskwork", textX, 224, 176, -1.2);
  const toolsRes = textToPathData(fontPJSBold, "Tools", textX, 428, 176, -1.2);

  const monCX = 460;
  const monCY = 126;
  const dtMonogram = getCustomDTMonogram(monCX, monCY, 1.05, true);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <style>
      .navy-fill { fill: ${NAVY}; }
      .blue-fill { fill: ${BLUE}; }
      .white-fill { fill: ${WHITE}; }
    </style>
  </defs>

  <!-- ICON GROUP: Geometric Tech-Worker -->
  <g id="candidate-b-icon">
    <!-- 1. Modern Minimalist Desk -->
    <!-- Solid clean desktop with rounded corner -->
    <rect x="42" y="222" width="536" height="20" rx="6" class="navy-fill" />

    <!-- Left Leg: Clean Architectural A-Line / Inverted U Frame -->
    <path d="
      M 60 242
      L 82 242
      L 96 462
      L 114 462
      A 4 4 0 0 1 118 466
      L 118 474
      A 4 4 0 0 1 114 478
      L 46 478
      A 4 4 0 0 1 42 474
      L 42 466
      A 4 4 0 0 1 46 462
      L 66 462
      Z
    " class="navy-fill" />

    <!-- 2. Integrated Drawer Unit -->
    <g id="pedestal-b">
      <!-- Drawer 1 -->
      <rect x="368" y="252" width="200" height="62" rx="8" class="navy-fill" />
      <rect x="444" y="278" width="48" height="9" rx="4.5" class="white-fill" />

      <!-- Drawer 2 -->
      <rect x="368" y="322" width="200" height="62" rx="8" class="navy-fill" />
      <rect x="444" y="348" width="48" height="9" rx="4.5" class="white-fill" />

      <!-- Drawer 3 -->
      <rect x="368" y="392" width="200" height="62" rx="8" class="navy-fill" />
      <rect x="444" y="418" width="48" height="9" rx="4.5" class="white-fill" />

      <!-- Recessed Plinth base -->
      <rect x="388" y="462" width="160" height="16" rx="4" class="navy-fill" />
    </g>

    <!-- 3. Modern Ultra-Thin Display & DT Monogram -->
    <g id="display-b">
      <!-- Neck -->
      <rect x="450" y="196" width="20" height="30" rx="3" class="navy-fill" />
      <!-- Base -->
      <path d="M 408 222 L 424 212 L 496 212 L 512 222 Z" class="navy-fill" />

      <!-- Screen Frame -->
      <rect x="344" y="50" width="232" height="148" rx="12" class="navy-fill" />
      <!-- White screen -->
      <rect x="358" y="64" width="204" height="120" rx="6" class="white-fill" />

      <!-- DT Monogram -->
      ${dtMonogram.renderSVG(460, 124)}
    </g>

    <!-- 4. Pure Geometric Seated Worker & Modern Ergonomic Chair -->
    <g id="worker-b">
      <!-- Head: Clean, focused silhouette facing monitor -->
      <circle cx="218" cy="74" r="34" class="navy-fill" />
      
      <!-- Modern headset / focus accent on ear (Subtle tech detail) -->
      <!-- Natural neck connection -->
      <path d="M 206 104 L 230 104 L 234 132 L 204 132 Z" class="navy-fill" />

      <!-- Upper Body & Arm typing on desk -->
      <!-- Smooth flowing vector curve, elegant shoulder slope, forearm resting on desk -->
      <path d="
        M 204 132
        C 176 138, 146 160, 134 188
        C 126 206, 130 222, 146 222
        L 286 222
        C 298 222, 304 214, 302 202
        C 298 182, 280 160, 252 142
        C 240 134, 226 132, 204 132 Z
      " class="navy-fill" />

      <!-- Armhole negative space -->
      <path d="M 158 206 C 156 192, 162 184, 172 182 C 174 196, 170 204, 158 206 Z" class="white-fill" />

      <!-- Ergonomic Mesh Chair Shell (Continuous Modern Ribbon Contour) -->
      <path d="
        M 152 170
        C 152 154, 166 144, 184 144
        L 256 144
        C 274 144, 288 154, 288 170
        L 282 284
        C 282 298, 270 308, 256 308
        L 184 308
        C 170 308, 158 298, 158 284
        Z
      " class="navy-fill" stroke="${WHITE}" stroke-width="6" stroke-linejoin="round" />

      <!-- Lumbar mesh horizontal accent slot -->
      <rect x="180" y="274" width="80" height="8" rx="4" class="white-fill" />

      <!-- Seat Pan -->
      <rect x="136" y="318" width="168" height="24" rx="8" class="navy-fill" />

      <!-- Single Solid Pneumatic Lift Stem (Herman Miller / Steelcase style) -->
      <rect x="210" y="342" width="20" height="78" rx="4" class="navy-fill" />

      <!-- Sleek Architectural Caster Star Base -->
      <path d="
        M 220 416
        L 142 458
        A 5 5 0 0 0 144 468
        L 160 468
        L 220 430
        L 280 468
        L 296 468
        A 5 5 0 0 0 298 458
        L 220 416
        Z
      " class="navy-fill" />
      
      <!-- Sleek Dual Casters -->
      <circle cx="146" cy="470" r="7" class="navy-fill" />
      <circle cx="220" cy="466" r="7" class="navy-fill" />
      <circle cx="294" cy="470" r="7" class="navy-fill" />

      <!-- Seated Legs in Relaxed Focus Posture -->
      <path d="
        M 174 342
        L 174 416
        L 194 416
        L 194 342
        Z
      " class="navy-fill" />
      <path d="
        M 246 342
        L 246 416
        L 266 416
        L 266 342
        Z
      " class="navy-fill" />
    </g>
  </g>

  <!-- WORDMARK -->
  <g id="wordmark">
    <path d="${deskworkRes.pathData}" class="navy-fill" />
    <path d="${toolsRes.pathData}" class="blue-fill" />
  </g>
</svg>`;
}

// Candidate C: Iconic Geometric Minimalist (Ultra-Refined Masterpiece)
// Here, we achieve the ultimate balance of recognizability, bold modern SaaS aesthetic, and zero clutter.
function buildCandidateC() {
  const W = 1660;
  const H = 530;
  const textX = 660;
  const deskworkRes = textToPathData(fontPJSBold, "Deskwork", textX, 224, 176, -1.2);
  const toolsRes = textToPathData(fontPJSBold, "Tools", textX, 428, 176, -1.2);

  const monCX = 460;
  const monCY = 126;
  const dtMonogram = getCustomDTMonogram(monCX, monCY, 1.08, true);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <style>
      .navy-fill { fill: ${NAVY}; }
      .blue-fill { fill: ${BLUE}; }
      .white-fill { fill: ${WHITE}; }
    </style>
  </defs>

  <g id="candidate-c-icon">
    <!-- 1. Desktop: Crisp 18px horizontal bar spanning desk and pedestal -->
    <rect x="44" y="222" width="532" height="18" rx="6" class="navy-fill" />

    <!-- Left Leg: Architectural square loop leg (Clean modern studio desk) -->
    <rect x="58" y="240" width="22" height="222" rx="4" class="navy-fill" />
    <rect x="44" y="462" width="50" height="14" rx="4" class="navy-fill" />

    <!-- 2. Pedestal Drawer Unit: 3 perfectly balanced drawers -->
    <g id="drawers-c">
      <!-- Drawer 1 -->
      <rect x="368" y="250" width="200" height="62" rx="8" class="navy-fill" />
      <rect x="442" y="277" width="52" height="8" rx="4" class="white-fill" />

      <!-- Drawer 2 -->
      <rect x="368" y="320" width="200" height="62" rx="8" class="navy-fill" />
      <rect x="442" y="347" width="52" height="8" rx="4" class="white-fill" />

      <!-- Drawer 3 -->
      <rect x="368" y="390" width="200" height="62" rx="8" class="navy-fill" />
      <rect x="442" y="417" width="52" height="8" rx="4" class="white-fill" />

      <!-- Pedestal Footing -->
      <rect x="382" y="458" width="172" height="18" rx="4" class="navy-fill" />
    </g>

    <!-- 3. Studio Monitor & Custom DT -->
    <g id="monitor-c">
      <!-- Stand Stem -->
      <rect x="450" y="194" width="20" height="30" rx="3" class="navy-fill" />
      <!-- Stand Base -->
      <path d="M 406 222 L 424 210 L 496 210 L 514 222 Z" class="navy-fill" />

      <!-- Screen Frame -->
      <rect x="344" y="48" width="232" height="148" rx="12" class="navy-fill" />
      <!-- Screen Display -->
      <rect x="358" y="62" width="204" height="120" rx="6" class="white-fill" />

      <!-- Custom Integrated DT Monogram -->
      ${dtMonogram.renderSVG(460, 122)}
    </g>

    <!-- 4. Seated Worker & Modern Ergonomic Chair -->
    <g id="worker-c">
      <!-- Worker Head: Crisp modern circular head with energetic angle -->
      <circle cx="224" cy="74" r="35" class="navy-fill" />

      <!-- Neck -->
      <rect x="216" y="104" width="18" height="28" rx="4" class="navy-fill" />

      <!-- Shoulders & Arms: Clean, natural athletic posture reaching to desktop -->
      <path d="
        M 216 130
        C 188 136, 154 156, 140 184
        C 130 202, 134 222, 150 222
        L 282 222
        C 298 222, 308 212, 306 196
        C 302 174, 282 154, 252 138
        C 240 132, 228 130, 216 130 Z
      " class="navy-fill" />

      <!-- Defined Armhole Negative Space -->
      <path d="M 164 206 C 162 192, 168 184, 178 182 C 180 196, 176 204, 164 206 Z" class="white-fill" />

      <!-- Modern Ergonomic Chair Backrest -->
      <!-- Smooth rounded rectangle with refined proportions -->
      <rect x="156" y="160" width="136" height="146" rx="22" class="navy-fill" stroke="${WHITE}" stroke-width="6" />

      <!-- Lumbar Comfort Groove (Modern tech chair detail) -->
      <rect x="180" y="276" width="88" height="6" rx="3" class="white-fill" />

      <!-- Chair Seat Cushion -->
      <rect x="142" y="318" width="164" height="24" rx="8" class="navy-fill" />

      <!-- Single Center Hydraulic Lift Cylinder -->
      <rect x="214" y="342" width="20" height="74" rx="4" class="navy-fill" />

      <!-- Modern 5-Star Arched Wheeled Base -->
      <path d="
        M 214 416
        L 152 454
        A 4 4 0 0 0 154 464
        L 168 464
        L 224 428
        L 280 464
        L 294 464
        A 4 4 0 0 0 296 454
        L 234 416
        Z
      " class="navy-fill" />

      <!-- Casters -->
      <circle cx="152" cy="466" r="7" class="navy-fill" />
      <circle cx="224" cy="466" r="7" class="navy-fill" />
      <circle cx="296" cy="466" r="7" class="navy-fill" />

      <!-- Seated Legs under desk -->
      <rect x="184" y="342" width="24" height="72" rx="6" class="navy-fill" />
      <rect x="240" y="342" width="24" height="72" rx="6" class="navy-fill" />
    </g>
  </g>

  <!-- WORDMARK -->
  <g id="wordmark">
    <path d="${deskworkRes.pathData}" class="navy-fill" />
    <path d="${toolsRes.pathData}" class="blue-fill" />
  </g>
</svg>`;
}

// Generate all 3 candidates
fs.writeFileSync("brand-assets/candidate-a.svg", buildCandidateA());
fs.writeFileSync("brand-assets/candidate-b.svg", buildCandidateB());
fs.writeFileSync("brand-assets/candidate-c.svg", buildCandidateC());

// Render PNGs
function renderPNG(svgStr, outPath, scale = 1) {
  const resvg = new Resvg(svgStr, { fitTo: { mode: "zoom", value: scale } });
  const pngData = resvg.render();
  fs.writeFileSync(outPath, pngData.asPng());
}

renderPNG(buildCandidateA(), "brand-assets/candidate-a.png", 1);
renderPNG(buildCandidateB(), "brand-assets/candidate-b.png", 1);
renderPNG(buildCandidateC(), "brand-assets/candidate-c.png", 1);

console.log("Candidate SVGs and PNGs successfully generated!");
