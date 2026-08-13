import { cn } from "@/lib/utils"
import { brand } from "@/lib/config"

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
  const monogram = brand.shortName.charAt(0).toUpperCase() || "E"

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
            {monogram}
          </text>
        </svg>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span
            className="text-sm font-bold leading-tight tracking-tight"
            style={{ color: brandColor, fontFamily: "var(--font-plus-jakarta)" }}
          >
            {brand.name}
          </span>
          <span
            className="text-[10px] font-medium leading-tight tracking-wider uppercase"
            style={{ color: accentColor, fontFamily: "var(--font-plus-jakarta)" }}
          >
            {brand.shortName}
          </span>
        </div>
      )}
    </div>
  )
}
