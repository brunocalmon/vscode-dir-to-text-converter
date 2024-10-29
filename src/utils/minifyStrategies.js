const Terser = require("terser");
const CleanCSS = require("clean-css");
const htmlMinifier = require("html-minifier-terser").minify;

module.exports = {
  js: (content) => Terser.minify(content).code,
  css: (content) => new CleanCSS({}).minify(content).styles,
  html: (content) => htmlMinifier(content, { collapseWhitespace: true, removeComments: true }),
  java: (content) => content.replace(/\s+/g, " "), // Minificação básica para Java
};
