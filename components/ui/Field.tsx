export interface FieldProps {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  options?: string[];
  className?: string;
  maxLength?: number;
}

export const Field: React.FC<FieldProps> = ({
  label,
  value = '',
  onChange,
  placeholder = '',
  type = 'text',
  options,
  className = '',
  maxLength
}) => {
  return (
    <div className={className}>
      <label className="block text-[12px] font-medium text-slate-700 mb-1.5">{label}</label>
      {type === 'select' ? (
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 bg-white"
        >
          {options?.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500"
        />
      )}
    </div>
  );
};