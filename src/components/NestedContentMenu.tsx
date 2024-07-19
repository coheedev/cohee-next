// NestedContentMenu.tsx
import React from "react";

interface Chapter {
  chapter_num: string;
  title: string;
  content: string | Chapter[];
}

interface NestedMenuProps {
  chapters: Chapter[];
}

const NestedContentMenu: React.FC<NestedMenuProps> = ({ chapters }) => {
  const renderChapters = (chapters: Chapter[]) => {
    return chapters.map((chapter, index) => {
      const isNested = Array.isArray(chapter.content);

      return (
        <div key={index} className="pl-4 flex-1">
          <div className="font-bold text-sm">
            {chapter.chapter_num}. {chapter.title}
          </div>
          {isNested && (
            <div className="pl-4 text-xs">
              {(chapter.content as Chapter[]).map((subChapter, subIndex) => (
                <div key={subIndex}>
                  <div>
                    {subChapter.chapter_num}. {subChapter.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return <div>{renderChapters(chapters)}</div>;
};

export default NestedContentMenu;
