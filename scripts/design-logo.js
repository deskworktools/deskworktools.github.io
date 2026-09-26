const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const opentype = require("opentype.js");

// Load fonts
const fontExtraBold = opentype.parse(fs.readFileSync("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff").buffer);
const fontBold = opentype.parse(fs.readFileSync("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff").buffer);
const fontInterExtraBold = opentype.parse(fs.readFileSync("node_modules/@fontsource/inter/files/inter-latin-800-normal.woff").buffer);

console.log("Ready to build generator.");
