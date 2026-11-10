import "server-only";
import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { academyPool } from "./pool";

export function academyDb(connection: Pool | PoolClient = academyPool()) {
  return async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.map((part, index) => index === 0 ? part : `$${index}${part}`).join("");
    return (await connection.query(text, values)).rows;
  };
}

export async function withCourseLock<T>(courseId: string, change: (sql: ReturnType<typeof academyDb>) => Promise<T>) {
  const connection = await academyPool().connect();
  try {
    await connection.query("BEGIN");
    const locked = await connection.query("SELECT id FROM academy.courses WHERE id = $1 FOR UPDATE", [courseId]);
    if (!locked.rowCount) throw new Error("Unknown academy course");
    const result = await change(academyDb(connection));
    await connection.query("COMMIT");
    return result;
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}

export function invitationHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function listMyCourses(userId: string) {
  return academyDb()`SELECT c.id, c.title FROM academy.courses c
    JOIN academy.enrollments e ON e.course_id = c.id
    WHERE e.user_id = ${userId} ORDER BY c.title, c.id` as Promise<Array<{ id: string; title: string }>>;
}

export async function enrolledCourse(userId: string, courseId: string) {
  const sql = academyDb();
  const [course] = await sql`SELECT c.id, c.title FROM academy.courses c
    JOIN academy.enrollments e ON e.course_id = c.id
    WHERE c.id = ${courseId} AND e.user_id = ${userId}`;
  if (!course) return null;
  const lessons = await sql`SELECT l.id, l.title, l.position FROM academy.lessons l
    JOIN academy.enrollments e ON e.course_id = l.course_id
    WHERE l.course_id = ${courseId} AND e.user_id = ${userId} AND l.published ORDER BY l.position`;
  return { id: String(course.id), title: String(course.title),
    lessons: lessons.map(lesson => ({ id: String(lesson.id), title: String(lesson.title), position: Number(lesson.position) })) };
}

export async function enrolledLesson(userId: string, lessonId: string) {
  const [lesson] = await academyDb()`SELECT l.id, l.title, l.course_id, c.title AS course_title
    FROM academy.lessons l JOIN academy.courses c ON c.id = l.course_id
    JOIN academy.enrollments e ON e.course_id = l.course_id
    WHERE l.id = ${lessonId} AND e.user_id = ${userId} AND l.published`;
  return lesson ? {
    id: String(lesson.id), title: String(lesson.title),
    courseId: String(lesson.course_id), courseTitle: String(lesson.course_title),
  } : null;
}

export async function acceptInvitation(token: string, user: { id: string; email: string }) {
  const hash = invitationHash(token);
  const [invitation] = await academyDb()`SELECT course_id FROM academy.invitations WHERE token_hash = ${hash} AND email = ${user.email}`;
  if (!invitation) return false;

  return withCourseLock(String(invitation.course_id), async sql => {
    const rows = await sql`WITH redeemed AS (
      DELETE FROM academy.invitations
      WHERE token_hash = ${hash} AND email = ${user.email} AND expires_at > now()
      RETURNING course_id
    ), granted AS (
      INSERT INTO academy.enrollments (course_id, user_id, email)
      SELECT course_id, ${user.id}, ${user.email} FROM redeemed ON CONFLICT DO NOTHING
    )
    INSERT INTO academy.audit (actor_id, course_id, event, subject)
    SELECT ${user.id}, course_id, 'accept-invite', ${user.id} FROM redeemed
    RETURNING course_id`;
    return rows.length === 1;
  });
}
