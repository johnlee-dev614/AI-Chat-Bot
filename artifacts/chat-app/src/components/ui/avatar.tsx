import * as React from "react";
import { cn, getInitials, generateGradient } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Avatar({ src, alt, name, size = "md", className, ...props }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-xl",
    "2xl": "w-32 h-32 text-3xl",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-white/10 shadow-lg",
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className="aspect-square h-full w-full object-cover"
          onError={(e) => {
            // Fallback to gradient if image fails
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement!.style.background = generateGradient(name);
            e.currentTarget.parentElement!.innerHTML = `<span class="flex h-full w-full items-center justify-center font-semibold text-white tracking-wider">${getInitials(name)}</span>`;
          }}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-semibold text-white tracking-wider"
          style={{ background: generateGradient(name) }}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
