const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = { token: localStorage.getItem("token"), user: null, projects: [], tasks: [], profiles: [], authMode: "login" };
const labels = { pendiente: "Pendiente", en_progreso: "En progreso", completada: "Completada", alta: "Alta", media: "Media", baja: "Baja" };

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No fue posible completar la solicitud");
  return data;
}
function escapeHtml(value = "") { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }
function toast(message, error = false) { const el = $("#toast"); el.textContent = message; el.className = `toast show${error ? " error" : ""}`; setTimeout(() => el.className = "toast", 2600); }
function empty(message) { return `<div class="empty">${message}</div>`; }
function taskHtml(task) {
  const due = task.due_date ? ` · Limite: ${new Date(`${task.due_date}T00:00:00`).toLocaleDateString("es-CO")}` : "";
  const actions = task.can_edit === false ? "" : `<div class="actions"><button class="icon" data-edit-task="${task.id}">Editar</button><button class="icon danger" data-delete-task="${task.id}">Eliminar</button></div>`;
  return `<article class="task"><div><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(task.projects?.name || "")}${task.profiles?.name ? ` · ${escapeHtml(task.profiles.name)}` : ""}${due}</p></div><div class="badges"><span class="badge ${task.status}">${labels[task.status]}</span><span class="badge ${task.priority}">${labels[task.priority]}</span></div>${actions}</article>`;
}
function fillSelects() {
  const options = state.projects.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
  $("#task-project").innerHTML = options;
  $("#project-filter").innerHTML = `<option value="">Todos los proyectos</option>${options}`;
  $("#task-assignee").innerHTML = `<option value="">Sin asignar</option>${state.profiles.map((p) => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.email)})</option>`).join("")}`;
}
function render() {
  const counts = {
    total: state.tasks.length,
    pendiente: state.tasks.filter((t) => t.status === "pendiente").length,
    en_progreso: state.tasks.filter((t) => t.status === "en_progreso").length,
    completada: state.tasks.filter((t) => t.status === "completada").length
  };
  $("#stats").innerHTML = [["Proyectos", state.projects.length], ["Tareas totales", counts.total], ["En progreso", counts.en_progreso], ["Completadas", counts.completada]].map(([name, count]) => `<article class="stat"><small>${name}</small><strong>${count}</strong></article>`).join("");
  $("#recent-tasks").innerHTML = state.tasks.length ? state.tasks.slice(0, 5).map(taskHtml).join("") : empty("Aun no tienes tareas. Crea la primera.");
  $("#all-tasks").innerHTML = state.tasks.length ? state.tasks.map(taskHtml).join("") : empty("No hay tareas que coincidan con los filtros.");
  $("#project-grid").innerHTML = state.projects.length ? state.projects.map((p) => `<article class="project"><div class="project-mark"></div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description || "Sin descripcion")}</p><div class="actions"><button class="icon" data-view-project="${p.id}">Ver tareas</button><button class="icon" data-edit-project="${p.id}">Editar</button><button class="icon danger" data-delete-project="${p.id}">Eliminar</button></div></article>`).join("") : empty("Crea tu primer proyecto para comenzar.");
  fillSelects();
}
async function loadData(filters = "") {
  [state.projects, state.profiles, state.tasks] = await Promise.all([api("/projects"), api("/profiles"), api(`/tasks${filters}`)]);
  render();
}
function showApp() {
  $("#auth-view").classList.add("hidden"); $("#app-view").classList.remove("hidden");
  $("#user-name").textContent = state.user.name; $("#user-email").textContent = state.user.email; $("#avatar").textContent = state.user.name[0].toUpperCase();
}
async function init() {
  if (!state.token) return;
  try { state.user = await api("/me"); showApp(); await loadData(); } catch { logout(false); }
}
function logout(showMessage = true) { state.token = null; localStorage.removeItem("token"); $("#app-view").classList.add("hidden"); $("#auth-view").classList.remove("hidden"); if (showMessage) toast("Sesion cerrada"); }
function openProject(project = {}) {
  $("#project-form").reset(); $("#project-id").value = project.id || ""; $("#project-name").value = project.name || ""; $("#project-description").value = project.description || "";
  $("#project-modal-title").textContent = project.id ? "Editar proyecto" : "Nuevo proyecto"; $("#project-dialog").showModal();
}
function openTask(task = {}) {
  if (!state.projects.length) return toast("Primero debes crear un proyecto", true);
  $("#task-form").reset(); $("#task-id").value = task.id || ""; $("#task-title").value = task.title || ""; $("#task-description").value = task.description || "";
  $("#task-project").value = task.project_id || state.projects[0].id; $("#task-assignee").value = task.assignee_id || ""; $("#task-status").value = task.status || "pendiente"; $("#task-priority").value = task.priority || "media"; $("#task-due-date").value = task.due_date || "";
  $("#task-modal-title").textContent = task.id ? "Editar tarea" : "Nueva tarea"; $("#task-dialog").showModal();
}
function showSection(name) {
  $$(".section").forEach((el) => el.classList.add("hidden")); $(`#${name}-section`).classList.remove("hidden");
  $$(".nav[data-section]").forEach((el) => el.classList.toggle("active", el.dataset.section === name));
  $("#page-title").textContent = ({ dashboard: "Resumen", projects: "Proyectos", tasks: "Tareas" })[name];
}

