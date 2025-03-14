import { HttpClient } from "../http/client.js";
import chalk from "chalk";

export const handleClearCache = (): void => {
  const client = new HttpClient();
  client.clearCache();
  console.log(chalk.green("Cache cleared successfully"));
};
