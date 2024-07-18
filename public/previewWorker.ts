// public/previewWorker.ts
const handleMessage = (event: MessageEvent) => {
  const { code, language } = event.data;

  let result: string;
  try {
    if (language === "html") {
      result = code;
    } else {
      result = "Language not supported.";
    }
  } catch (error) {
    if (error instanceof Error) {
      result = error.message;
    } else {
      result = String(error);
    }
  }

  self.postMessage(result);
};

self.addEventListener("message", handleMessage);
