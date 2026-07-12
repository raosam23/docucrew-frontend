"use client";
import "ldrs/react/Waveform.css";

import { Waveform } from "ldrs/react";

type LoadingStateProps = {
  message?: string;
};

const LoadingState = ({ message = "Loading..." }: LoadingStateProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background text-primary">
      <Waveform size={40} stroke={3} color="currentColor" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default LoadingState;
