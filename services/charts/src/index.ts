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
const SECTIONAL_GEONAMES = [
  "Albuquerque","Anchorage","Atlanta","Bethel","Billings","Brownsville","Cape Lisburne","Charlotte","Cheyenne","Chicago","Cincinnati","Cold Bay","Dallas-Ft Worth","Dawson","Denver","Detroit","Dutch Harbor","El Paso","Fairbanks","Great Falls","Green Bay","Halifax","Hawaiian Islands","Houston","Jacksonville","Juneau","Kansas City","Ketchikan","Klamath Falls","Kodiak","Lake Huron","Las Vegas","Los Angeles","McGrath","Memphis","Miami","Montreal","New Orleans","New York","Nome","Omaha","Phoenix","Point Barrow","Salt Lake City","San Antonio","San Francisco","Seattle","Seward","St Louis","Twin Cities","Washington","Western Aleutian Islands","Whitehorse","Wichita"
];
const TAC_GEONAMES = [
  "Anchorage-Fairbanks","Atlanta","Baltimore-Washington","Boston","Charlotte","Chicago","Cincinnati","Cleveland","Dallas-Ft Worth","Denver-Colorado Springs","Detroit","Houston","Kansas City","Las Vegas","Los Angeles","Memphis","Miami","Minneapolis-St Paul","New Orleans","New York","Philadelphia","Phoenix","Pittsburgh","Puerto Rico-VI","St Louis","Salt Lake City","San Diego","San Francisco","Seattle","Tampa-Orlando"
];
const ENROUTE_GEONAMES = ["US","Alaska","Pacific","Caribbean"];
const ENROUTE_SERIES = ["low","high","area"];

const CHARTS_TOOLS = [
  {
    name: "get_sectional",
    description: "Retrieves sectional charts",
    inputSchema: {
      type: "object",
      properties: {
        geoname: {
          type: "string",
          enum: SECTIONAL_GEONAMES,
          description: "City or region name for the chart (e.g., 'New York', 'Chicago')"
        },
        edition: {
          type: "string",
          enum: ["current", "next"],
          default: "current",
          description: "Edition of the chart"
        },
        format: {
          type: "string",
          enum: ["pdf", "tiff"],
          default: "pdf",
          description: "Format of the chart"
        }
      },
      required: ["geoname"]
    }
  },
  {
    name: "get_sectional_info",
    description: "Retrieves sectional chart edition info",
    inputSchema: {
      type: "object",
      properties: {
        geoname: {
          type: "string",
          enum: SECTIONAL_GEONAMES,
          description: "City or region name for the chart (e.g., 'New York', 'Chicago')"
        },
        edition: {
          type: "string",
          enum: ["current", "next"],
          default: "current",
          description: "Edition of the chart"
        }
      },
      required: ["geoname"]
    }
  },
  {
    name: "get_tac",
    description: "Retrieves Terminal Area Charts (TAC)",
    inputSchema: {
      type: "object",
      properties: {
        geoname: {
          type: "string",
          enum: TAC_GEONAMES,
          description: "City or region name for the chart (e.g., 'New York', 'Chicago')"
        },
        edition: {
          type: "string",
          enum: ["current", "next"],
          default: "current",
          description: "Edition of the chart"
        },
        format: {
          type: "string",
          enum: ["pdf", "tiff"],
          default: "pdf",
          description: "Format of the chart"
        }
      },
      required: ["geoname"]
    }
  },
  {
    name: "get_tac_info",
    description: "Retrieves TAC chart edition info",
    inputSchema: {
      type: "object",
      properties: {
        geoname: {
          type: "string",
          enum: TAC_GEONAMES,
          description: "City or region name for the chart (e.g., 'New York', 'Chicago')"
        },
        edition: {
          type: "string",
          enum: ["current", "next"],
          default: "current",
          description: "Edition of the chart"
        }
      },
      required: ["geoname"]
    }
  },
  {
    name: "get_enroute",
    description: "Retrieves IFR Enroute Charts",
    inputSchema: {
      type: "object",
      properties: {
        geoname: {
          type: "string",
          enum: ENROUTE_GEONAMES,
          description: "Geographic region for requested chart"
        },
        seriesType: {
          type: "string",
          enum: ENROUTE_SERIES,
          description: "Type of enroute chart (low altitude, high altitude, or area)"
        },
        edition: {
          type: "string",
          enum: ["current", "next"],
          default: "current",
          description: "Edition of the chart"
        },
        format: {
          type: "string",
          enum: ["pdf", "tiff"],
          default: "pdf",
          description: "Format of the chart"
        }
      },
      required: ["geoname", "seriesType"]
    }
  },
  {
    name: "get_enroute_info",
    description: "Retrieves IFR Enroute chart edition info",
    inputSchema: {
      type: "object",
      properties: {
        edition: {
          type: "string",
          enum: ["current", "next"],
          default: "current",
          description: "Edition of the chart"
        }
      }
    }
  },
  {
    name: "get_tpp",
    description: "Retrieves Terminal Procedures Publication (TPP) charts",
    inputSchema: {
      type: "object",
      properties: {
        icao: {
          type: "string",
          description: "ICAO airport code (e.g., 'KJFK', 'KLAX')"
        },
        geoname: {
          type: "string",
          description: "Geographic region (default US, or state name)"
        },
        edition: {
          type: "string",
          enum: ["current", "next", "changeset"],
          default: "current",
          description: "Edition of the chart"
        },
        format: {
          type: "string",
          enum: ["pdf", "tiff"],
          default: "pdf",
          description: "Format of the chart"
        }
      },
      required: ["icao"]
    }
  },
  {
    name: "get_tpp_info",
    description: "Retrieves TPP chart edition info",
    inputSchema: {
      type: "object",
      properties: {
        geoname: {
          type: "string",
          description: "Geographic region (default US, or state name)"
        },
        edition: {
          type: "string",
          enum: ["current", "next"],
          default: "current",
          description: "Edition of the chart"
        }
      }
    }
  }
];

