#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Types matching SDK 1.0.1
interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

// Use dirname properly for ESM
const currentDir = dirname(fileURLToPath(import.meta.url));

// Define the tools directly
const WEATHER_TOOLS: Tool[] = [
  {
    name: "get-metar",
    description: "Retrieves current METAR data for one or more stations",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "string",
          description: "Station ID(s) (e.g., 'KJFK', 'KLAX,KJFK')"
        },
        format: {
          type: "string",
          enum: ["xml", "json"],
          default: "xml",
          description: "Response format"
        },
        hours: {
          type: "integer",
          description: "Number of hours of historical data to retrieve"
        },
        mostRecent: {
          type: "boolean",
          default: true,
          description: "Whether to return only the most recent observation"
        }
      },
      required: ["ids"]
    }
  },
  {
    name: "get-taf",
    description: "Retrieves TAF forecasts for one or more stations",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "string",
          description: "Station ID(s) (e.g., 'KJFK', 'KLAX,KJFK')"
        },
        format: {
          type: "string",
          enum: ["xml", "json"],
          default: "xml",
          description: "Response format"
        },
        hours_before: {
          type: "integer",
          description: "Number of hours of historical data to retrieve"
        }
      },
      required: ["ids"]
    }
  },
  {
    name: "get-pirep",
    description: "Retrieves pilot reports (PIREPs) for a specific region",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["pirep", "airep"],
          default: "pirep",
          description: "Report type"
        },
        bbox: {
          type: "string",
          description: "Geographic bounding box (format: lon1,lat1,lon2,lat2)"
        },
        format: {
          type: "string",
          enum: ["xml", "json"],
          default: "xml",
          description: "Response format"
        }
      }
    }
  },
  {
    name: "get-windtemp",
    description: "Retrieves wind and temperature data for specific altitudes",
    inputSchema: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "Geographic region"
        },
        altitude: {
          type: "string",
          description: "Altitude in feet"
        },
        format: {
          type: "string",
          enum: ["xml", "json"],
          default: "xml",
          description: "Response format"
        }
      },
      required: ["region", "altitude"]
    }
  },
  {
    name: "get-station-info",
    description: "Retrieves information about weather stations",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Station ID"
        },
        bbox: {
          type: "string",
          description: "Bounding box coordinates (format: lon1,lat1,lon2,lat2)"
        },
        format: {
          type: "string",
          enum: ["xml", "json"],
          default: "xml",
          description: "Response format"
        }
      }
    }
  },
  {
    name: "get-airport-info",
    description: "Retrieves information about airports",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Airport ID"
        },
        bbox: {
          type: "string",
          description: "Bounding box coordinates (format: lon1,lat1,lon2,lat2)"
        },
        format: {
          type: "string",
          enum: ["xml", "json"],
          default: "xml",
          description: "Response format"
        }
      }
    }
  },
  {
    name: "get-navaid-info",
    description: "Retrieves information about navigational aids",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Navaid ID"
        },
        bbox: {
          type: "string",
          description: "Bounding box coordinates (format: lon1,lat1,lon2,lat2)"
        },
        format: {
          type: "string",
          enum: ["xml", "json"],
          default: "xml",
          description: "Response format"
        }
      }
    }
  },
  {
    name: "get-fix-info",
    description: "Retrieves information about navigational fixes",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Fix ID"
        },
        bbox: {
          type: "string",
          description: "Bounding box coordinates (format: lon1,lat1,lon2,lat2)"
        },
        format: {
          type: "string",
          enum: ["xml", "json"],
          default: "xml",
          description: "Response format"
        }
      }
    }
  }
];

// Tool handlers
async function handleMetar(ids: string, format?: string, hours?: number, mostRecent?: boolean) {
  const url = new URL("https://aviationweather.gov/api/data/metar");
  url.searchParams.append("ids", ids);
  url.searchParams.append("format", format || "xml");
  
  if (hours !== undefined) {
    url.searchParams.append("hours", hours.toString());
  }
  
  if (mostRecent !== undefined) {
    url.searchParams.append("mostRecent", mostRecent.toString());
  }

  const response = await fetch(url.toString());
  const data = await (format === "json" ? response.json() : response.text());

  return {
    content: [{
      type: "text",
      text: format === "json" ? JSON.stringify(data, null, 2) : data as string
    }],
    isError: false
  };
}

async function handleTaf(ids: string, format?: string, hours_before?: number) {
  const url = new URL("https://aviationweather.gov/api/data/taf");
  url.searchParams.append("ids", ids);
  url.searchParams.append("format", format || "xml");
  
  if (hours_before !== undefined) {
    url.searchParams.append("hours_before", hours_before.toString());
  }

  const response = await fetch(url.toString());
  const data = await (format === "json" ? response.json() : response.text());

  return {
    content: [{
      type: "text",
      text: format === "json" ? JSON.stringify(data, null, 2) : data as string
    }],
    isError: false
  };
}

