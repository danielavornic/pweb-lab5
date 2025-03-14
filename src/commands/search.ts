import chalk from "chalk";
import readline from "readline";
import { SearchService } from "../services/search.js";
import { displayResponse } from "../utils/display.js";
import { SearchResult } from "../types/search.js";

export const handleSearch = async (searchTerm: string): Promise<void> => {
  console.log(chalk.blue(`Searching for "${searchTerm}"...`));

  const searchService = new SearchService();

  try {
    const results = await searchService.search(searchTerm);

    if (results.length === 0) {
      console.log(chalk.yellow("No results found."));
      return;
    }

    displaySearchResults(results);
    await promptToOpenResult(results, searchService);
  } catch (error) {
    console.error(
      chalk.red("Search error:"),
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};

const displaySearchResults = (results: SearchResult[]): void => {
  console.log(chalk.green(`\nTop ${results.length} results:`));

  results.forEach((result, index) => {
    console.log(chalk.cyan(`\n[${index + 1}] ${result.title}`));
    console.log(chalk.blue(result.url));
    console.log(result.description);
  });
};

const promptToOpenResult = async (
  results: SearchResult[],
  searchService: SearchService
): Promise<void> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const promptUser = () => {
      rl.question(
        chalk.yellow(
          "\nEnter a number to open a result, or press Enter to exit: "
        ),
        async (answer) => {
          if (!answer.trim()) {
            rl.close();
            resolve();
            return;
          }

          const index = parseInt(answer, 10) - 1;
          if (isNaN(index) || index < 0 || index >= results.length) {
            console.log(
              chalk.red(
                `Please enter a number between 1 and ${results.length}.`
              )
            );
            return promptUser();
          }

          await openResult(
            results[index],
            searchService,
            rl,
            () => {
              displaySearchResults(results);
              promptUser();
            },
            resolve
          );
        }
      );
    };

    promptUser();
  });
};

const openResult = async (
  result: SearchResult,
  searchService: SearchService,
  rl: readline.Interface,
  returnToResults: () => void,
  exit: () => void
): Promise<void> => {
  console.log(chalk.blue(`\nFetching ${result.url}...`));

  try {
    const response = await searchService.fetchUrl(result.url);

    if (response.statusCode !== 200) {
      console.log(
        chalk.red(`Request failed with status code ${response.statusCode}`)
      );
      returnToResults();
      return;
    }

    displayResponse(response.body, response.headers["content-type"] || "");

    rl.question(
      chalk.yellow(
        "\nPress Enter to return to search results or 'q' to quit: "
      ),
      (answer) => {
        if (answer.toLowerCase() === "q") {
          rl.close();
          exit();
          return;
        }

        returnToResults();
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    console.log(chalk.red(`Error: ${errorMessage}`));
    returnToResults();
  }
};
