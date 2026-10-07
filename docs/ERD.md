# Database schema (PostgreSQL)

Source of truth: [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma). Mermaid renders automatically on GitHub.

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    USER ||--o{ REFRESH_TOKEN : has
    USER ||--o{ AUDIT_LOG : performs
    PROJECT ||--o{ TASK : contains

    USER {
        uuid id PK
        string fullName
        string email UK "unique, stored lowercase"
        string passwordHash "bcrypt, never plain text"
        enum role "USER | ADMIN"
        datetime createdAt
    }
    REFRESH_TOKEN {
        uuid id PK
        uuid userId FK "ON DELETE CASCADE"
        string tokenHash UK "SHA-256 of the opaque token"
        datetime expiresAt
        datetime revokedAt "set on logout / rotation"
        datetime createdAt
    }
    PROJECT {
        uuid id PK
        uuid ownerId FK "ON DELETE CASCADE"
        string name
        string description
        enum status "NOT_STARTED | IN_PROGRESS | COMPLETED"
        date startDate
        date endDate
        datetime createdAt
        datetime updatedAt
    }
    TASK {
        uuid id PK
        uuid projectId FK "ON DELETE CASCADE"
        string name
        string description
        enum priority "LOW | MEDIUM | HIGH"
        enum status "PENDING | IN_PROGRESS | COMPLETED"
        date dueDate
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }
    AUDIT_LOG {
        uuid id PK
        uuid userId FK "ON DELETE SET NULL"
        string action "e.g. TASK_COMPLETED"
        string entity "Task | Project | User"
        string entityId
        json meta
        datetime createdAt
    }
```

## Design notes

- **Normalised (3NF):** a task belongs to exactly one project, a project to exactly one owner. Tasks carry **no** `userId`; ownership is derived through `project.ownerId`, so there is a single place where access is decided.
- **Foreign keys with cascades:** deleting a user removes their projects, tasks and refresh tokens; deleting a project removes its tasks. Audit rows are kept (`SET NULL`) so history survives account deletion.
- **Indexes:** `(ownerId, status)`, `(ownerId, name)` for project lists/filters; `(projectId, status)` and `dueDate` for task lists and the dashboard; `(userId, createdAt)` for activity feeds.
- **Enum order:** `TaskPriority` is declared LOW, MEDIUM, HIGH so `ORDER BY priority` sorts correctly.
- **Refresh tokens** are stored only as SHA-256 hashes, so a database leak does not leak usable sessions.
