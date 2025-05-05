# FAA Airport Information Service MCP Integration

This MCP integration provides access to the FAA's Airport Information API (ADIP), allowing AI assistants to query detailed airport information including runways, facilities, status, and location data.

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your FAA ADIP API credentials to `.env`:
   ```
   FAA_ADIP_CLIENT_ID=your_client_id_here
   FAA_ADIP_CLIENT_SECRET=your_client_secret_here
   ```

3. The MCP tools will automatically use these credentials for authentication.

## Available Tools

### 1. Get Airport Details
Retrieves detailed information about a specific airport using its ICAO or IATA code.

Example usage in an AI assistant:
```
Get information about JFK airport
```

Parameters:
- `airport_code` (required): ICAO or IATA code (e.g., 'KJFK' or 'JFK')
- `filter` (optional): JSONPath expression to filter the response data

### 2. Search Airports by Radius
Finds airports within a specified radius of a geographic point.

Example usage in an AI assistant:
```
Find airports within 50 nautical miles of JFK
```

Parameters:
- `lat` (required): Center point latitude
- `lon` (required): Center point longitude
- `radius` (required): Search radius distance
- `unit` (optional): Distance unit (KM, NM, M, FT, MI), defaults to KM
- `filter` (optional): JSONPath expression to filter the results

## Development

### Testing the API

You can test the API directly using curl:

```bash
# Get airport details
curl -H "client_id: $FAA_ADIP_CLIENT_ID" \
     -H "client_secret: $FAA_ADIP_CLIENT_SECRET" \
     https://external-api.faa.gov/adip/airport-details/KJFK

# Search by radius
curl -H "client_id: $FAA_ADIP_CLIENT_ID" \
     -H "client_secret: $FAA_ADIP_CLIENT_SECRET" \
     "https://external-api.faa.gov/adip/airport-list/radius?lat=40.6413&lon=-73.7781&radius=50&unit=KM"
```

### Environment Variables

The integration requires the following environment variables:

| Variable | Description |
|----------|-------------|
| `FAA_ADIP_CLIENT_ID` | Your FAA ADIP API client ID |
| `FAA_ADIP_CLIENT_SECRET` | Your FAA ADIP API client secret |

These variables are used in the HTTP headers for API authentication.

## Notes

- This is a read-only service providing static airport information
- All data is sourced from the FAA's official ADIP API
- Rate limits and usage restrictions apply as per FAA's terms of service
- Optional JSONPath filters can be applied to customize the response data 