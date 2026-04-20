import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-xl shadow-ambient-sm ${hover ? "hover:shadow-ambient hover:-translate-y-1 transition-all" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
