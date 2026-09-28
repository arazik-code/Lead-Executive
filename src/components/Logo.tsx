import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: { title: "text-[10px]", subtitle: "text-[8px]" },
    md: { title: "text-xs", subtitle: "text-[10px]" },
    lg: { title: "text-sm", subtitle: "text-xs" },
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizeClasses[size], "shrink-0")}
      >
        {/* A compact ledger mark: one anchored outline with rising bars. */}
        <path
          d="M24 2L42 12V28C42 36.837 34.837 44 26 46L24 46.5L22 46C13.163 44 6 36.837 6 28V12L24 2Z"
          fill="#202630"
          stroke="#E47B4A"
          strokeWidth="1.5"
        />

        <rect x="13" y="28" width="4" height="10" rx="1" fill="#C9D0D7" />
        <rect x="19" y="22" width="4" height="16" rx="1" fill="#C9D0D7" />
        <rect x="25" y="16" width="4" height="22" rx="1" fill="#E47B4A" />
        <rect x="31" y="10" width="4" height="28" rx="1" fill="#E47B4A" />

        {/* Target/crosshair accent at top */}
        <circle cx="24" cy="8" r="2" fill="#E47B4A" />
        <path
          d="M24 4V6M24 10V12M20 8H22M26 8H28"
          stroke="#E47B4A"
          strokeWidth="1"
          strokeLinecap="round"
        />

      </svg>

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-bold text-foreground tracking-wide leading-tight",
              textSizeClasses[size].title
            )}
          >
            EXECUTIVE
          </span>
          <span
            className={cn(
              "text-muted-foreground tracking-wide leading-tight",
              textSizeClasses[size].subtitle
            )}
          >
            LEAD CONTROL
            <span className="text-accent text-[8px] ml-0.5">™</span>
          </span>
        </div>
      )}
    </div>
  );
}
