"use client";

import { useEffect, useState } from "react";

import { STREAMING_WORDS, THINKING_WORDS } from "@/lib/constants";
import { StreamingPhase } from "@/types";

const wordsForPhase = (phase: StreamingPhase) => {
  if (phase === StreamingPhase.THINKING) return THINKING_WORDS;
  if (phase === StreamingPhase.STREAMING) return STREAMING_WORDS;
  return [];
};

const QueryThinkingWord = ({ phase }: { phase: StreamingPhase }) => {
  const words = wordsForPhase(phase);
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * words.length),
  );

  useEffect(() => {
    const list = wordsForPhase(phase);
    const interval = setInterval(() => {
      setIndex(Math.floor(Math.random() * list.length));
    }, 5000);
    return () => clearInterval(interval);
  }, [phase]);

  return <>{words[index]}</>;
};

export default QueryThinkingWord;
