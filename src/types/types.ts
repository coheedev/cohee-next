// Define the type for each content item
import {
  message as MessageType,
  chapter as ChapterType,
  thread as ThreadType,
  code,
  lecture as LectureType,
  lecture_info,
} from "@prisma/client";

export interface MessageContent {
  type: string;
  content: string;
}

export interface Message extends MessageType {
  parsedContent: MessageContent[];
}

export interface Chapter extends ChapterType {
  codes: code[];
}

export interface Thread extends ThreadType {
  messages: Message[];
}

export interface Lecture extends LectureType {
  lecture_info_lecture_lecture_infoTolecture_info: lecture_info;
}

export interface Thread extends ThreadType {
  messages: Message[];
}
