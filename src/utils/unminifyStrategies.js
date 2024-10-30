const beautify = require("js-beautify");
const yaml = require("js-yaml");

module.exports = {
  // Beautifies JavaScript code
  js: (content) => beautify.js(content),

  // Beautifies CSS code
  css: (content) => beautify.css(content),

  // Beautifies HTML code
  html: (content) => beautify.html(content),

  // Adds newlines after semicolons and opening curly braces in Java code
  java: (content) => content.replace(/(?<=;|})/g, "\n").replace(/\{/, "{\n"),

  // Beautifies TypeScript code
  ts: (content) => beautify.js(content), // Use JS beautifier for TS

  // Formats JSON code
  json: (content) => JSON.stringify(JSON.parse(content), null, 2),

  // Beautifies XML code
  xml: (content) => beautify.xml(content),

  // Beautifies YAML code
  yaml: (content) => yaml.dump(yaml.load(content), { indent: 2 }),
};
