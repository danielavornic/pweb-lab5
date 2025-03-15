import { HttpClient } from "../http/client.js";
import chalk from "chalk";
import { CacheService } from "../services/cache.js";

export const handleClearCache = (): void => {
  const client = new HttpClient();
  const cacheService = CacheService.getInstance();

  if (cacheService.isEmpty()) {
    console.log(chalk.yellow("No cache to clear"));
  } else {
    client.clearCache();
    console.log(chalk.green("Cache cleared successfully"));
  }
};
