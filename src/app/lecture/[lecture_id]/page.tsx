import { LectureLayout } from "@/components/LectureLayout";

export default function Page({ params }: { params: { lecture_id: string } }) {
  return (
    <main className="flex flex-1 bg-[#F3F7FA]">
      <LectureLayout lecture_id={params.lecture_id} />
    </main>
  );
}
