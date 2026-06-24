const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = {
  token: localStorage.getItem("token"),
  user: null,
  projects: [],
  tasks: [],
  profiles: [],
  authMode: "login",
  activeSection: "dashboard"
};
const labels = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
  admin: "Administrador",
  usuario: "Usuario"
};

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...options.headers
    }
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || "Respuesta inválida del servidor" };
  }
  if (!response.ok) throw new Error(data.error || "No fue posible completar la solicitud");
  return data;
}

function escapeHtml(value = "") {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function toast(message, error = false) {
  const element = $("#toast");
  element.textContent = message;
  element.className = `toast show${error ? " error" : ""}`;
  setTimeout(() => { element.className = "toast"; }, 2600);
}

function empty(message) {
  return `<div class="empty">${message}</div>`;
}

function taskHtml(task) {
  const dueDate = task.due_date
    ? ` · Límite: ${new Date(`${task.due_date}T00:00:00`).toLocaleDateString("es-CO")}`
    : "";
  const assignee = task.profiles?.name ? ` · ${escapeHtml(task.profiles.name)}` : "";
  const actions = task.can_edit === false
    ? ""
    : `<div class="actions"><button class="icon" data-edit-task="${task.id}">Editar</button><button class="icon danger" data-delete-task="${task.id}">Eliminar</button></div>`;
  return `<article class="task"><div><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(task.projects?.name || "")}${assignee}${dueDate}</p></div><div class="badges"><span class="badge ${task.status}">${labels[task.status]}</span><span class="badge ${task.priority}">${labels[task.priority]}</span></div>${actions}</article>`;
}

function fillSelects() {
  const selectedFilter = $("#project-filter").value;
  const projectOptions = state.projects
    .map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`)
    .join("");
  $("#task-project").innerHTML = projectOptions;
  $("#project-filter").innerHTML = `<option value="">Todos los proyectos</option>${projectOptions}`;
  if (state.projects.some((project) => project.id === selectedFilter)) $("#project-filter").value = selectedFilter;
  $("#task-assignee").innerHTML = `<option value="">Sin asignar</option>${state.profiles
    .map((profile) => `<option value="${profile.id}">${escapeHtml(profile.name)} (${escapeHtml(profile.email)})</option>`)
    .join("")}`;
}

function renderUsers() {
  if (state.user?.role !== "admin") return;
  $("#users-list").innerHTML = state.profiles.length
    ? state.profiles.map((profile) => {
        const disabled = profile.id === state.user.id ? "disabled" : "";
        return `<article class="user-row"><div><strong>${escapeHtml(profile.name)}</strong><small>${escapeHtml(profile.email)}</small></div><span class="role-badge">${labels[profile.role] || profile.role}</span><select class="role-select" data-role-user="${profile.id}" ${disabled}><option value="usuario" ${profile.role === "usuario" ? "selected" : ""}>Usuario</option><option value="admin" ${profile.role === "admin" ? "selected" : ""}>Administrador</option></select></article>`;
      }).join("")
    : empty("No hay usuarios registrados.");
}

function render() {
  const counts = {
    total: state.tasks.length,
    enProgreso: state.tasks.filter((task) => task.status === "en_progreso").length,
    completadas: state.tasks.filter((task) => task.status === "completada").length
  };
  $("#stats").innerHTML = [
    ["Proyectos", state.projects.length],
    ["Tareas totales", counts.total],
    ["En progreso", counts.enProgreso],
    ["Completadas", counts.completadas]
  ].map(([name, count]) => `<article class="stat"><small>${name}</small><strong>${count}</strong></article>`).join("");
  $("#recent-tasks").innerHTML = state.tasks.length
    ? state.tasks.slice(0, 5).map(taskHtml).join("")
    : empty("Aún no tienes tareas.");
  $("#all-tasks").innerHTML = state.tasks.length
    ? state.tasks.map(taskHtml).join("")
    : empty("No hay tareas que coincidan con los filtros.");
  $("#project-grid").innerHTML = state.projects.length
    ? state.projects.map((project) => `<article class="project"><div class="project-mark"></div><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description || "Sin descripción")}</p><div class="actions"><button class="icon" data-view-project="${project.id}">Ver tareas</button><button class="icon" data-edit-project="${project.id}">Editar</button><button class="icon danger" data-delete-project="${project.id}">Eliminar</button></div></article>`).join("")
    : empty("Crea tu primer proyecto para comenzar.");
  fillSelects();
  renderUsers();
}

async function loadData(filters = "") {
  [state.projects, state.profiles, state.tasks] = await Promise.all([
    api("/projects"),
    api("/profiles"),
    api(`/tasks${filters}`)
  ]);
  render();
}

function showApp() {
  $("#auth-view").classList.add("hidden");
  $("#app-view").classList.remove("hidden");
  $("#user-name").textContent = state.user.name;
  $("#user-email").textContent = state.user.email;
  $("#user-role").textContent = labels[state.user.role] || state.user.role;
  $("#avatar").textContent = state.user.name[0].toUpperCase();
  $("#users-nav").classList.toggle("hidden", state.user.role !== "admin");
}

async function init() {
  if (!state.token) return;
  try {
    state.user = await api("/me");
    showApp();
    await loadData();
    showSection("dashboard");
  } catch (error) {
    logout(false);
    toast(error.message || "No se pudieron cargar los datos", true);
  }
}

function logout(showMessage = true) {
  state.token = null;
  state.user = null;
  localStorage.removeItem("token");
  $("#app-view").classList.add("hidden");
  $("#auth-view").classList.remove("hidden");
  if (showMessage) toast("Sesión cerrada");
}

function openProject(project = {}) {
  $("#project-form").reset();
  $("#project-id").value = project.id || "";
  $("#project-name").value = project.name || "";
  $("#project-description").value = project.description || "";
  $("#project-modal-title").textContent = project.id ? "Editar proyecto" : "Nuevo proyecto";
  $("#project-dialog").showModal();
}

function openTask(task = {}) {
  if (!state.projects.length) return toast("Primero debes crear un proyecto", true);
  $("#task-form").reset();
  $("#task-id").value = task.id || "";
  $("#task-title").value = task.title || "";
  $("#task-description").value = task.description || "";
  $("#task-project").value = task.project_id || state.projects[0].id;
  $("#task-assignee").value = task.assignee_id || "";
  $("#task-status").value = task.status || "pendiente";
  $("#task-priority").value = task.priority || "media";
  $("#task-due-date").value = task.due_date || "";
  $("#task-modal-title").textContent = task.id ? "Editar tarea" : "Nueva tarea";
  $("#task-dialog").showModal();
}

function updatePrimaryAction(section) {
  const button = $("#primary-action");
  const actions = {
    projects: { label: "+ Nuevo proyecto", type: "project" },
    tasks: { label: "+ Nueva tarea", type: "task" }
  };
  const action = actions[section];
  button.classList.toggle("hidden", !action);
  button.textContent = action?.label || "";
  button.dataset.open = action?.type || "";
}

function showSection(name) {
  if (name === "users" && state.user?.role !== "admin") return;
  state.activeSection = name;
  $$(".section").forEach((element) => element.classList.add("hidden"));
  $(`#${name}-section`).classList.remove("hidden");
  $$(".nav[data-section]").forEach((element) => element.classList.toggle("active", element.dataset.section === name));
  $("#page-title").textContent = {
    dashboard: "Resumen",
    projects: "Proyectos",
    tasks: "Tareas",
    users: "Usuarios"
  }[name];
  updatePrimaryAction(name);
}

