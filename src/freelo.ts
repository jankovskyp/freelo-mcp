const BASE_URL = "https://api.freelo.cz/v1";

function authHeader(email: string, apiKey: string): string {
  return "Basic " + Buffer.from(`${email}:${apiKey}`).toString("base64");
}

async function apiGet(email: string, apiKey: string, path: string) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    headers: {
      Authorization: authHeader(email, apiKey),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Freelo API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiPost(email: string, apiKey: string, path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(email, apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Freelo API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function listProjects(email: string, apiKey: string) {
  const data = await apiGet(email, apiKey, "projects");
  const projects = data?.data?.projects ?? data?.projects ?? data ?? [];
  return projects.map((p: any) => ({ id: p.id, name: p.name }));
}

export async function listWorkers(email: string, apiKey: string, projectId: number) {
  const data = await apiGet(email, apiKey, `project/${projectId}/workers`);
  const workers = data?.data?.workers ?? data?.workers ?? data ?? [];
  return workers.map((w: any) => ({
    id: w.id,
    name: `${w.firstname ?? ""} ${w.lastname ?? ""}`.trim(),
    email: w.email,
  }));
}

export async function listTasklists(email: string, apiKey: string, projectId: number) {
  const data = await apiGet(email, apiKey, `project/${projectId}/tasklists`);
  const tasklists = data?.data?.tasklists ?? data?.tasklists ?? data ?? [];
  return tasklists.map((t: any) => ({ id: t.id, name: t.name }));
}

export async function listTasks(email: string, apiKey: string, projectId: number, tasklistId: number) {
  const data = await apiGet(email, apiKey, `project/${projectId}/tasklist/${tasklistId}/tasks`);
  const tasks = data?.data?.tasks ?? data?.tasks ?? data ?? [];
  return tasks.map((t: any) => ({
    id: t.id,
    name: t.name,
    worker: t.worker ? `${t.worker.firstname ?? ""} ${t.worker.lastname ?? ""}`.trim() : null,
    due_date: t.due_date ?? null,
    state: t.state_name ?? null,
  }));
}

export async function createTask(
  email: string,
  apiKey: string,
  projectId: number,
  tasklistId: number,
  name: string,
  workerId: number,
  dueDate: string,
  dueDateEnd: string,
  description: string
) {
  return apiPost(email, apiKey, `project/${projectId}/tasklist/${tasklistId}/tasks`, {
    name,
    due_date: dueDate,
    due_date_end: dueDateEnd,
    worker: workerId,
    comment: { content: description },
  });
}
