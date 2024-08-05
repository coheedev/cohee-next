import { LectureShowWindow } from "./main-layout";

export default function Page() {
  console.log(process.env.OPENAI_API);
  return (
    <main className="flex flex-1 bg-[#F3F7FA] py-12 px-20">
      <div className="w-full">
        <h2>🎉 오픈된 강의</h2>
        <LectureShowWindow />
      </div>
    </main>
  );
}
