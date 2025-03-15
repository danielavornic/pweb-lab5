import chalk from "chalk";

export const validateArguments = (args: string[]): void => {
  const validOptions = [
    "-u",
    "--url",
    "-s",
    "--search",
    "-c",
    "--clear-cache",
    "-h",
    "--help",
    "-V",
    "--version",
  ];

  for (const arg of args) {
    if (arg.startsWith("-") && !validOptions.includes(arg)) {
      console.error(chalk.red(`Error: Invalid option '${arg}'.`));
      console.error(`Valid options are ${validOptions.join(", ")}.`);
      process.exit(1);
    }
  }
};
