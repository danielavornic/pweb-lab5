#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { handleUrl } from "./commands/url.js";
import { handleClearCache } from "./commands/clear-cache.js";
import { handleSearch } from "./commands/search.js";
import { validateArguments } from "./utils/validation.js";

const program = new Command();

program
  .name("go2web")
  .description("CLI tool for making HTTP requests for PWeb Lab 5")
  .version("1.0.0");

program
  .option("-u, --url <url>", "make an HTTP request to the given URL")
  .option("-s, --search <terms...>", "search term using DuckDuckGo")
  .option("-c, --clear-cache", "clear the HTTP cache")
  .helpOption("-h, --help", "show help information");

async function main() {
  try {
    validateArguments(process.argv.slice(2));

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
      const searchTerm = Array.isArray(options.search)
        ? options.search.join(" ")
        : options.search;
      await handleSearch(searchTerm);
      return;
    }

    if (options.help) {
      program.help();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    console.error(chalk.red("Error:"), errorMessage);
    process.exit(1);
  }
}

main();