async function handlePirep(type?: string, bbox?: string, format?: string) {
  const url = new URL("https://aviationweather.gov/api/data/pirep");
  
  if (type) {
    url.searchParams.append("type", type);
  }
  
  if (bbox) {
    url.searchParams.append("bbox", bbox);
  }
  
  url.searchParams.append("format", format || "xml");

  const response = await fetch(url.toString());
  const data = await (format === "json" ? response.json() : response.text());

  return {
    content: [{
      type: "text",
      text: format === "json" ? JSON.stringify(data, null, 2) : data as string
    }],
    isError: false
  };
}

async function handleWindTemp(region: string, altitude: string, format?: string) {
  const url = new URL("https://aviationweather.gov/api/data/windtemp");
  url.searchParams.append("region", region);
  url.searchParams.append("altitude", altitude);
  url.searchParams.append("format", format || "xml");

  const response = await fetch(url.toString());
  const data = await (format === "json" ? response.json() : response.text());

  return {
    content: [{
      type: "text",
      text: format === "json" ? JSON.stringify(data, null, 2) : data as string
    }],
    isError: false
  };
}

async function handleStationInfo(id?: string, bbox?: string, format?: string) {
  const url = new URL("https://aviationweather.gov/api/data/stationinfo");
  
  if (id) {
    url.searchParams.append("id", id);
  }
  
  if (bbox) {
    url.searchParams.append("bbox", bbox);
  }
  
  url.searchParams.append("format", format || "xml");

  const response = await fetch(url.toString());
  const data = await (format === "json" ? response.json() : response.text());

  return {
    content: [{
      type: "text",
      text: format === "json" ? JSON.stringify(data, null, 2) : data as string
    }],
    isError: false
  };
}

async function handleAirportInfo(id?: string, bbox?: string, format?: string) {
  const url = new URL("https://aviationweather.gov/api/data/airport");
  
  if (id) {
    url.searchParams.append("id", id);
  }
  
  if (bbox) {
    url.searchParams.append("bbox", bbox);
  }
  
  url.searchParams.append("format", format || "xml");

  const response = await fetch(url.toString());
  const data = await (format === "json" ? response.json() : response.text());

  return {
    content: [{
      type: "text",
      text: format === "json" ? JSON.stringify(data, null, 2) : data as string
    }],
    isError: false
  };
}

async function handleNavaidInfo(id?: string, bbox?: string, format?: string) {
  const url = new URL("https://aviationweather.gov/api/data/navaid");
  
  if (id) {
    url.searchParams.append("id", id);
  }
  
  if (bbox) {
    url.searchParams.append("bbox", bbox);
  }
  
  url.searchParams.append("format", format || "xml");

  const response = await fetch(url.toString());
  const data = await (format === "json" ? response.json() : response.text());

  return {
    content: [{
      type: "text",
      text: format === "json" ? JSON.stringify(data, null, 2) : data as string
    }],
    isError: false
  };
}

async function handleFixInfo(id?: string, bbox?: string, format?: string) {
  const url = new URL("https://aviationweather.gov/api/data/fix");
  
  if (id) {
    url.searchParams.append("id", id);
  }
  
  if (bbox) {
    url.searchParams.append("bbox", bbox);
  }
  
  url.searchParams.append("format", format || "xml");

  const response = await fetch(url.toString());
  const data = await (format === "json" ? response.json() : response.text());

  return {
    content: [{
      type: "text",
      text: format === "json" ? JSON.stringify(data, null, 2) : data as string
    }],
    isError: false
  };
}

// Server setup
const server = new Server(
  {
    name: "mcp-server/aviation-weather",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: WEATHER_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  try {
    switch (request.params.name) {
      case "get-metar": {
        const { ids, format, hours, mostRecent } = request.params.arguments as {
          ids: string;
          format?: string;
          hours?: number;
          mostRecent?: boolean;
        };
        return await handleMetar(ids, format, hours, mostRecent);
      }

      case "get-taf": {
        const { ids, format, hours_before } = request.params.arguments as {
          ids: string;
          format?: string;
          hours_before?: number;
        };
        return await handleTaf(ids, format, hours_before);
      }

      case "get-pirep": {
        const { type, bbox, format } = request.params.arguments as {
          type?: string;
          bbox?: string;
          format?: string;
        };
        return await handlePirep(type, bbox, format);
      }

      case "get-windtemp": {
        const { region, altitude, format } = request.params.arguments as {
          region: string;
          altitude: string;
          format?: string;
        };
        return await handleWindTemp(region, altitude, format);
      }

      case "get-station-info": {
        const { id, bbox, format } = request.params.arguments as {
          id?: string;
          bbox?: string;
          format?: string;
        };
        return await handleStationInfo(id, bbox, format);
      }

      case "get-airport-info": {
        const { id, bbox, format } = request.params.arguments as {
          id?: string;
          bbox?: string;
          format?: string;
        };
        return await handleAirportInfo(id, bbox, format);
      }

      case "get-navaid-info": {
        const { id, bbox, format } = request.params.arguments as {
          id?: string;
          bbox?: string;
          format?: string;
        };
        return await handleNavaidInfo(id, bbox, format);
      }

      case "get-fix-info": {
        const { id, bbox, format } = request.params.arguments as {
          id?: string;
          bbox?: string;
          format?: string;
        };
        return await handleFixInfo(id, bbox, format);
      }

      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${request.params.name}`
          }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Aviation Weather MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
}); 