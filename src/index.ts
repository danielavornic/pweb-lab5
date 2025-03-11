#!/usr/bin/env node
// the above line is used to run the script as a node script

import chalk from "chalk";
import { Command } from "commander";
import { handleUrl } from "./commands/url.js";

const program = new Command();

program
  .name("go2web")
  .description("CLI tool for making HTTP requests for PWeb Lab 5")
  .version("1.0.0");

program
  .option("-u, --url <url>", "make an HTTP request to the given URL")
  .option("-s, --search <term>", "search term using DuckDuckGo")
  .option("-h, --help", "show help information");

program.parse(process.argv);

const options = program.opts();

async function main() {
  try {
    // TODO: implement the commands
    if (options.url) {
      await handleUrl(options.url);
    } else if (options.search) {
      console.log(chalk.green("Search option selected"));
    } else {
      // builtin help command
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
