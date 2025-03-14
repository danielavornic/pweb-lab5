import { HttpClient } from "../http/client.js";
import chalk from "chalk";
import config from "../config.js";
import { displayResponse } from "../utils/display.js";

export const handleUrl = async (url: string): Promise<void> => {
  console.log(chalk.blue(`Fetching ${url}...`));

  const client = new HttpClient();

  try {
    const response = await client.request(url, {
      preferredFormat: config.http.defaultPreferredFormat,
    });

    if (response.statusCode !== 200) {
      throw new Error(`Request failed with status code ${response.statusCode}`);
    }

    displayResponse(response.body, response.headers["content-type"] || "");
  } catch (error) {
    throw new Error(
      `Failed to fetch URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
