# FAA Charts MCP Integration

This MCP integration provides access to the FAA's Aeronautical Product Release API (APRA), allowing AI assistants to retrieve official aviation charts and publications.

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your FAA API credentials to `.env`:
   ```
   FAA_ADIP_CLIENT_ID=your_client_id_here
   FAA_ADIP_CLIENT_SECRET=your_client_secret_here
   ```

3. The MCP tools will automatically use these credentials for authentication.

## Available Tools

### 1. Get Sectional Chart
Retrieves a VFR Sectional Chart for a specific city.

Example usage in an AI assistant:
```
Get the current sectional chart for New York
```

Parameters:
- `geoname` (required): City name (e.g., 'New York', 'Los Angeles')
- `edition` (optional): Chart edition ('current' or 'next'), defaults to 'current'
- `format` (optional): Chart format ('pdf' or 'tiff'), defaults to 'pdf'

### 2. Get Terminal Area Chart
Retrieves a Terminal Area Chart (TAC) for a specific city.

Example usage in an AI assistant:
```
Get the terminal area chart for Los Angeles
```

Parameters:
- `geoname` (required): City name (e.g., 'Los Angeles', 'New York')
- `edition` (optional): Chart edition ('current' or 'next'), defaults to 'current'
- `format` (optional): Chart format ('pdf' or 'tiff'), defaults to 'pdf'

### 3. Get IFR Enroute Chart
Retrieves an IFR Enroute Chart for a specific region.

Example usage in an AI assistant:
```
Get the low altitude enroute chart for the US
```

Parameters:
- `geoname` (required): Geographic region ('US', 'Alaska', 'Pacific', 'Caribbean')
- `seriesType` (required): Chart series ('low', 'high', 'area')
- `edition` (optional): Chart edition ('current' or 'next'), defaults to 'current'
- `format` (optional): Chart format ('pdf' or 'tiff'), defaults to 'pdf'

## Development

### Testing the API

You can test the API directly using curl:

```bash
# Get a sectional chart
curl -H "client_id: $FAA_ADIP_CLIENT_ID" \
     -H "client_secret: $FAA_ADIP_CLIENT_SECRET" \
     "https://external-api.faa.gov/apra/vfr/sectional/chart?geoname=New%20York&format=pdf"

# Get a terminal area chart
curl -H "client_id: $FAA_ADIP_CLIENT_ID" \
     -H "client_secret: $FAA_ADIP_CLIENT_SECRET" \
     "https://external-api.faa.gov/apra/vfr/tac/chart?geoname=Los%20Angeles&format=pdf"

# Get an IFR enroute chart
curl -H "client_id: $FAA_ADIP_CLIENT_ID" \
     -H "client_secret: $FAA_ADIP_CLIENT_SECRET" \
     "https://external-api.faa.gov/apra/enroute/chart?geoname=US&seriesType=low&format=pdf"
```

### Environment Variables

The integration requires the following environment variables:

| Variable | Description |
|----------|-------------|
| `FAA_ADIP_CLIENT_ID` | Your FAA API client ID |
| `FAA_ADIP_CLIENT_SECRET` | Your FAA API client secret |

These variables are used in the HTTP headers for API authentication.

## Notes

- This service provides access to official FAA aviation charts and publications
- Charts are available in both PDF and TIFF formats (TIFF includes georeferencing)
- Charts are updated on regular cycles (typically 56 days for VFR charts)
- Rate limits and usage restrictions apply as per FAA's terms of service 