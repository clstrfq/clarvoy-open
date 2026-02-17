import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  charityLookupResultSchema,
  charitySearchResultSchema,
  charityVerificationSchema,
  grantDiscoverResultSchema,
  grantAgenciesResultSchema,
  grantTrendsResultSchema,
  type CharityLookupResult,
  type CharitySearchParams,
  type CharitySearchResult,
  type CharityVerification,
  type GrantDiscoverInput,
  type GrantDiscoverResult,
  type GrantAgenciesInput,
  type GrantAgenciesResult,
  type GrantTrendsInput,
  type GrantTrendsResult,
  type McpStatus,
} from "@shared/mcp-schemas";

// ─── Error Type ──────────────────────────────────────────────────────────────

export class McpToolError extends Error {
  constructor(
    message: string,
    public readonly toolName: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "McpToolError";
  }
}

// ─── Client Singletons ──────────────────────────────────────────────────────

let grantsClient: Client | null = null;
let charityClient: Client | null = null;
let grantsTransport: StdioClientTransport | null = null;
let charityTransport: StdioClientTransport | null = null;

// ─── Connection Management ───────────────────────────────────────────────────

async function connectWithRetry(
  name: string,
  createTransport: () => StdioClientTransport,
  maxRetries: number = 3
): Promise<{ client: Client; transport: StdioClientTransport }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transport = createTransport();
      const client = new Client(
        { name: `clarvoy-${name}`, version: "1.0.0" },
        { capabilities: {} }
      );
      await client.connect(transport);
      console.log(`MCP ${name} client connected (attempt ${attempt})`);
      return { client, transport };
    } catch (error) {
      lastError = error as Error;
      console.error(
        `MCP ${name} connection attempt ${attempt}/${maxRetries} failed:`,
        (error as Error).message
      );
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to connect to MCP ${name} server after ${maxRetries} attempts: ${lastError?.message}`
  );
}

function createGrantsTransport(): StdioClientTransport {
  const transport = process.env.GRANTS_MCP_TRANSPORT || "stdio";

  if (transport === "stdio") {
    const command = process.env.GRANTS_MCP_COMMAND || "python";
    const args = process.env.GRANTS_MCP_ARGS?.split(" ") || [];
    return new StdioClientTransport({
      command,
      args,
      env: {
        ...process.env,
        SIMPLER_GRANTS_API_KEY: process.env.SIMPLER_GRANTS_API_KEY || "",
      } as Record<string, string>,
    });
  }

  // For HTTP transport, we still use stdio as the SDK's primary transport.
  // If a remote HTTP-based MCP server is needed, use SSEClientTransport instead.
  throw new Error(
    `Unsupported grants transport: ${transport}. Use "stdio" or configure HTTP proxy.`
  );
}

function createCharityTransport(): StdioClientTransport {
  const command = process.env.CHARITY_MCP_COMMAND || "node";
  const args = process.env.CHARITY_MCP_ARGS?.split(" ") || [];
  return new StdioClientTransport({
    command,
    args,
    env: {
      ...process.env,
      CHARITY_API_KEY: process.env.CHARITY_API_KEY || "",
    } as Record<string, string>,
  });
}

export async function getGrantsClient(): Promise<Client> {
  if (!grantsClient) {
    const result = await connectWithRetry("grants", createGrantsTransport);
    grantsClient = result.client;
    grantsTransport = result.transport;
  }
  return grantsClient;
}

export async function getCharityClient(): Promise<Client> {
  if (!charityClient) {
    const result = await connectWithRetry("charity", createCharityTransport);
    charityClient = result.client;
    charityTransport = result.transport;
  }
  return charityClient;
}

// ─── Tool Invocation Helpers ─────────────────────────────────────────────────

function extractTextContent(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const content = result.content;
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item.type === "text") {
        return item.text;
      }
    }
  }
  throw new Error("No text content in MCP tool response");
}

function parseToolResult<T>(text: string, toolName: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new McpToolError(
      `Failed to parse ${toolName} response as JSON`,
      toolName
    );
  }
}

// ─── Charity MCP Tool Wrappers ───────────────────────────────────────────────

export async function charityLookup(ein: string): Promise<CharityLookupResult> {
  const toolName = "charity_lookup";
  try {
    const client = await getCharityClient();
    const result = await client.callTool({
      name: toolName,
      arguments: { ein: ein.replace(/-/g, "") },
    });
    const text = extractTextContent(result);
    const parsed = parseToolResult<unknown>(text, toolName);
    return charityLookupResultSchema.parse(parsed);
  } catch (error) {
    if (error instanceof McpToolError) throw error;
    console.error(`MCP tool error (${toolName}):`, error);
    throw new McpToolError(
      `Charity lookup failed for EIN ${ein}`,
      toolName,
      { cause: error }
    );
  }
}

export async function charitySearch(
  params: CharitySearchParams
): Promise<CharitySearchResult> {
  const toolName = "charity_search";
  try {
    const client = await getCharityClient();
    const result = await client.callTool({
      name: toolName,
      arguments: {
        query: params.query,
        ...(params.city && { city: params.city }),
        ...(params.state && { state: params.state }),
        ...(params.limit && { limit: params.limit }),
        ...(params.offset && { offset: params.offset }),
      },
    });
    const text = extractTextContent(result);
    const parsed = parseToolResult<unknown>(text, toolName);
    return charitySearchResultSchema.parse(parsed);
  } catch (error) {
    if (error instanceof McpToolError) throw error;
    console.error(`MCP tool error (${toolName}):`, error);
    throw new McpToolError(`Charity search failed`, toolName, { cause: error });
  }
}

export async function publicCharityCheck(
  ein: string
): Promise<CharityVerification> {
  const toolName = "public_charity_check";
  try {
    const client = await getCharityClient();
    const result = await client.callTool({
      name: toolName,
      arguments: { ein: ein.replace(/-/g, "") },
    });
    const text = extractTextContent(result);
    const parsed = parseToolResult<unknown>(text, toolName);
    return charityVerificationSchema.parse(parsed);
  } catch (error) {
    if (error instanceof McpToolError) throw error;
    console.error(`MCP tool error (${toolName}):`, error);
    throw new McpToolError(
      `Public charity check failed for EIN ${ein}`,
      toolName,
      { cause: error }
    );
  }
}

// ─── Grants MCP Tool Wrappers ────────────────────────────────────────────────

export async function opportunityDiscovery(
  params: GrantDiscoverInput
): Promise<GrantDiscoverResult> {
  const toolName = "opportunity_discovery";
  try {
    const client = await getGrantsClient();
    const result = await client.callTool({
      name: toolName,
      arguments: {
        query: params.query,
        ...(params.filters && { filters: params.filters }),
        ...(params.maxResults && { max_results: params.maxResults }),
        ...(params.page && { page: params.page }),
        ...(params.grantsPerPage && { grants_per_page: params.grantsPerPage }),
      },
    });
    const text = extractTextContent(result);
    const parsed = parseToolResult<unknown>(text, toolName);
    return grantDiscoverResultSchema.parse(parsed);
  } catch (error) {
    if (error instanceof McpToolError) throw error;
    console.error(`MCP tool error (${toolName}):`, error);
    throw new McpToolError(`Grant discovery failed`, toolName, {
      cause: error,
    });
  }
}

export async function agencyLandscape(
  params: GrantAgenciesInput
): Promise<GrantAgenciesResult> {
  const toolName = "agency_landscape";
  try {
    const client = await getGrantsClient();
    const result = await client.callTool({
      name: toolName,
      arguments: {
        ...(params.includeOpportunities !== undefined && {
          include_opportunities: params.includeOpportunities,
        }),
        ...(params.focusAgencies && {
          focus_agencies: params.focusAgencies,
        }),
        ...(params.fundingCategory && {
          funding_category: params.fundingCategory,
        }),
        ...(params.maxAgencies && { max_agencies: params.maxAgencies }),
      },
    });
    const text = extractTextContent(result);
    const parsed = parseToolResult<unknown>(text, toolName);
    return grantAgenciesResultSchema.parse(parsed);
  } catch (error) {
    if (error instanceof McpToolError) throw error;
    console.error(`MCP tool error (${toolName}):`, error);
    throw new McpToolError(`Agency landscape mapping failed`, toolName, {
      cause: error,
    });
  }
}

export async function fundingTrendScanner(
  params: GrantTrendsInput
): Promise<GrantTrendsResult> {
  const toolName = "funding_trend_scanner";
  try {
    const client = await getGrantsClient();
    const result = await client.callTool({
      name: toolName,
      arguments: {
        ...(params.timeWindowDays && {
          time_window_days: params.timeWindowDays,
        }),
        ...(params.categoryFilter && {
          category_filter: params.categoryFilter,
        }),
        ...(params.agencyFilter && { agency_filter: params.agencyFilter }),
        ...(params.minAwardAmount && {
          min_award_amount: params.minAwardAmount,
        }),
        ...(params.includeForecasted !== undefined && {
          include_forecasted: params.includeForecasted,
        }),
      },
    });
    const text = extractTextContent(result);
    const parsed = parseToolResult<unknown>(text, toolName);
    return grantTrendsResultSchema.parse(parsed);
  } catch (error) {
    if (error instanceof McpToolError) throw error;
    console.error(`MCP tool error (${toolName}):`, error);
    throw new McpToolError(`Funding trend scan failed`, toolName, {
      cause: error,
    });
  }
}

// ─── MCP Status ──────────────────────────────────────────────────────────────

export async function getMcpStatus(): Promise<McpStatus> {
  const result: McpStatus = {
    grants: { connected: false, tools: null, error: null },
    charity: { connected: false, tools: null, error: null },
  };

  // Check grants client
  try {
    const client = await getGrantsClient();
    const tools = await client.listTools();
    result.grants = {
      connected: true,
      tools: tools.tools.map((t) => t.name),
      error: null,
    };
  } catch (error) {
    result.grants = {
      connected: false,
      tools: null,
      error: (error as Error).message,
    };
  }

  // Check charity client
  try {
    const client = await getCharityClient();
    const tools = await client.listTools();
    result.charity = {
      connected: true,
      tools: tools.tools.map((t) => t.name),
      error: null,
    };
  } catch (error) {
    result.charity = {
      connected: false,
      tools: null,
      error: (error as Error).message,
    };
  }

  return result;
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

export async function disconnectAll(): Promise<void> {
  const disconnects: Promise<void>[] = [];

  if (grantsTransport) {
    disconnects.push(
      grantsTransport.close().catch((e) => {
        console.error("Error closing grants MCP transport:", e);
      })
    );
    grantsClient = null;
    grantsTransport = null;
  }

  if (charityTransport) {
    disconnects.push(
      charityTransport.close().catch((e) => {
        console.error("Error closing charity MCP transport:", e);
      })
    );
    charityClient = null;
    charityTransport = null;
  }

  await Promise.allSettled(disconnects);
  console.log("All MCP clients disconnected");
}
