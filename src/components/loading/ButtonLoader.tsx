"use client";

import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

type ButtonLoaderProps = {
  size?: number;
  color?: string;
  speed?: number;
};

const ButtonLoader = ({
  size = 20,
  color = "currentColor",
  speed = 1.5,
}: ButtonLoaderProps) => {
  return <Bouncy size={size} color={color} speed={speed} />;
};

export default ButtonLoader;
