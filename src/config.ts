import { ContentFormat } from "./types/http";

export default {
  http: {
    maxRedirects: 5,
    defaultPreferredFormat: "html" as ContentFormat,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  display: {
    wordWrap: 130,
    colorEnabled: true,
  },
  search: {
    engine: "duckduckgo",
    resultsPerPage: 10,
  },
};
