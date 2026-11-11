import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAcademyUser } from "@/lib/academy/auth";
import { validId } from "@/lib/academy/config";
import { enrolledCourse } from "@/lib/academy/db";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: PageProps<"/academy/courses/[course]">) {
  const user = await requireAcademyUser();
  const { course } = await params;
  const content = validId(course) && await enrolledCourse(user.id, course);
  if (!content) notFound();

  return <><p className="academy-kicker">دوره‌های من</p><h1>{content.title}</h1>
    <section className="academy-card"><h2>جلسه‌ها</h2>
      {content.lessons.length ? <ol className="academy-list">{content.lessons.map(lesson => <li key={lesson.id}>
        <Link href={`/academy/lessons/${lesson.id}`} prefetch={false}>{lesson.position.toLocaleString("fa-IR")} · {lesson.title}</Link>
      </li>)}</ol> : <p className="academy-muted">جلسه‌ای منتشر نشده.</p>}
    </section>
  </>;
}
