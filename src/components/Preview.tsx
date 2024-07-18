import React, { useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { codeState } from "@/recoil/atoms";

const Preview: React.FC = () => {
  const code = useRecoilValue(codeState);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewContent, setPreviewContent] = useState("");

  useEffect(() => {
    const worker = new Worker(
      new URL("../../public/previewWorker.ts", import.meta.url),
      { type: "module" }
    );

    if (code) {
      worker.postMessage({ code: code.code, language: code.language });
      worker.onmessage = (event) => {
        setPreviewContent(event.data);
      };
    }

    return () => {
      worker.terminate();
    };
  }, [code]);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = previewContent;
    }
  }, [previewContent]);

  return (
    <iframe
      ref={iframeRef}
      title="Preview"
      style={{ width: "100%", height: "100%", backgroundColor: "white" }}
    />
  );
};

export default Preview;
