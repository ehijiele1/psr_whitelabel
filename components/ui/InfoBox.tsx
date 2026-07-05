export interface InfoBoxProps {
  type: 'blue' | 'green' | 'amber' | 'red';
  children: React.ReactNode;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ type, children }) => {
  const styles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  };
  return <div className={`border rounded-lg p-3 text-[12px] mb-3 ${styles[type]}`}>{children}</div>;
};