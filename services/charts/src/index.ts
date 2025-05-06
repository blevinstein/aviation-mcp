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

// Define the tools directly
const CHARTS_TOOLS: Tool[] = [
  {
    name: "get-sectional",
    description: "Retrieves sectional charts",
    inputSchema: {
      type: "object",
      properties: {
        geoname: {
          type: "string",
          description: "City or region name for the chart (e.g., 'New York', 'Chicago')"
        },
        format: {
          type: "string",
          enum: ["pdf", "tiff", "xml"],
          default: "pdf",
          description: "Format of the chart"
        }
      },
      required: ["geoname"]
    }
  },
  {
    name: "get-tac",
    description: "Retrieves Terminal Area Charts (TAC)",
    inputSchema: {
      type: "object",
      properties: {
        geoname: {
          type: "string",
          description: "City or region name for the chart (e.g., 'New York', 'Chicago')"
        },
        format: {
          type: "string",
          enum: ["pdf", "tiff", "xml"],
          default: "pdf",
          description: "Format of the chart"
        }
      },
      required: ["geoname"]
    }
  },
  {
    name: "get-enroute",
    description: "Retrieves IFR Enroute Charts",
    inputSchema: {
      type: "object",
      properties: {
        geoname: {
          type: "string",
          description: "City or region name for the chart (e.g., 'New York', 'Chicago')"
        },
        seriesType: {
          type: "string",
          enum: ["low", "high", "area"],
          default: "low",
          description: "Type of enroute chart (low altitude, high altitude, or area)"
        },
        format: {
          type: "string",
          enum: ["pdf", "tiff", "xml"],
          default: "pdf",
          description: "Format of the chart"
        }
      },
      required: ["geoname"]
    }
  },
  {
    name: "get-tpp",
    description: "Retrieves Terminal Procedures Publication (TPP) charts",
    inputSchema: {
      type: "object",
      properties: {
        icao: {
          type: "string",
          description: "ICAO airport code (e.g., 'KJFK', 'KLAX')"
        },
        chartType: {
          type: "string",
          enum: ["IAP", "DP", "STAR", "APD", "ALL"],
          default: "ALL",
          description: "Type of TPP chart to retrieve"
        },
        format: {
          type: "string",
          enum: ["pdf", "tiff", "xml"],
          default: "pdf",
          description: "Format of the chart"
        }
      },
      required: ["icao"]
    }
  }
];

// Base URL for FAA chart APIs
const BASE_URL = 'https://external-api.faa.gov/apra';

// Tool handlers
async function handleSectional(geoname: string, format: string = 'pdf') {
  const url = new URL(`${BASE_URL}/vfr/sectional/chart`);
  url.searchParams.append("geoname", geoname);
  url.searchParams.append("format", format);
  
  const response = await fetch(url.toString());
  const data = await response.text();

  return {
    content: [{
      type: "text",
      text: data
    }],
    isError: false
  };
}

async function handleTAC(geoname: string, format: string = 'pdf') {
  const url = new URL(`${BASE_URL}/vfr/tac/chart`);
  url.searchParams.append("geoname", geoname);
  url.searchParams.append("format", format);
  
  const response = await fetch(url.toString());
  const data = await response.text();

  return {
    content: [{
      type: "text",
      text: data
    }],
    isError: false
  };
}

async function handleEnroute(geoname: string, seriesType: string = 'low', format: string = 'pdf') {
  const url = new URL(`${BASE_URL}/enroute/chart`);
  url.searchParams.append("geoname", geoname);
  url.searchParams.append("seriesType", seriesType);
  url.searchParams.append("format", format);
  
  const response = await fetch(url.toString());
  const data = await response.text();

  return {
    content: [{
      type: "text",
      text: data
    }],
    isError: false
  };
}

async function handleTPP(icao: string, chartType: string = 'ALL', format: string = 'pdf') {
  // TPP uses 'dtpp' in the URL path
  const url = new URL(`${BASE_URL}/dtpp/chart`);
  
  // For TPP, we need to pass geoname instead of icao to match the API
  url.searchParams.append("geoname", "US");  // Use US as default region
  url.searchParams.append("airport", icao);  // Add the ICAO airport code
  if (chartType && chartType !== 'ALL') {
    url.searchParams.append("chartType", chartType);
  }
  url.searchParams.append("format", format);
  
  const response = await fetch(url.toString());
  const data = await response.text();

  return {
    content: [{
      type: "text",
      text: data
    }],
    isError: false
  };
}

// Server setup
const server = new Server(
  {
    name: "mcp-server/aviation-charts",
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
  tools: CHARTS_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  try {
    switch (request.params.name) {
      case "get-sectional": {
        const { geoname, format } = request.params.arguments as {
          geoname: string;
          format?: string;
        };
        return await handleSectional(geoname, format);
      }

      case "get-tac": {
        const { geoname, format } = request.params.arguments as {
          geoname: string;
          format?: string;
        };
        return await handleTAC(geoname, format);
      }

      case "get-enroute": {
        const { geoname, seriesType, format } = request.params.arguments as {
          geoname: string;
          seriesType?: string;
          format?: string;
        };
        return await handleEnroute(geoname, seriesType, format);
      }

      case "get-tpp": {
        const { icao, chartType, format } = request.params.arguments as {
          icao: string;
          chartType?: string;
          format?: string;
        };
        return await handleTPP(icao, chartType, format);
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
  console.error("Aviation Charts MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
}); 