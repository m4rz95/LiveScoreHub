import React from "react";

interface TableProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Table({ children, className = "", style = {} }: TableProps) {
  return <table className={`w-full rounded-lg${className}`} style={style}>{children}</table>;
}

export function THead({ children, className = "" }: TableProps) {
  return <thead className={`bg-white/50 backdrop-blur-sm${className}`}>{children}</thead>;
}

export function TBody({ children, className = "" }: TableProps) {
  return <tbody className={`text-center bg-white/50 backdrop-blur-sm${className}`}>{children}</tbody>;
}

export function TR({ children, className = "" }: TableProps) {
  return <tr className={`border-b-4 last:border-0 text-center ${className}`}>{children}</tr>;
}

export function TH({ children, className = "" }: TableProps) {
  return <th className={`px-3 py-2 text-sm text-gray-600 text-center ${className}`}>{children}</th>;
}

export function TD({ children, className = "" }: TableProps) {
  return <td className={`px-3 py-2 text-center bg-white/5 backdrop-blur-sm ${className}`}>{children}</td>;
}
