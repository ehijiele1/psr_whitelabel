export interface Grid2Props {
  children: React.ReactNode;
}

export const Grid2: React.FC<Grid2Props> = ({ children }) => {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
};