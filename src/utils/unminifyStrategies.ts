import beautify from "js-beautify";
import yaml from "js-yaml";

export interface UnminifyStrategies {
  [ext: string]: (content: string) => string;
}

const unminifyStrategies: UnminifyStrategies = {
  js: (content: string) => beautify.js(content),
  css: (content: string) => beautify.css(content),
  html: (content: string) => beautify.html(content),
  java: (content: string) => content.replace(/(?<=;|})/g, "\n").replace(/\{/, "{\n"),
  ts: (content: string) => beautify.js(content),
  json: (content: string) => JSON.stringify(JSON.parse(content), null, 2),
  xml: (content: string) => beautify.html(content), // Fixed: js-beautify does not have a native .xml function, .html is used to format XML structure nicely.
  yaml: (content: string) => {
    const parsed = yaml.load(content);
    return yaml.dump(parsed, { indent: 2 });
  }
};

export default unminifyStrategies;
