import { LectureLayout } from "@/components/LectureLayout";

export default function Page({ params }: { params: { lectureId: string } }) {
  return (
    <main className="flex flex-1 bg-[#F3F7FA]">
      <LectureLayout lectureId={params.lectureId} />
    </main>
  );
}
