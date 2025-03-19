'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface LogoProps {
  size?: "default" | "tiny" | "large" | "superlarge";
  className?: string;
}



const Logo: React.FC<LogoProps> = ({ size = "default", className = "" }) => {
  let sizeClass = "text-4xl"; // default size
  if (size === "tiny") {
    sizeClass = "text-sm";
  } else if (size === "large") {
    sizeClass = "text-4xl";
  } else if (size === "superlarge") {
    sizeClass = "text-6xl";
  }

  return (
    <Link
      href="/"
      className={`font-blocky logo-font inline-flex items-baseline ${sizeClass} ${className}`}
    >
      <span className="px-2 text-primary">twine</span>
    </Link>
  );
};

export default Logo;
