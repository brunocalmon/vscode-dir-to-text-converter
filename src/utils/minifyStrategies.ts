import CleanCSS from "clean-css";
import { minify as htmlMinifier } from "html-minifier-terser";
import yaml from "js-yaml";

const Terser = require("terser") as any;

export interface MinifyStrategies {
  [ext: string]: (content: string) => string | Promise<string>;
}

const minifyStrategies: MinifyStrategies = {
  js: async (content: string) => {
    const result = await Terser.minify(content);
    return result.code || content;
  },
  css: (content: string) => {
    return new CleanCSS({}).minify(content).styles;
  },
  html: async (content: string) => {
    return await htmlMinifier(content, { collapseWhitespace: true, removeComments: true });
  },
  java: (content: string) => {
    return content.replace(/\s+/g, " ");
  },
  ts: async (content: string) => {
    const result = await Terser.minify(content);
    return result.code || content;
  },
  json: (content: string) => {
    return JSON.stringify(JSON.parse(content));
  },
  xml: (content: string) => {
    return content.replace(/\s+/g, " ");
  },
  yaml: (content: string) => {
    const parsed = yaml.load(content);
    return yaml.dump(parsed, { skipInvalid: true });
  }
};

export default minifyStrategies;
