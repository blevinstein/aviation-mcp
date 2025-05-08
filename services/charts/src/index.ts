import fetch from "node-fetch";
import { parseStringPromise } from 'xml2js';

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

const STATE_TO_TPP_REGION = {
  WA: ["NW1"],
  OR: ["NW1"],
  ID: ["NW1"],
  MT: ["NW1"],
  WY: ["NW1"],

  CA: ["SW2", "SW3"],
  NV: ["SW4"],
  UT: ["SW4"],
  AZ: ["SW4"],
  CO: ["SW1"],
  NM: ["SW1"],

  TX: ["SC3", "SC2", "SC5"],
  OK: ["SC1"],
  AR: ["SC1"],
  LA: ["SC4"],
  MS: ["SC4"],

  ND: ["NC1"],
  SD: ["NC1"],
  MN: ["NC1"],
  NE: ["NC2"],
  KS: ["NC2"],
  IA: ["NC3"],
  MO: ["NC3"],

  WI: ["EC3"],
  IL: ["EC3"],
  MI: ["EC1"],
  IN: ["EC2"],
  OH: ["EC2"],

  NY: ["NE2"],
  NJ: ["NE2"],
  VA: ["NE3"],
  DC: ["NE3"],
  CT: ["NE1"],
  RI: ["NE1"],
  MA: ["NE1"],
  VT: ["NE1"],
  NH: ["NE1"],
  ME: ["NE1"],
  PA: ["NE4"],
  WV: ["NE4"],

  KY: ["SE1"],
  TN: ["SE1"],
  NC: ["SE2"],
  SC: ["SE2"],
  GA: ["SE4"],
  AL: ["SE4"],
  FL: ["SE3"],
  PR: ["SE3"],
  VI: ["SE3"],

  AK: ["AK"],
};

const SUPPLEMENT_VOLUMES = [
  "NORTHWEST","SOUTHWEST","NORTH CENTRAL","SOUTH CENTRAL","EAST CENTRAL","SOUTHEAST","NORTHEAST","PACIFIC","ALASKA"
];

// Export tools for use by the main server
export const TOOLS: Tool[] = [
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
    name: "get_tpp",
    description: "Retrieves Terminal Procedures Publication (TPP) charts",
    inputSchema: {
      type: "object",
      properties: {
        geoname: {
          type: "string",
          description: "Geographic region (default US, or two-letter state code)"
        },
        edition: {
          type: "string",
          enum: ["current", "next", "changeset"],
          default: "current",
          description: "Edition of the chart"
        }
      },
      required: []
    }
  },
  {
    name: "get_supplement",
    description: "Retrieves Supplement chart download information",
    inputSchema: {
      type: "object",
      properties: {
        edition: {
          type: "string",
          enum: ["current", "next"],
          default: "current",
          description: "Edition of the chart"
        },
        volume: {
          type: "string",
          enum: SUPPLEMENT_VOLUMES,
          description: "Requested volume of Supplement chart set. If omitted, the complete US set is returned."
        }
      }
    }
  },
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

async function handleTPP(geoname = 'US', edition = 'current') {
  checkEnum(edition, ["current", "next", "changeset"], 'edition');
  // Always use US for the API call
  const url = new URL(`${BASE_URL}/dtpp/chart`);
  url.searchParams.append("geoname", "US");
  url.searchParams.append("edition", edition);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return { content: [{ type: "text", text: `Error: ${response.status} ${response.statusText}` }], isError: true };
  }
  const xml = await response.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false });
  // Defensive: handle both single and multiple edition nodes
  const editions = Array.isArray(parsed.productSet.edition) ? parsed.productSet.edition : [parsed.productSet.edition];
  // Find the upload identifier and edition date from the first edition
  const firstEdition = editions[0];
  const productUrl = firstEdition.product.$.url || firstEdition.product.url;
  const match = productUrl.match(/\/([^\/]+)\/terminal\//);
  const uploadId = match ? match[1] : null;
  const editionDate = firstEdition.editionDate;
  // List of all possible regions
  const allRegions = [
    "AK","EC1","EC2","EC3","NC1","NC2","NC3","NE1","NE2","NE3","NE4","NW1",
    "SC1","SC2","SC3","SC4","SC5","SE1","SE2","SE3","SE4","SW1","SW2","SW3","SW4"
  ];
  // Determine which regions to return
  let regions = allRegions;
  if (geoname && geoname !== 'US') {
    const code = geoname.trim().toUpperCase();
    if (STATE_TO_TPP_REGION[code]) {
      regions = STATE_TO_TPP_REGION[code];
    } else {
      return { content: [{ type: "text", text: `Unknown state or region: ${geoname}` }], isError: true };
    }
  }

  // Convert editionDate from MM/DD/YYYY to YYYY-MM-DD
  let editionDateUrl = editionDate;
  if (editionDate && editionDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [mm, dd, yyyy] = editionDate.split('/');
    editionDateUrl = `${yyyy}-${mm}-${dd}`;
  }
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        editionDate: editionDateUrl,
        regions: regions.map(region => ({
          region,
          url: `https://aeronav.faa.gov/${uploadId}/terminal/${editionDateUrl}/${region}.pdf`
        }))
      })
    }],
    isError: false
  };
}

