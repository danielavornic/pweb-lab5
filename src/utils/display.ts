import chalk from "chalk";
import { convert } from "html-to-text";
import config from "../config.js";

export const displayJson = (body: string): void => {
  try {
    const parsed = JSON.parse(body);
    console.log(chalk.cyan("JSON Response:"));
    console.log(chalk.yellow(JSON.stringify(parsed, null, 2)));
  } catch (error) {
    console.log(chalk.red("Failed to parse JSON response"));
    console.log(body);
  }
};

export const displayHtml = (body: string): void => {
  const text = convert(body, {
    wordwrap: config.display.wordWrap,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "script", format: "skip" },
      { selector: "style", format: "skip" },
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
      { selector: "h1", format: "heading" },
      { selector: "h2", format: "heading" },
      { selector: "h3", format: "heading" },
      { selector: "ul", format: "unorderedList" },
      { selector: "ol", format: "orderedList" },
    ],
    formatters: {
      heading: (elem, walk, builder, formatOptions) => {
        builder.openBlock();
        builder.addInline(chalk.bold.cyan(elem.children[0].data));
        builder.closeBlock();
      },
    },
  });

  console.log(chalk.cyan("HTML Response:"));
  console.log(text);
};

export const displayResponse = (body: string, contentType: string): void => {
  const [mediaType] = (contentType || "").split(";");

  if (mediaType.includes("application/json")) {
    displayJson(body);
  } else if (mediaType.includes("text/html")) {
    displayHtml(body);
  } else {
    console.log(body);
  }
};

export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, "").trim();
};
