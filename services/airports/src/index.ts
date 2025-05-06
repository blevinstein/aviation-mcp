#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// Types matching SDK 1.0.1
interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

const DEBUG = process.env.DEBUG === 'true';
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.error('[DEBUG]', ...args);
  }
}

const BASE_URL = "https://external-api.faa.gov/adip";

const AIRPORT_TOOLS: Tool[] = [
  {
    name: "get_airport_details",
    description: "Get airport details by airport identifier (locId)",
    inputSchema: {
      type: "object",
      properties: {
        locId: { type: "string", description: "Airport identifier (e.g. SFO)" },
        filter: { type: "string", description: "JSONPath filter expression (optional)" }
      },
      required: ["locId"]
    }
  },
  {
    name: "get_airport_changes_logs",
    description: "Get all airport changes logs between two timestamps (global)",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Timestamp from when to fetch changes (required)" },
        to: { type: "string", description: "Timestamp until when to fetch changes (optional)" }
      },
      required: ["from"]
    }
  },
  {
    name: "get_airport_changes_logs_for_loc",
    description: "Get all airport changes logs for a specific airport (locId)",
    inputSchema: {
      type: "object",
      properties: {
        locId: { type: "string", description: "Airport identifier (e.g. SFO)" },
        from: { type: "string", description: "Timestamp from when to fetch changes (optional)" },
        to: { type: "string", description: "Timestamp until when to fetch changes (optional)" }
      },
      required: ["locId"]
    }
  },
  {
    name: "get_airport_changes_diff",
    description: "Get data differences for an airport between two timestamps",
    inputSchema: {
      type: "object",
      properties: {
        locId: { type: "string", description: "Airport identifier (e.g. SFO)" },
        from: { type: "string", description: "Timestamp from when to fetch differences (required)" },
        to: { type: "string", description: "Timestamp until when to fetch differences (optional)" }
      },
      required: ["locId", "from"]
    }
  },
  {
    name: "list_airports_radius",
    description: "Get list of airports in a radius from a lat/lon point",
    inputSchema: {
      type: "object",
      properties: {
        lat: { type: "number", description: "Latitude (required)" },
        lon: { type: "number", description: "Longitude (required)" },
        radius: { type: "number", description: "Radius (required)" },
        unit: { type: "string", enum: ["KM", "NM", "M", "FT", "MI"], default: "KM", description: "Unit of radius (optional)" },
        filter: { type: "string", description: "JSONPath filter expression (optional)" }
      },
      required: ["lat", "lon", "radius"]
    }
  },
  {
    name: "list_airports_radius_for_loc",
    description: "Get list of airports in a radius from a specific airport (locId)",
    inputSchema: {
      type: "object",
      properties: {
        locId: { type: "string", description: "Airport identifier (e.g. SFO)" },
        radius: { type: "number", description: "Radius (required)" },
        unit: { type: "string", enum: ["KM", "NM", "M", "FT", "MI"], default: "KM", description: "Unit of radius (optional)" },
        filter: { type: "string", description: "JSONPath filter expression (optional)" }
      },
      required: ["locId", "radius"]
    }
  },
  {
    name: "list_airports_bbox",
    description: "Get list of airports in a bounding box from a lat/lon point",
    inputSchema: {
      type: "object",
      properties: {
        lat: { type: "number", description: "Latitude (required)" },
        lon: { type: "number", description: "Longitude (required)" },
        bbox: { type: "string", description: "Bounding box as [width,height] (required)" },
        unit: { type: "string", enum: ["KM", "NM", "M", "FT", "MI"], default: "KM", description: "Unit of bbox (optional)" }
      },
      required: ["lat", "lon", "bbox"]
    }
  },
  {
    name: "list_airports_bbox_for_loc",
    description: "Get list of airports in a bounding box from a specific airport (locId)",
    inputSchema: {
      type: "object",
      properties: {
        locId: { type: "string", description: "Airport identifier (e.g. SFO)" },
        bbox: { type: "string", description: "Bounding box as [width,height] (required)" },
        unit: { type: "string", enum: ["KM", "NM", "M", "FT", "MI"], default: "KM", description: "Unit of bbox (optional)" }
      },
      required: ["locId", "bbox"]
    }
  },
  {
    name: "airport_search",
    description: "Search for airports (POST)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "object", description: "Search object (see API spec)" }
      },
      required: ["search"]
    }
  }
];

function requireAuth() {
  if (!process.env.FAA_CLIENT_ID || !process.env.FAA_CLIENT_SECRET) {
    throw new Error('Client ID and Client Secret are required for ADIP API authentication');
  }
}

