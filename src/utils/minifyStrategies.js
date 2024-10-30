const Terser = require("terser");
const CleanCSS = require("clean-css");
const htmlMinifier = require("html-minifier-terser").minify;
const yaml = require("js-yaml");

export default {
  js: (content) => Terser.minify(content).code,
  css: (content) => new CleanCSS({}).minify(content).styles,
  html: (content) => htmlMinifier(content, { collapseWhitespace: true, removeComments: true }),
  java: (content) => content.replace(/\s+/g, " "),
  ts: (content) => Terser.minify(content).code,
  json: (content) => JSON.stringify(JSON.parse(content)),
  xml: (content) => content.replace(/\s+/g, " "),
  yaml: (content) => yaml.dump(yaml.load(content), { skipInvalid: true })
};
