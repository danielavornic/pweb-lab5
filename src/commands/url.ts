import { HttpClient } from "../http/client.js";
import { convert } from "html-to-text";
import chalk from "chalk";
import config from "../config.js";

export const handleUrl = async (url: string): Promise<void> => {
  console.log(chalk.blue(`Fetching ${url}...`));

  const client = new HttpClient();
  const response = await client.request(url, {
    preferredFormat: config.http.defaultPreferredFormat,
  });

  if (response.statusCode !== 200) {
    throw new Error(`Request failed with status code ${response.statusCode}`);
  }

  const [mediaType] = (response.headers["content-type"] || "").split(";");

  if (mediaType.includes("application/json")) {
    displayJson(response.body);
  } else if (mediaType.includes("text/html")) {
    displayHtml(response.body);
  } else {
    console.log(response.body);
  }
};

const displayJson = (body: string): void => {
  try {
    const parsed = JSON.parse(body);
    console.log(chalk.cyan("JSON Response:"));
    console.log(chalk.yellow(JSON.stringify(parsed, null, 2)));
  } catch (error) {
    console.log(chalk.red("Failed to parse JSON response"));
    console.log(body);
  }
};

const displayHtml = (body: string): void => {
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
