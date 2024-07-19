import { atom } from "recoil";
import { lecture } from "@prisma/client";
import { Message, Chapter, Thread, Lecture } from "@/types/types";

export const codeState = atom<{ language: string; code: string } | null>({
  key: "codeState",
  default: { language: "html", code: `<h1>Hello World!</h1>` },
});

export const currentContentState = atom<string>({
  key: "currentContentState",
  default: "", // Default value
});

// export const coheeThreadState = atom<thread | null>({
//   key: "coheeThreadState",
//   default: null,
// });

export const coheeMessagesState = atom<Message[]>({
  key: "coheeMessagesState",
  default: [],
});

// export const gptThreadState = atom<thread | null>({
//   key: "gptThreadState",
//   default: null,
// });

export const gptMessagesState = atom<Message[]>({
  key: "gptMessagesState",
  default: [],
});

export const lectureState = atom<Lecture | null>({
  key: "lectureState",
  default: null,
});

export const chapterState = atom<Chapter[]>({
  key: "chapterState",
  default: [],
});

export const currentChapterState = atom<Chapter | null>({
  key: "currentChapterState",
  default: null,
});

export const gptThreadsState = atom<Thread[]>({
  key: "gptThreadsState",
  default: [],
});

export const coheeThreadsState = atom<Thread[]>({
  key: "coheeThreadsState",
  default: [],
});

export const currentChapterNumState = atom<string>({
  key: "currentChapterNumState",
  default: "0",
});