$$("[data-auth-tab]").forEach((button) => button.addEventListener("click", () => {
  state.authMode = button.dataset.authTab;
  $$("[data-auth-tab]").forEach((element) => element.classList.toggle("active", element === button));
  $("#name-field").classList.toggle("hidden", state.authMode !== "register");
  $("#auth-form button").textContent = state.authMode === "register" ? "Crear cuenta" : "Ingresar";
}));

$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api(`/auth/${state.authMode}`, {
      method: "POST",
      body: JSON.stringify({
        name: $("#auth-name").value,
        email: $("#auth-email").value,
        password: $("#auth-password").value
      })
    });
    const token = data.access_token || data.session?.access_token;
    if (!token) return toast("No fue posible iniciar sesión automáticamente", true);
    state.token = token;
    localStorage.setItem("token", token);
    await init();
    toast("Bienvenido a TaskFlow");
  } catch (error) {
    toast(error.message, true);
  }
});

$("#project-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = $("#project-id").value;
  try {
    await api(`/projects${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify({ name: $("#project-name").value, description: $("#project-description").value })
    });
    $("#project-dialog").close();
    await loadData();
    toast(`Proyecto ${id ? "actualizado" : "creado"}`);
  } catch (error) {
    toast(error.message, true);
  }
});

$("#task-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = $("#task-id").value;
  const body = {
    title: $("#task-title").value,
    description: $("#task-description").value,
    project_id: $("#task-project").value,
    assignee_id: $("#task-assignee").value,
    status: $("#task-status").value,
    priority: $("#task-priority").value,
    due_date: $("#task-due-date").value
  };
  try {
    await api(`/tasks${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
    $("#task-dialog").close();
    await loadData();
    toast(`Tarea ${id ? "actualizada" : "creada"}`);
  } catch (error) {
    toast(error.message, true);
  }
});

document.addEventListener("change", async (event) => {
  const target = event.target;
  if (!target.dataset.roleUser) return;
  try {
    await api(`/profiles/${target.dataset.roleUser}`, {
      method: "PUT",
      body: JSON.stringify({ role: target.value })
    });
    await loadData();
    toast("Rol actualizado");
  } catch (error) {
    toast(error.message, true);
    await loadData();
  }
});

document.addEventListener("click", async (event) => {
  const target = event.target;
  if (target.matches(".close")) target.closest("dialog").close();
  if (target.dataset.section) showSection(target.dataset.section);
  if (target.dataset.go) showSection(target.dataset.go);
  if (target.dataset.open === "project") openProject();
  if (target.dataset.open === "task") openTask();
  if (target.dataset.editProject) openProject(state.projects.find((project) => project.id === target.dataset.editProject));
  if (target.dataset.editTask) openTask(state.tasks.find((task) => task.id === target.dataset.editTask));
  if (target.dataset.viewProject) {
    showSection("tasks");
    $("#project-filter").value = target.dataset.viewProject;
    await applyFilters();
  }
  if (target.dataset.deleteProject && confirm("Se eliminarán el proyecto y todas sus tareas. ¿Continuar?")) {
    try {
      await api(`/projects/${target.dataset.deleteProject}`, { method: "DELETE" });
      await loadData();
      toast("Proyecto eliminado");
    } catch (error) {
      toast(error.message, true);
    }
  }
  if (target.dataset.deleteTask && confirm("¿Eliminar esta tarea?")) {
    try {
      await api(`/tasks/${target.dataset.deleteTask}`, { method: "DELETE" });
      await loadData();
      toast("Tarea eliminada");
    } catch (error) {
      toast(error.message, true);
    }
  }
});

async function applyFilters() {
  const params = new URLSearchParams();
  [
    ["search", "#search-filter"],
    ["status", "#status-filter"],
    ["priority", "#priority-filter"],
    ["project_id", "#project-filter"]
  ].forEach(([key, selector]) => {
    if ($(selector).value) params.set(key, $(selector).value);
  });
  try {
    state.tasks = await api(`/tasks?${params}`);
    render();
  } catch (error) {
    toast(error.message, true);
  }
}

["#search-filter", "#status-filter", "#priority-filter", "#project-filter"]
  .forEach((selector) => $(selector).addEventListener("input", applyFilters));
$("#logout").addEventListener("click", () => logout());
init();