$$("[data-auth-tab]").forEach((button) => button.addEventListener("click", () => {
  state.authMode = button.dataset.authTab; $$("[data-auth-tab]").forEach((el) => el.classList.toggle("active", el === button));
  $("#name-field").classList.toggle("hidden", state.authMode !== "register"); $("#auth-form button").textContent = state.authMode === "register" ? "Crear cuenta" : "Ingresar";
}));
$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api(`/auth/${state.authMode}`, { method: "POST", body: JSON.stringify({ name: $("#auth-name").value, email: $("#auth-email").value, password: $("#auth-password").value }) });
    const token = data.access_token || data.session?.access_token;
    if (!token) return toast("No fue posible iniciar sesion automaticamente", true);
    state.token = token; localStorage.setItem("token", token); await init(); toast("Bienvenido a TaskFlow");
  } catch (error) { toast(error.message, true); }
});
$("#project-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const id = $("#project-id").value;
  try { await api(`/projects${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify({ name: $("#project-name").value, description: $("#project-description").value }) }); $("#project-dialog").close(); await loadData(); toast(`Proyecto ${id ? "actualizado" : "creado"}`); } catch (error) { toast(error.message, true); }
});
$("#task-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const id = $("#task-id").value;
  const body = { title: $("#task-title").value, description: $("#task-description").value, project_id: $("#task-project").value, assignee_id: $("#task-assignee").value, status: $("#task-status").value, priority: $("#task-priority").value, due_date: $("#task-due-date").value };
  try { await api(`/tasks${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(body) }); $("#task-dialog").close(); await loadData(); toast(`Tarea ${id ? "actualizada" : "creada"}`); } catch (error) { toast(error.message, true); }
});
document.addEventListener("click", async (event) => {
  const target = event.target;
  if (target.matches(".close")) target.closest("dialog").close();
  if (target.dataset.section) showSection(target.dataset.section);
  if (target.dataset.go) showSection(target.dataset.go);
  if (target.dataset.open === "project") openProject();
  if (target.dataset.open === "task" || target.id === "primary-action") openTask();
  if (target.dataset.editProject) openProject(state.projects.find((p) => p.id === target.dataset.editProject));
  if (target.dataset.editTask) openTask(state.tasks.find((t) => t.id === target.dataset.editTask));
  if (target.dataset.viewProject) { showSection("tasks"); $("#project-filter").value = target.dataset.viewProject; await applyFilters(); }
  if (target.dataset.deleteProject && confirm("Se eliminaran el proyecto y todas sus tareas. ¿Continuar?")) { try { await api(`/projects/${target.dataset.deleteProject}`, { method: "DELETE" }); await loadData(); toast("Proyecto eliminado"); } catch (error) { toast(error.message, true); } }
  if (target.dataset.deleteTask && confirm("¿Eliminar esta tarea?")) { try { await api(`/tasks/${target.dataset.deleteTask}`, { method: "DELETE" }); await loadData(); toast("Tarea eliminada"); } catch (error) { toast(error.message, true); } }
});
async function applyFilters() {
  const params = new URLSearchParams();
  [["search", "#search-filter"], ["status", "#status-filter"], ["priority", "#priority-filter"], ["project_id", "#project-filter"]].forEach(([key, selector]) => { if ($(selector).value) params.set(key, $(selector).value); });
  try { state.tasks = await api(`/tasks?${params}`); render(); } catch (error) { toast(error.message, true); }
}
["#search-filter", "#status-filter", "#priority-filter", "#project-filter"].forEach((selector) => $(selector).addEventListener("input", applyFilters));
$("#logout").addEventListener("click", () => logout());
init();
