import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  collapsed?: boolean
  dark?: boolean
}

export default function Logo({ className, collapsed, dark }: LogoProps) {
  const bgColor = dark ? "#00a85e" : "#005A36"
  const textColor = dark ? "#0f172a" : "#ffffff"
  const brandColor = dark ? "#e2e8f0" : "#111111"
  const accentColor = dark ? "#00a85e" : "#005A36"

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative shrink-0">
        <svg
          width={collapsed ? 28 : 32}
          height={collapsed ? 28 : 32}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="40" height="40" rx="8" fill={bgColor} />
          <text
            x="20"
            y="20"
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize="22"
            fontWeight="700"
            fontFamily="var(--font-plus-jakarta)"
          >
            P
          </text>
        </svg>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span
            className="text-sm font-bold leading-tight tracking-tight"
            style={{ color: brandColor, fontFamily: "var(--font-plus-jakarta)" }}
          >
            PrinceSteve
          </span>
          <span
            className="text-[10px] font-medium leading-tight tracking-wider uppercase"
            style={{ color: accentColor, fontFamily: "var(--font-plus-jakarta)" }}
          >
            Residence
          </span>
        </div>
      )}
    </div>
  )
}
