# TaskFlow - Sistema de Gestión de Tareas Colaborativas

## Descripción

TaskFlow es una aplicación web CRUD para gestionar proyectos y tareas colaborativas.
Permite registrar usuarios, crear proyectos, asignar responsables y realizar seguimiento
del trabajo mediante prioridades, estados y fechas límite.

El sistema utiliza Supabase como base de datos online y proveedor de autenticación, y se
encuentra desplegado en Vercel.

## Funcionalidades

- Registro e inicio de sesión sin verificación por correo.
- CRUD completo de proyectos y tareas.
- Asignación de tareas a usuarios registrados.
- Prioridad, estado y fecha límite por tarea.
- Búsqueda y filtros por proyecto, estado y prioridad.
- Dashboard con estadísticas y tareas recientes.
- Roles de usuario: `admin` y `usuario`.
- Interfaz adaptable con mensajes de éxito y error.

## Roles y permisos

### Administrador

- Consulta y administra todos los proyectos y tareas.
- Crea, edita y elimina proyectos y tareas.
- Consulta los usuarios registrados.
- Asigna o retira el rol de administrador.
- No puede quitarse su propio rol para evitar dejar el sistema sin administración.

### Usuario

- Crea y administra sus propios proyectos.
- Crea, edita y elimina tareas de sus proyectos.
- Consulta las tareas que le hayan asignado.
- Asigna tareas a usuarios registrados.
- No puede modificar roles.

La aplicación cumple cinco requisitos de complejidad media-alta: autenticación, relaciones
entre entidades, filtros avanzados, roles de usuario y dashboard.

## Tecnologías

- Frontend: HTML5, CSS3 y JavaScript.
- Backend: Node.js mediante funciones serverless.
- Base de datos: PostgreSQL en Supabase.
- Autenticación: Supabase Auth.
- Despliegue: Vercel.
- Control de versiones: Git y GitHub.

## Modelo de datos

```mermaid
erDiagram
  PROFILES ||--o{ PROJECTS : crea
  PROFILES ||--o{ TASKS : recibe
  PROJECTS ||--o{ TASKS : contiene
  PROFILES {
    uuid id PK
    text name
    text email
    text role
  }
  PROJECTS {
    uuid id PK
    text name
    text description
    uuid owner_id FK
  }
  TASKS {
    uuid id PK
    text title
    text status
    text priority
    date due_date
    uuid project_id FK
    uuid assignee_id FK
  }
```

## Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Abre **SQL Editor**.
3. Copia todo el contenido de `supabase/schema.sql` y ejecútalo.
4. Si las tablas ya existían, vuelve a ejecutar el archivo. La migración añadirá la columna
   `role` sin eliminar los datos.
5. El usuario más antiguo se convierte automáticamente en administrador si todavía no
   existe uno.
6. Copia `.env.example` como `.env` y completa:

```env
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_ANON_KEY=tu_clave_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role
```

`SUPABASE_SERVICE_ROLE_KEY` solo debe configurarse en el servidor. Nunca debe publicarse
ni utilizarse directamente desde el navegador.

## Ejecución local

Requiere Node.js 20 o superior y no necesita instalar dependencias.

```bash
git clone https://github.com/aslhyy/Gestion-Tareas.git
cd Gestion-Tareas
```

Crea el archivo `.env` y ejecuta:

```bash
npm run dev
```

Abre `http://localhost:3000`.

Para validar la sintaxis:

```bash
npm run check
```

## Despliegue

URL pública:

[https://gestion-tareas-mocha.vercel.app](https://gestion-tareas-mocha.vercel.app)

Para desplegar una copia:

1. Importa el repositorio desde Vercel.
2. Configura `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Ejecuta el despliegue.

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registrar un usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/me` | Consultar el perfil autenticado |
| GET | `/api/profiles` | Listar usuarios |
| PUT | `/api/profiles/:id` | Cambiar un rol, solo para administradores |
| GET/POST | `/api/projects` | Listar o crear proyectos |
| PUT/DELETE | `/api/projects/:id` | Editar o eliminar un proyecto |
| GET/POST | `/api/tasks` | Listar, filtrar o crear tareas |
| PUT/DELETE | `/api/tasks/:id` | Editar o eliminar una tarea |

## Capturas de pantalla

### Inicio de sesión

<img width="500" height="300" alt="Inicio de sesión" src="https://github.com/user-attachments/assets/401f1d35-f2f0-4bc5-8d34-c514a552d247" />

### Registro de usuarios

<img width="500" height="300" alt="Registro de usuarios" src="https://github.com/user-attachments/assets/8a74fda3-d681-40c8-896c-1bdc69e9f4fd" />

### Dashboard principal

<img width="500" height="300" alt="Dashboard principal" src="https://github.com/user-attachments/assets/d7bc2027-e117-4fc2-8ccb-917d66113c51" />

### Gestión de proyectos

<img width="500" height="300" alt="Gestión de proyectos" src="https://github.com/user-attachments/assets/39ba08b3-1c42-4511-b020-91416e1c29e3" />

### Gestión de tareas

<img width="500" height="300" alt="Gestión de tareas" src="https://github.com/user-attachments/assets/3fb9b543-03fe-4ed3-8d71-d30652d5c1af" />

### Creación de proyectos

<img width="500" height="300" alt="Creación de proyectos" src="https://github.com/user-attachments/assets/5e108a7a-0be9-4d68-8583-233627e8d822" />

### Creación de tareas

<img width="500" height="300" alt="Creación de tareas" src="https://github.com/user-attachments/assets/0d9c00f6-081d-444e-bf15-0fa504cc3ba2" />

### Filtros de búsqueda

<img width="500" height="300" alt="Filtros de búsqueda" src="https://github.com/user-attachments/assets/a7397cdd-b752-4324-b519-3b0c0d05bca2" />

## Autor

**Aslhy Nicol Casteblanco Jiménez**  
Aprendiz ADSO - SENA
