Eventual goal: I want to build a flight planning assistant workflow, where an AI agent can review and present information relevant to flight planning for a pilot. Features might be:
- interactive flight briefing
- advice about route selection, fuel planning/loading, alternates
- warning for mitigations (time, route, aircraft, flight rules) due to weather terrain etc

First step: Build an open-source repo with MCP servers for various aviation services.

I want to build MCP servers for a bunch of official aviation resources. These interactions should be straightforward fetching of data from existing APIs, with minimal input/output transformation, except for converting everything into consistent format(s).

Where feasible, I'd like to do a straightforward https MCP interaction. Where I need transformation, we can write a local script (I'm leaning towards js/node so it's easy for other folks to run in their environment) that calls the API with the appropriate params and does input/output transformation, and use stdio as our MCP transport.

Keys should be provided by the user of the repo, never checked into source control. Each API will likely have a different API key, and a different format (header vs query param etc). Most of these APIs have a "dev" mode as well, so you should consider how the developer (but not individual users) will test this setup in "dev" mode, using dev APIs.

Desired outputs:

- mcp.json file(s) with "tool" definitions for each API (one for all of the resources? or individual files?) (Note: Some users of this repo may only have certain APIs enabled, so we should enable that use case)
- shim scripts for transforming input/output as needed

In the future we might add:

- mcp.json should provide "prompt" suggested for flight planning, with detailed instructions about the information to fetch and review, suggestions how to present, etc
