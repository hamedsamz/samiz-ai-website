import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAcademyUser } from "@/lib/academy/auth";
import { validId } from "@/lib/academy/config";
import { enrolledLesson } from "@/lib/academy/db";
import { LessonPlayer } from "./LessonPlayer";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: PageProps<"/academy/lessons/[lesson]">) {
  const user = await requireAcademyUser();
  const { lesson } = await params;
  const content = validId(lesson) && await enrolledLesson(user.id, lesson);
  if (!content) notFound();

  return <><Link href={`/academy/courses/${content.courseId}`} prefetch={false}>{content.courseTitle}</Link>
    <h1>{content.title}</h1>
    <div className="academy-card"><LessonPlayer source={`/api/academy-media/${content.id}/index.m3u8`} /></div>
  </>;
}
