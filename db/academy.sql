BEGIN;

CREATE SCHEMA IF NOT EXISTS academy;
REVOKE ALL ON SCHEMA academy FROM PUBLIC;

-- Better Auth 1.7 email/password, sessions, OTP and database rate limiting.
CREATE TABLE IF NOT EXISTS academy."user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

CREATE TABLE IF NOT EXISTS academy."session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null REFERENCES academy."user" ("id") on delete cascade);

CREATE TABLE IF NOT EXISTS academy."account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null REFERENCES academy."user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

CREATE TABLE IF NOT EXISTS academy."verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

CREATE TABLE IF NOT EXISTS academy."rateLimit" ("id" text not null primary key, "key" text not null unique, "count" integer not null, "lastRequest" bigint not null);

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON academy."session" ("userId");

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON academy."account" ("userId");

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON academy."verification" ("identifier");

CREATE TABLE IF NOT EXISTS academy.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160)
);

CREATE TABLE IF NOT EXISTS academy.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES academy.courses(id),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  position integer NOT NULL CHECK (position > 0),
  published boolean NOT NULL DEFAULT false,
  UNIQUE (course_id, position)
);

CREATE TABLE IF NOT EXISTS academy.enrollments (
  course_id uuid NOT NULL REFERENCES academy.courses(id),
  user_id text NOT NULL REFERENCES academy."user"(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, user_id)
);

CREATE TABLE IF NOT EXISTS academy.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES academy.courses(id),
  email text NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE (course_id, email)
);

CREATE TABLE IF NOT EXISTS academy.admin_totp (
  user_id text PRIMARY KEY REFERENCES academy."user"(id) ON DELETE CASCADE,
  bucket bigint NOT NULL,
  attempts integer NOT NULL,
  last_step bigint NOT NULL DEFAULT -1
);

CREATE TABLE IF NOT EXISTS academy.admin_sessions (
  user_id text PRIMARY KEY REFERENCES academy."user"(id) ON DELETE CASCADE,
  session_id text NOT NULL REFERENCES academy."session"(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS academy.audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id text NOT NULL,
  course_id uuid NOT NULL REFERENCES academy.courses(id),
  event text NOT NULL CHECK (event IN ('invite', 'cancel-invite', 'accept-invite', 'revoke', 'publish', 'unpublish')),
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
