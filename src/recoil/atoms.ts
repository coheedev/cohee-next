import { atom } from "recoil";
import { thread, chapter, lecture, message } from "@prisma/client";

export const codeState = atom<{ language: string; code: string } | null>({
  key: "codeState",
  default: { language: "html", code: `<h1>Hello World!</h1>` },
});

export const currentContentState = atom<string>({
  key: "currentContentState",
  default: "", // Default value
});

export const coheeThreadState = atom<thread | null>({
  key: "coheeThreadState",
  default: null,
});

export const coheeMessagesState = atom<message[]>({
  key: "coheeMessagesState",
  default: [],
});

export const gptThreadState = atom<thread | null>({
  key: "gptThreadState",
  default: null,
});

export const gptMessagesState = atom<message[]>({
  key: "gptMessagesState",
  default: [],
});

export const lectureState = atom<lecture | null>({
  key: "lectureState",
  default: null,
});

export const chapterState = atom<chapter | null>({
  key: "chapterState",
  default: null,
});
