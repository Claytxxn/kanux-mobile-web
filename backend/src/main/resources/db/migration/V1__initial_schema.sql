CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SEQUENCE IF NOT EXISTS companies_company_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS tickets_number_seq START 1;

CREATE TABLE IF NOT EXISTS user_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id    UUID NOT NULL UNIQUE,
    display_name    TEXT,
    email           TEXT,
    avatar_url      TEXT,
    phone           TEXT,
    position        TEXT,
    department      TEXT,
    is_super_admin  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    company_number  INTEGER NOT NULL DEFAULT nextval('companies_company_number_seq'),
    created_by      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER','MANAGER','ADMIN')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, user_profile_id)
);

CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, slug)
);

CREATE TABLE IF NOT EXISTS chats (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    is_private      BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    attachments     JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number              TEXT NOT NULL UNIQUE DEFAULT 'T-' || LPAD(nextval('tickets_number_seq')::TEXT, 5, '0'),
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
    creator_profile_id  UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    assignee_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    status              TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','PENDING','RESOLVED','CLOSED')),
    priority            TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW','MEDIUM','HIGH')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ticket_comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_members_company_id      ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_profile_id ON company_members(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id                ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at             ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_company_id              ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status                  ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at              ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id       ON ticket_comments(ticket_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_messages_updated_at
    BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