async function handleGetAirportDetails(locId, filter) {
  requireAuth();
  const url = new URL(`${BASE_URL}/airport-details/${encodeURIComponent(locId)}`);
  if (filter) url.searchParams.append('filter', filter);
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'client_id': process.env.FAA_CLIENT_ID,
      'client_secret': process.env.FAA_CLIENT_SECRET
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ADIP API Error (${response.status}): ${errorText}`);
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleGetAirportChangesLogs(from, to) {
  requireAuth();
  const url = new URL(`${BASE_URL}/airport-changes/logs`);
  url.searchParams.append('from', from);
  if (to) url.searchParams.append('to', to);
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'client_id': process.env.FAA_CLIENT_ID,
      'client_secret': process.env.FAA_CLIENT_SECRET
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ADIP API Error (${response.status}): ${errorText}`);
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleGetAirportChangesLogsForLoc(locId, from, to) {
  requireAuth();
  const url = new URL(`${BASE_URL}/airport-changes/logs/${encodeURIComponent(locId)}`);
  if (from) url.searchParams.append('from', from);
  if (to) url.searchParams.append('to', to);
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'client_id': process.env.FAA_CLIENT_ID,
      'client_secret': process.env.FAA_CLIENT_SECRET
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ADIP API Error (${response.status}): ${errorText}`);
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleGetAirportChangesDiff(locId, from, to) {
  requireAuth();
  const url = new URL(`${BASE_URL}/airport-changes/diff/${encodeURIComponent(locId)}`);
  url.searchParams.append('from', from);
  if (to) url.searchParams.append('to', to);
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'client_id': process.env.FAA_CLIENT_ID,
      'client_secret': process.env.FAA_CLIENT_SECRET
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ADIP API Error (${response.status}): ${errorText}`);
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleListAirportsRadius(lat, lon, radius, unit, filter) {
  requireAuth();
  const url = new URL(`${BASE_URL}/airport-list/radius`);
  url.searchParams.append('lat', lat);
  url.searchParams.append('lon', lon);
  url.searchParams.append('radius', radius);
  if (unit) url.searchParams.append('unit', unit);
  if (filter) url.searchParams.append('filter', filter);
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'client_id': process.env.FAA_CLIENT_ID,
      'client_secret': process.env.FAA_CLIENT_SECRET
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ADIP API Error (${response.status}): ${errorText}`);
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleListAirportsRadiusForLoc(locId, radius, unit, filter) {
  requireAuth();
  const url = new URL(`${BASE_URL}/airport-list/radius/${encodeURIComponent(locId)}`);
  url.searchParams.append('radius', radius);
  if (unit) url.searchParams.append('unit', unit);
  if (filter) url.searchParams.append('filter', filter);
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'client_id': process.env.FAA_CLIENT_ID,
      'client_secret': process.env.FAA_CLIENT_SECRET
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ADIP API Error (${response.status}): ${errorText}`);
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleListAirportsBBox(lat, lon, bbox, unit) {
  requireAuth();
  const url = new URL(`${BASE_URL}/airport-list/bbox`);
  url.searchParams.append('lat', lat);
  url.searchParams.append('lon', lon);
  url.searchParams.append('bbox', bbox);
  if (unit) url.searchParams.append('unit', unit);
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'client_id': process.env.FAA_CLIENT_ID,
      'client_secret': process.env.FAA_CLIENT_SECRET
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ADIP API Error (${response.status}): ${errorText}`);
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleListAirportsBBoxForLoc(locId, bbox, unit) {
  requireAuth();
  const url = new URL(`${BASE_URL}/airport-list/bbox/${encodeURIComponent(locId)}`);
  url.searchParams.append('bbox', bbox);
  if (unit) url.searchParams.append('unit', unit);
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'client_id': process.env.FAA_CLIENT_ID,
      'client_secret': process.env.FAA_CLIENT_SECRET
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ADIP API Error (${response.status}): ${errorText}`);
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

async function handleAirportSearch(search) {
  requireAuth();
  const url = new URL(`${BASE_URL}/airport-search`);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'client_id': process.env.FAA_CLIENT_ID,
      'client_secret': process.env.FAA_CLIENT_SECRET
    },
    body: JSON.stringify(search)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ADIP API Error (${response.status}): ${errorText}`);
  }
  const data = await response.text();
  return { content: [{ type: "text", text: data }], isError: false };
}

const server = new Server(
  {
    name: "mcp-server/aviation-airports",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  debugLog('Received ListTools request');
  return { tools: AIRPORT_TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  debugLog('Received CallTool request:', { name: request.params.name, args: request.params.arguments });
  try {
    switch (request.params.name) {
      case "get_airport_details": {
        const { locId, filter } = request.params.arguments;
        return await handleGetAirportDetails(locId, filter);
      }
      case "get_airport_changes_logs": {
        const { from, to } = request.params.arguments;
        return await handleGetAirportChangesLogs(from, to);
      }
      case "get_airport_changes_logs_for_loc": {
        const { locId, from, to } = request.params.arguments;
        return await handleGetAirportChangesLogsForLoc(locId, from, to);
      }
      case "get_airport_changes_diff": {
        const { locId, from, to } = request.params.arguments;
        return await handleGetAirportChangesDiff(locId, from, to);
      }
      case "list_airports_radius": {
        const { lat, lon, radius, unit, filter } = request.params.arguments;
        return await handleListAirportsRadius(lat, lon, radius, unit, filter);
      }
      case "list_airports_radius_for_loc": {
        const { locId, radius, unit, filter } = request.params.arguments;
        return await handleListAirportsRadiusForLoc(locId, radius, unit, filter);
      }
      case "list_airports_bbox": {
        const { lat, lon, bbox, unit } = request.params.arguments;
        return await handleListAirportsBBox(lat, lon, bbox, unit);
      }
      case "list_airports_bbox_for_loc": {
        const { locId, bbox, unit } = request.params.arguments;
        return await handleListAirportsBBoxForLoc(locId, bbox, unit);
      }
      case "airport_search": {
        const { search } = request.params.arguments;
        return await handleAirportSearch(search);
      }
      default:
        debugLog('Unknown tool:', request.params.name);
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${request.params.name}`
          }],
          isError: true
        };
    }
  } catch (error) {
    debugLog('Error handling tool call:', error);
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
  console.error("Aviation Airports MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
}); 