// Base URL for FAA chart APIs
const BASE_URL = 'https://external-api.faa.gov/apra';

// Tool handlers
function checkEnum(val, allowed, param) {
  if (val && !allowed.includes(val)) {
    throw new Error(`Invalid value for ${param}: ${val}`);
  }
}

async function handleSectional(geoname, edition = 'current', format = 'pdf') {
  checkEnum(geoname, SECTIONAL_GEONAMES, 'geoname');
  checkEnum(format, ["pdf", "tiff"], 'format');
  checkEnum(edition, ["current", "next"], 'edition');
  const url = new URL(`${BASE_URL}/vfr/sectional/chart`);
  url.searchParams.append("geoname", geoname);
  url.searchParams.append("format", format);
  url.searchParams.append("edition", edition);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return { content: [{ type: "text", text: `Error: ${response.status} ${response.statusText}` }], isError: true };
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleSectionalInfo(geoname, edition = 'current') {
  checkEnum(geoname, SECTIONAL_GEONAMES, 'geoname');
  checkEnum(edition, ["current", "next"], 'edition');
  const url = new URL(`${BASE_URL}/vfr/sectional/info`);
  url.searchParams.append("geoname", geoname);
  url.searchParams.append("edition", edition);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return { content: [{ type: "text", text: `Error: ${response.status} ${response.statusText}` }], isError: true };
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleTAC(geoname, edition = 'current', format = 'pdf') {
  checkEnum(geoname, TAC_GEONAMES, 'geoname');
  checkEnum(format, ["pdf", "tiff"], 'format');
  checkEnum(edition, ["current", "next"], 'edition');
  const url = new URL(`${BASE_URL}/vfr/tac/chart`);
  url.searchParams.append("geoname", geoname);
  url.searchParams.append("format", format);
  url.searchParams.append("edition", edition);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return { content: [{ type: "text", text: `Error: ${response.status} ${response.statusText}` }], isError: true };
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleTACInfo(geoname, edition = 'current') {
  checkEnum(geoname, TAC_GEONAMES, 'geoname');
  checkEnum(edition, ["current", "next"], 'edition');
  const url = new URL(`${BASE_URL}/vfr/tac/info`);
  url.searchParams.append("geoname", geoname);
  url.searchParams.append("edition", edition);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return { content: [{ type: "text", text: `Error: ${response.status} ${response.statusText}` }], isError: true };
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleEnroute(geoname, seriesType, edition = 'current', format = 'pdf') {
  checkEnum(geoname, ENROUTE_GEONAMES, 'geoname');
  checkEnum(seriesType, ENROUTE_SERIES, 'seriesType');
  checkEnum(format, ["pdf", "tiff"], 'format');
  checkEnum(edition, ["current", "next"], 'edition');
  const url = new URL(`${BASE_URL}/enroute/chart`);
  url.searchParams.append("geoname", geoname);
  url.searchParams.append("seriesType", seriesType);
  url.searchParams.append("format", format);
  url.searchParams.append("edition", edition);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return { content: [{ type: "text", text: `Error: ${response.status} ${response.statusText}` }], isError: true };
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleEnrouteInfo(edition = 'current') {
  checkEnum(edition, ["current", "next"], 'edition');
  const url = new URL(`${BASE_URL}/enroute/info`);
  url.searchParams.append("edition", edition);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return { content: [{ type: "text", text: `Error: ${response.status} ${response.statusText}` }], isError: true };
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleTPP(icao, geoname = 'US', edition = 'current', format = 'pdf') {
  checkEnum(format, ["pdf", "tiff"], 'format');
  checkEnum(edition, ["current", "next", "changeset"], 'edition');
  const url = new URL(`${BASE_URL}/dtpp/chart`);
  url.searchParams.append("geoname", geoname);
  url.searchParams.append("airport", icao);
  url.searchParams.append("format", format);
  url.searchParams.append("edition", edition);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return { content: [{ type: "text", text: `Error: ${response.status} ${response.statusText}` }], isError: true };
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleTPPInfo(geoname = 'US', edition = 'current') {
  checkEnum(edition, ["current", "next"], 'edition');
  const url = new URL(`${BASE_URL}/dtpp/info`);
  url.searchParams.append("geoname", geoname);
  url.searchParams.append("edition", edition);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return { content: [{ type: "text", text: `Error: ${response.status} ${response.statusText}` }], isError: true };
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
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
      case "get_sectional": {
        const { geoname, edition, format } = request.params.arguments;
        return await handleSectional(geoname, edition, format);
      }
      case "get_sectional_info": {
        const { geoname, edition } = request.params.arguments;
        return await handleSectionalInfo(geoname, edition);
      }
      case "get_tac": {
        const { geoname, edition, format } = request.params.arguments;
        return await handleTAC(geoname, edition, format);
      }
      case "get_tac_info": {
        const { geoname, edition } = request.params.arguments;
        return await handleTACInfo(geoname, edition);
      }
      case "get_enroute": {
        const { geoname, seriesType, edition, format } = request.params.arguments;
        return await handleEnroute(geoname, seriesType, edition, format);
      }
      case "get_enroute_info": {
        const { edition } = request.params.arguments;
        return await handleEnrouteInfo(edition);
      }
      case "get_tpp": {
        const { icao, geoname, edition, format } = request.params.arguments;
        return await handleTPP(icao, geoname, edition, format);
      }
      case "get_tpp_info": {
        const { geoname, edition } = request.params.arguments;
        return await handleTPPInfo(geoname, edition);
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