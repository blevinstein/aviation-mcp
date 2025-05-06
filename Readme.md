# Aviation MCP: Model Context Protocol Servers for Aviation Data

Aviation MCP provides a suite of Model Context Protocol (MCP) servers that map to FAA and other aviation APIs, making it easy to integrate real-time aviation data into your LLM-powered workflows. This project is designed for developers who want to connect their LLM clients (such as Cursor, Claude, or others) to authoritative aviation data sources for weather, NOTAMs, charts, aircraft info, and more.

## Features

- Modular MCP servers for aviation data
- Integrates with FAA, Aviation Weather, and other APIs
- Easy configuration for use with any MCP-compatible LLM client
- Published as an npm package: [`aviation-mcp`](https://www.npmjs.com/package/aviation-mcp)

## Installation

You can use Aviation MCP in two ways:

### 1. Clone the Repository

```sh
git clone https://github.com/your-org/aviation-mcp.git
cd aviation-mcp
```

### 2. Install from npm

```sh
yarn add aviation-mcp
# or
npm install aviation-mcp
```

## Configuration

1. **Copy the example config:**
   
   ```sh
   cp mcp.example.json mcp.json
   ```

2. **Edit `mcp.json`** to insert your API keys and credentials for the services you want to use. See env vars in the file for required fields.

3. **Supply `mcp.json` to your MCP client** (such as Cursor, Claude, or any compatible LLM client) to enable aviation data access.

## Available MCP Servers

The following servers are available (see `.cursor/mcp.json` for details):

- **weather**: Aviation weather data (METAR, TAF, PIREP, SIGMET, G-AIRMET, etc.)
- **charts**: Sectional, TAC, IFR enroute, and TPP charts
- **precipitation**: FAA EIM Weather Proximity API (precipitation data)
- **airports**: FAA airport and runway information
- **notam**: FAA NOTAM API
- **aircraft**: Aircraft data from API Ninjas and other sources

## Usage

Once configured, your LLM client can connect to the MCP servers and query aviation data as needed. Refer to your client's documentation for details on supplying the `mcp.json` config.

## API Coverage

For a detailed list of supported APIs, endpoints, and integration status, see [`Sources.md`](./Sources.md).

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, new features, or documentation improvements.

## License

MIT 