# Aviation MCP: Model Context Protocol Servers for Aviation Data

Aviation MCP provides a suite of Model Context Protocol (MCP) servers that map to FAA and other aviation APIs, making it easy to integrate real-time aviation data into your LLM-powered workflows. This project is designed for developers who want to connect their LLM clients (such as Cursor, Claude, or others) to authoritative aviation data sources for weather, NOTAMs, charts, aircraft info, and more.

> **⚠️ Disclaimer ⚠️**
> 
> The developer of this code is **not responsible** for the correctness or safety of the APIs providing data, or your flight planning for your particular flight. This applies to both the software and the instructions in [FlightPlanning.md](./FlightPlanning.md), which **do NOT substitute for the expertise of an appropriately licensed pilot**. The pilot in command is solely responsible for the safety of flight and compliance with all relevant regulations.

## Features

- Modular MCP servers for aviation data
- Integrates with FAA, Aviation Weather, and other APIs
- Easy configuration for use with any MCP-compatible LLM client
- Published as an npm package: [`aviation-mcp`](https://www.npmjs.com/package/aviation-mcp)

## Using the MCP Server

Add the aviation-mcp server to your mcp.json like so. Make sure to update the keys to contain valid values (visit https://api.faa.gov/s/ for FAA API client creds, https://api-ninjas.com/ for their API keys) or remove them (and the relevant APIs will be hidden).

Aviation Weather (including lots of geo-referenced data) and Charts do not need any API keys. NOTAMs require an FAA client id/secret.

```json
{
   "mcpServers": {
      "aviation": {
         "command": "npx",
         "args": [
            "-y",
            "aviation-mcp"
         ],
         "env": {
            "API_NINJA_KEY": "<your-key>",
            "FAA_CLIENT_ID": "<your-id>",
            "FAA_CLIENT_SECRET": "<your-secret>"
         }
      }
   }
}
```

### Official Sources

- **weather**: Aviation weather data (METAR, TAF, PIREP, SIGMET, G-AIRMET, etc.)
- **charts**: Sectional, TAC, IFR enroute, and TPP charts
- **notam**: FAA NOTAM API

### 🚧 Broken Sources 🚧

These sources would be helpful, but the integration or API access is not yet working:

- **precipitation**: FAA EIM Weather Proximity API (precipitation data)
- **airports**: FAA airport and runway information

### Not Implemented

- **delays**: The ASWS FAA API provides information about airport delays.

### 🚧🚧 Unofficial Sources 🚧🚧

- **aircraft**: Aircraft data

### 🚧 Missing Sources 🚧

- Procedure routes in a machine-readable format. TODO: Download CIFP data and use something like [arinc424](https://github.com/jack-laverty/arinc424) to transform it into a usable format.
- Airspace data in a machine-readable format. TODO: Download NASR data and use a library to read shapefiles and/or AIXM data.

## Usage

Once configured, your LLM client can connect to the MCP servers and query aviation data as needed. Refer to your client's documentation for details on supplying the `mcp.json` config.

See [FlightPlanning.md](./FlightPlanning.md) for a sample system prompt to be used for flight planning.

For temporal awareness, I recommend combining with [time](https://github.com/modelcontextprotocol/servers/tree/main/src/time).

For EFB management, consider combining with [filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
or [gdrive](https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive).

## API Coverage

For a detailed list of supported APIs, endpoints, and integration status, see [`Sources.md`](./Sources.md).

## License

MIT
