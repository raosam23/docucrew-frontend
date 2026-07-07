"use client";

import { useEffect, useState } from "react";
import { THINKING_WORDS } from "@/lib/constants";

const QueryThinkingWord = () => {
  const [thinkingIndex, setThinkingIndex] = useState<number>(() =>
    Math.floor(Math.random() * THINKING_WORDS.length),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setThinkingIndex(Math.floor(Math.random() * THINKING_WORDS.length));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return <>{THINKING_WORDS[thinkingIndex]}</>;
};

export default QueryThinkingWord;
