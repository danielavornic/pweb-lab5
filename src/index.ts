#!/usr/bin/env node
// the above line is used to run the script as a node script

import chalk from "chalk";
import { Command } from "commander";
import { handleUrl } from "./commands/url.js";
import { handleClearCache } from "./commands/clear-cache.js";
import { handleSearch } from "./commands/search.js";

const program = new Command();

program
  .name("go2web")
  .description("CLI tool for making HTTP requests for PWeb Lab 5")
  .version("1.0.0");

// Basic options
program
  .option("-u, --url <url>", "make an HTTP request to the given URL")
  .option("-c, --clear-cache", "clear the HTTP cache")
  .option("-h, --help", "show help information");

// Add support for -s flag with variable arguments
program.option("-s, --search <terms...>", "search term using DuckDuckGo");

async function main() {
  try {
    program.parse(process.argv);
    const options = program.opts();

    if (options.clearCache) {
      handleClearCache();
      return;
    }

    if (options.url) {
      await handleUrl(options.url);
      return;
    }

    if (options.search) {
      // Join all search terms into a single string
      const searchTerm = Array.isArray(options.search)
        ? options.search.join(" ")
        : options.search;

      await handleSearch(searchTerm);
      return;
    }

    // If no valid options were provided, show help
    if (!process.argv.slice(2).length) {
      program.help();
    }
  } catch (error) {
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : "An error occurred"
    );
    process.exit(1);
  }
}

main();