async function handleSupplement(edition = 'current', volume) {
  checkEnum(edition, ["current", "next"], 'edition');
  if (volume) checkEnum(volume, SUPPLEMENT_VOLUMES, 'volume');

  const url = new URL(`${BASE_URL}/supplement/chart`);
  url.searchParams.append("edition", edition);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return { content: [{ type: "text", text: `Error: ${response.status} ${response.statusText}` }], isError: true };
  }
  const xml = await response.text();
  let parsed;
  try {
    parsed = await parseStringPromise(xml, { explicitArray: false });
  } catch (e) {
    return { content: [{ type: "text", text: `Error parsing FAA XML: ${e}` }], isError: true };
  }
  let editionNode = parsed.productSet.edition;
  if (Array.isArray(editionNode)) editionNode = editionNode[0];
  let productNode = editionNode.product;
  if (Array.isArray(productNode)) productNode = productNode[0];
  const urlField = productNode.$?.url || productNode.url;
  // Extract upload ID and edition date
  const uploadMatch = urlField.match(/\/([Uu]pload_[^/]+)\/supplements/);
  const uploadId = uploadMatch ? uploadMatch[1] : null;
  const editionDateRaw = editionNode.editionDate;
  // Convert MM/DD/YYYY to YYYYMMDD
  let editionDate = editionDateRaw;
  if (editionDateRaw && editionDateRaw.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [mm, dd, yyyy] = editionDateRaw.split('/');
    editionDate = `${yyyy}${mm}${dd}`;
  }

  if (!volume || volume === 'US') {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            editionDate,
            region: "US",
            url: `https://aeronav.faa.gov/${uploadId}/supplements/DCS_${editionDate}.zip`,
          })
        }
      ],
      isError: false,
    };
  }

  const VOLUME_TO_CODE = {
    "NORTHWEST": "NW",
    "SOUTHWEST": "SW",
    "NORTH CENTRAL": "NC",
    "SOUTH CENTRAL": "SC",
    "EAST CENTRAL": "EC",
    "SOUTHEAST": "SE",
    "NORTHEAST": "NE",
    "PACIFIC": "PAC",
    "ALASKA": "AK"
  };
  const regionCode = VOLUME_TO_CODE[volume];
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          editionDate,
          region: regionCode,
          url: `https://aeronav.faa.gov/${uploadId}/supplements/CS_${regionCode}_${editionDate}.pdf`,
        })
      }
    ],
    isError: false,
  };
}

// Export unified handler function for the main server
export async function handleToolCall(toolName: string, args: any) {
  try {
    switch (toolName) {
      case "get_sectional": {
        const { geoname, edition, format } = args;
        return await handleSectional(geoname, edition, format);
      }
      case "get_tac": {
        const { geoname, edition, format } = args;
        return await handleTAC(geoname, edition, format);
      }
      case "get_enroute": {
        const { geoname, seriesType, edition, format } = args;
        return await handleEnroute(geoname, seriesType, edition, format);
      }
      case "get_tpp": {
        const { geoname, edition } = args;
        return await handleTPP(geoname, edition);
      }
      case "get_supplement": {
        const { edition, volume } = args;
        return await handleSupplement(edition, volume);
      }
      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${toolName}`
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
}
