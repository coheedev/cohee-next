"use client";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

export function MarkdownViewer({ content }: { content: string }) {
  const testMarkdown = `### This ~is not~ strikethrough, but ~~this is~~!
  ## This is a code block:

  # hello

  gogo \`code\` __bold__ **bold** *italic* _italic_ **_bold italic_** ***bold italic*** ~~strikethrough~~
  `;
  return (
    <Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
      {content}
    </Markdown>
  );
}
