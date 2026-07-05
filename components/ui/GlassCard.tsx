export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false
}) => {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-white/5
        backdrop-blur-xl
        border border-white/10
        shadow-xl
        rounded-2xl
        p-6
        transition-all duration-300
        ${hoverEffect ? 'hover:bg-white/10 hover:scale-[1.01] hover:shadow-2xl cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};