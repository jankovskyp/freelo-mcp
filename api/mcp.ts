import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { listProjects, listWorkers, listTasklists, listTasks, createTask } from "../src/freelo.js";

function createServer(email: string, apiKey: string): McpServer {
  const server = new McpServer({ name: "freelo-mcp", version: "1.0.0" });

  server.tool("list_projects", "List all Freelo projects with their IDs", {}, async () => {
    const projects = await listProjects(email, apiKey);
    return { content: [{ type: "text", text: JSON.stringify(projects, null, 2) }] };
  });

  server.tool(
    "list_workers",
    "List all workers/members in a Freelo project",
    { project_id: z.number().describe("Freelo project ID") },
    async ({ project_id }) => {
      const workers = await listWorkers(email, apiKey, project_id);
      return { content: [{ type: "text", text: JSON.stringify(workers, null, 2) }] };
    }
  );

  server.tool(
    "list_tasklists",
    "List all tasklists in a Freelo project",
    { project_id: z.number().describe("Freelo project ID") },
    async ({ project_id }) => {
      const tasklists = await listTasklists(email, apiKey, project_id);
      return { content: [{ type: "text", text: JSON.stringify(tasklists, null, 2) }] };
    }
  );

  server.tool(
    "list_tasks",
    "List all tasks in a specific Freelo tasklist",
    {
      project_id: z.number().describe("Freelo project ID"),
      tasklist_id: z.number().describe("Freelo tasklist ID"),
    },
    async ({ project_id, tasklist_id }) => {
      const tasks = await listTasks(email, apiKey, project_id, tasklist_id);
      return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] };
    }
  );

  server.tool(
    "create_task",
    "Create a new task in Freelo",
    {
      project_id: z.number().describe("Freelo project ID"),
      tasklist_id: z.number().describe("Freelo tasklist ID"),
      name: z.string().describe("Task name"),
      worker_id: z.number().describe("ID of the person assigned to the task"),
      due_date: z.string().describe("Start due date in YYYY-MM-DD format"),
      due_date_end: z.string().describe("End due date in YYYY-MM-DD format"),
      description: z.string().optional().default("").describe("Task description / first comment"),
    },
    async ({ project_id, tasklist_id, name, worker_id, due_date, due_date_end, description }) => {
      const result = await createTask(email, apiKey, project_id, tasklist_id, name, worker_id, due_date, due_date_end, description);
      return { content: [{ type: "text", text: `Task created: ${JSON.stringify(result, null, 2)}` }] };
    }
  );

  return server;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const email = process.env.FREELO_EMAIL;
  const apiKey = process.env.FREELO_API_KEY;

  if (!email || !apiKey) {
    res.status(500).json({ error: "Missing FREELO_EMAIL or FREELO_API_KEY" });
    return;
  }

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createServer(email, apiKey);
  await server.connect(transport);
  await transport.handleRequest(req as any, res as any, req.body);
}
