import { HttpClient } from "../http/client.js";
import chalk from "chalk";
import config from "../config.js";
import { SearchResult } from "../types/search.js";
import { stripHtml } from "../utils/display.js";

export class SearchService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient();
  }

  async search(searchTerm: string): Promise<SearchResult[]> {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodedSearchTerm}`;

    const response = await this.client.request(searchUrl);

    if (response.statusCode !== 200) {
      throw new Error(`Search failed with status code ${response.statusCode}`);
    }

    // remove chunked encoding headers
    const cleanHtml = response.body.replace(
      /^[0-9a-f]+\r\n|\r\n[0-9a-f]+\r\n/gm,
      ""
    );

    return this.parseResults(cleanHtml);
  }

  private parseResults(html: string): SearchResult[] {
    const results: SearchResult[] = [];

    try {
      const resultBlocks = html.match(
        /<div class="result results_links[\s\S]*?<div class="clear"><\/div>\s*<\/div>\s*<\/div>/g
      );

      if (!resultBlocks) {
        return results;
      }

      for (const block of resultBlocks) {
        if (results.length >= config.search.maxResults) break;

        const result = this.extractResultFromBlock(block);
        if (result) {
          results.push(result);
        }
      }
    } catch (error) {
      console.error(chalk.red("Error parsing search results:"), error);
    }

    return results;
  }

  private extractResultFromBlock(block: string): SearchResult | null {
    const titleMatch = block.match(
      /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
    );

    if (!titleMatch) return null;

    const descriptionMatch = block.match(
      /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i
    );

    let url = titleMatch[1];

    // DuckDuckGo's redirect URLs
    if (url.includes("duckduckgo.com/l/?uddg=")) {
      const uddgMatch = url.match(/uddg=([^&]+)/);
      if (uddgMatch && uddgMatch[1]) {
        url = decodeURIComponent(uddgMatch[1]);
      }
    }

    const title = stripHtml(titleMatch[2]);
    const description = descriptionMatch
      ? stripHtml(descriptionMatch[1])
      : "No description available";

    return {
      title,
      url,
      description,
    };
  }

  async fetchUrl(url: string) {
    return this.client.request(url, {
      preferredFormat: config.http.defaultPreferredFormat,
    });
  }
}
