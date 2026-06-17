# TaskFlow - Sistema de Gestión de Tareas Colaborativas

## Descripción del proyecto

TaskFlow es una aplicación web desarrollada para la gestión de proyectos y tareas colaborativas. Permite a los usuarios registrarse, iniciar sesión, crear proyectos, administrar tareas y realizar seguimiento del estado de cada actividad mediante una interfaz moderna y fácil de usar.

El sistema implementa operaciones CRUD completas sobre una base de datos en la nube utilizando Supabase y se encuentra desplegado en Vercel.

---

# Tecnologías utilizadas

## Frontend
- HTML5
- CSS3
- JavaScript (Vanilla JS)

## Backend
- Node.js
- API Serverless (Vercel Functions)

## Base de datos
- Supabase (PostgreSQL)

## Autenticación
- Supabase Authentication

## Despliegue
- Vercel

## Control de versiones
- Git
- GitHub

---

# Funcionalidades

## Gestión de usuarios
- Registro de usuarios
- Inicio de sesión
- Autenticación mediante Supabase

## Gestión de proyectos (CRUD)
- Crear proyectos
- Consultar proyectos
- Editar proyectos
- Eliminar proyectos

## Gestión de tareas (CRUD)
- Crear tareas
- Consultar tareas
- Editar tareas
- Eliminar tareas
- Asignar tareas a usuarios
- Definir prioridad
- Definir estado
- Definir fecha límite

## Dashboard
- Conteo de proyectos
- Conteo de tareas
- Conteo de tareas completadas
- Conteo de tareas en progreso

## Búsqueda y filtros
- Buscar tareas por nombre
- Filtrar por estado
- Filtrar por prioridad
- Filtrar por proyecto

---

# Modelo de base de datos

El sistema está compuesto por las siguientes entidades:

## Profiles
- id
- name
- email
- created_at

## Projects
- id
- name
- description
- owner_id
- created_at
- updated_at

## Tasks
- id
- title
- description
- status
- priority
- due_date
- project_id
- assignee_id
- created_at
- updated_at

Relaciones:

- Un usuario puede tener muchos proyectos.
- Un proyecto puede contener muchas tareas.
- Una tarea puede estar asignada a un usuario.

---

# Instalación

1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/TU-REPOSITORIO.git
```

2. Entrar al proyecto

```bash
cd TU-REPOSITORIO
```

3. Configurar las variables de entorno

```env
SUPABASE_URL=TU_SUPABASE_URL
SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SUPABASE_SERVICE_ROLE_KEY
```

4. Ejecutar el proyecto

```bash
npm install
npm run dev
```

---

# URL del sistema desplegado

```
https://gestion-tareas-mocha.vercel.app
```

---

# Capturas de pantalla

- Pantalla de inicio de sesión
  <br><br>
  <img width="500" height="300" alt="image" src="https://github.com/user-attachments/assets/401f1d35-f2f0-4bc5-8d34-c514a552d247" />
<br><br>
- Registro de usuarios
  <br><br>
  <img width="500" height="300" alt="image" src="https://github.com/user-attachments/assets/8a74fda3-d681-40c8-896c-1bdc69e9f4fd" />
<br><br>
- Dashboard principal
  <br><br>
  <img width="500" height="300" alt="image" src="https://github.com/user-attachments/assets/d7bc2027-e117-4fc2-8ccb-917d66113c51" />
<br><br>
- Gestión de proyectos
  <br><br>
  <img width="500" height="300" alt="image" src="https://github.com/user-attachments/assets/39ba08b3-1c42-4511-b020-91416e1c29e3" />
  <br><br>
- Gestión de tareas
  <br><br>
  <img width="500" height="300" alt="image" src="https://github.com/user-attachments/assets/3fb9b543-03fe-4ed3-8d71-d30652d5c1af" />
<br><br>
- Creación de proyectos
  <br><br>
  <img width="500" height="300" alt="image" src="https://github.com/user-attachments/assets/5e108a7a-0be9-4d68-8583-233627e8d822" />
<br><br>
- Creación de tareas
  <br><br>
  <img width="500" height="300" alt="image" src="https://github.com/user-attachments/assets/0d9c00f6-081d-444e-bf15-0fa504cc3ba2" />
  <br><br>
- Filtros de búsqueda
  <br><br>
  <img width="500" height="300" alt="image" src="https://github.com/user-attachments/assets/a7397cdd-b752-4324-b519-3b0c0d05bca2" />

# Requisitos implementados

- CRUD completo de proyectos
- CRUD completo de tareas
- Base de datos en la nube (Supabase)
- Autenticación de usuarios
- Relaciones entre entidades
- Dashboard con estadísticas
- Búsqueda de tareas
- Filtros por estado, prioridad y proyecto
- Validaciones en formularios
- Despliegue en Vercel

---

# Autor

**Aslhy Nicol Casteblanco Jiménez**  
Aprendiz ADSO - SENA
