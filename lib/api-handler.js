// api-handler.js

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  let body = "";
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text || "Respuesta no valida del servidor" };
  }
}

async function supabase(path, options = {}, useAnon = false) {
  const key = useAnon ? ANON_KEY : SERVICE_KEY;
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers
    }
  });
  const text = await response.text();
  const data = parseJson(text);
  if (!response.ok) {
    const error = new Error(data?.message || data?.msg || data?.error_description || "Error de base de datos");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function currentUser(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) throw Object.assign(new Error("Debes iniciar sesion"), { status: 401 });
  return supabase("/auth/v1/user", { headers: { Authorization: `Bearer ${token}` } }, true);
}

function validateTask(body) {
  if (!body.title || body.title.trim().length < 3) throw Object.assign(new Error("El titulo debe tener minimo 3 caracteres"), { status: 400 });
  if (!["pendiente", "en_progreso", "completada"].includes(body.status)) throw Object.assign(new Error("Estado no valido"), { status: 400 });
  if (!["baja", "media", "alta"].includes(body.priority)) throw Object.assign(new Error("Prioridad no valida"), { status: 400 });
}

async function ownsProject(projectId, userId) {
  const projects = await supabase(`/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&owner_id=eq.${userId}&select=id`);
  return projects.length > 0;
}

async function projectIdForTask(taskId) {
  const tasks = await supabase(`/rest/v1/tasks?id=eq.${encodeURIComponent(taskId)}&select=project_id`);
  return tasks[0]?.project_id;
}

async function handleAuth(req, res, action) {
  const body = await readBody(req);
  if (!["login", "register"].includes(action)) return send(res, 404, { error: "Ruta de autenticacion no encontrada" });
  if (!body.email || !body.password) return send(res, 400, { error: "Correo y contrasena son obligatorios" });
  if (action === "register") {
    await supabase("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { name: body.name?.trim() || body.email.split("@")[0] }
      })
    });
  }
  const data = await supabase("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: body.email, password: body.password })
  }, true);
  return send(res, action === "register" ? 201 : 200, data);
}

async function handleProjects(req, res, user, id) {
  if (req.method === "GET") {
    const data = await supabase(`/rest/v1/projects?owner_id=eq.${user.id}&select=*&order=created_at.desc`);
    return send(res, 200, data);
  }
  if (req.method === "POST") {
    const body = await readBody(req);
    if (!body.name || body.name.trim().length < 3) return send(res, 400, { error: "El nombre debe tener minimo 3 caracteres" });
    const data = await supabase("/rest/v1/projects", { method: "POST", body: JSON.stringify({ name: body.name.trim(), description: body.description?.trim() || "", owner_id: user.id }) });
    return send(res, 201, data[0]);
  }
  if (!id || !(await ownsProject(id, user.id))) return send(res, 404, { error: "Proyecto no encontrado" });
  if (req.method === "PUT") {
    const body = await readBody(req);
    if (!body.name || body.name.trim().length < 3) return send(res, 400, { error: "El nombre debe tener minimo 3 caracteres" });
    const data = await supabase(`/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ name: body.name.trim(), description: body.description?.trim() || "", updated_at: new Date().toISOString() }) });
    return send(res, 200, data[0]);
  }
  if (req.method === "DELETE") {
    await supabase(`/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return send(res, 200, { message: "Proyecto eliminado" });
  }
  return send(res, 405, { error: "Metodo no permitido" });
}

async function handleTasks(req, res, user, id, url) {
  if (req.method === "GET") {
    const projects = await supabase(`/rest/v1/projects?owner_id=eq.${user.id}&select=id`);
    const ownedIds = projects.map((item) => item.id);
    const scope = ownedIds.length
      ? `or=(project_id.in.(${ownedIds.join(",")}),assignee_id.eq.${user.id})`
      : `assignee_id=eq.${user.id}`;
    const filters = [scope];
    for (const key of ["status", "priority", "project_id", "assignee_id"]) {
      const value = url.searchParams.get(key);
      if (value) filters.push(`${key}=eq.${encodeURIComponent(value)}`);
    }
    const search = url.searchParams.get("search");
    if (search) filters.push(`title=ilike.*${encodeURIComponent(search)}*`);
    const data = await supabase(`/rest/v1/tasks?${filters.join("&")}&select=*,projects(name),profiles(name,email)&order=created_at.desc`);
    return send(res, 200, data.map((task) => ({ ...task, can_edit: ownedIds.includes(task.project_id) })));
  }
  if (req.method === "POST") {
    const body = await readBody(req);
    validateTask(body);
    if (!(await ownsProject(body.project_id, user.id))) return send(res, 403, { error: "No puedes agregar tareas a ese proyecto" });
    const data = await supabase("/rest/v1/tasks", { method: "POST", body: JSON.stringify({
      title: body.title.trim(), description: body.description?.trim() || "", status: body.status,
      priority: body.priority, due_date: body.due_date || null, project_id: body.project_id,
      assignee_id: body.assignee_id || null
    }) });
    return send(res, 201, data[0]);
  }
  const projectId = id && await projectIdForTask(id);
  if (!projectId || !(await ownsProject(projectId, user.id))) return send(res, 404, { error: "Tarea no encontrada" });
  if (req.method === "PUT") {
    const body = await readBody(req);
    validateTask(body);
    if (!(await ownsProject(body.project_id, user.id))) return send(res, 403, { error: "Proyecto no permitido" });
    const data = await supabase(`/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({
      title: body.title.trim(), description: body.description?.trim() || "", status: body.status,
      priority: body.priority, due_date: body.due_date || null, project_id: body.project_id,
      assignee_id: body.assignee_id || null, updated_at: new Date().toISOString()
    }) });
    return send(res, 200, data[0]);
  }
  if (req.method === "DELETE") {
    await supabase(`/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return send(res, 200, { message: "Tarea eliminada" });
  }
  return send(res, 405, { error: "Metodo no permitido" });
}

async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
    if (parts[0] === "debug") {
      return send(res, 200, {
        supabaseUrl: Boolean(SUPABASE_URL),
        anonKey: Boolean(ANON_KEY),
        serviceKey: Boolean(SERVICE_KEY)
      });
    }
    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) return send(res, 503, { error: "Configura las variables de Supabase" });
    if (parts[0] === "auth" && req.method === "POST") return handleAuth(req, res, parts[1]);
    const user = await currentUser(req);
    if (parts[0] === "me") return send(res, 200, { id: user.id, email: user.email, name: user.user_metadata?.name || user.email.split("@")[0] });
    if (parts[0] === "profiles" && req.method === "GET") {
      const profiles = await supabase("/rest/v1/profiles?select=id,name,email&order=name");
      return send(res, 200, profiles);
    }
    if (parts[0] === "projects") return handleProjects(req, res, user, parts[1]);
    if (parts[0] === "tasks") return handleTasks(req, res, user, parts[1], url);
    return send(res, 404, { error: "Ruta no encontrada" });
  } catch (error) {
    return send(res, error.status || 500, { error: error.message || "Error inesperado" });
  }
}

module.exports = handler;
