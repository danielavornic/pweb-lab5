# go2web CLI Tool

A command-line tool for making HTTP requests and searching the web without using built-in HTTP libraries.

![Demo](./assets/demo.gif)

## Features

- Make HTTP requests to any URL
- Search the web using DuckDuckGo
- View search results and open them directly from the CLI
- HTTP caching mechanism using a file system
- Support for HTTP redirects
- Content negotiation (HTML and JSON)
- Clean, human-readable output

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:

```
git clone https://github.com/danielavornic/pweb-lab5
cd pweb-lab5
```

2. Install dependencies:

```
npm install
```

3. Build the project:

```
npm run build
```

4. Create a global symlink:

```
npm link
```

## Usage

### Making HTTP Requests

To make a request to a specific URL:

```
go2web -u <URL>
```

Example:

```
go2web -u https://www.example.com
```

### Searching the Web

To search the web using DuckDuckGo:

```
go2web -s <search terms>
```

Example:

```
go2web -s typescript tutorial
```

### Clearing the Cache

To clear the HTTP cache:

```
go2web -c
```

### Viewing Help

To view the help information:

```
go2web -h
```
