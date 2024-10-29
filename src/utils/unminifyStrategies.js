const beautify = require("js-beautify");

module.exports = {
  js: (content) => beautify.js(content),
  css: (content) => beautify.css(content),
  html: (content) => beautify.html(content),
  java: (content) => content.replace(/(?<=;|})/g, "\n").replace(/\{/, "{\n") // Formatação básica para Java
};
