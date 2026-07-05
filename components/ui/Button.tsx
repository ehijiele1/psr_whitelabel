export const Button: React.FC<{
  onClick?: () => void;
  loading?: boolean;
  label: string;
  icon?: string;
  color?: 'blue' | 'paystack' | 'green' | 'amber';
  className?: string;
}> = ({
  onClick,
  loading,
  label,
  icon,
  color = 'blue',
  className = ''
}) => {
  const bgClass = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    paystack: 'bg-[#00C3F7] hover:bg-[#00A8D8]',
    green: 'bg-green-600 hover:bg-green-700',
    amber: 'bg-amber-600 hover:bg-amber-700'
  }[color];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        w-full ${bgClass} text-white rounded-xl py-3.5 text-[14px] font-semibold
        flex items-center justify-center gap-2 transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? <><i className="ti ti-loader-2 animate-spin" /> Please wait…</> : <><i className={`ti ${icon}`} /> {label}</>}
    </button>
  );
};