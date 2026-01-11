type ProgressBarProps = {
  value: number;
  max: number;
  barClassName?: string;
};

const ProgressBar = ({ value, max, barClassName = "" }: ProgressBarProps) => {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div
        className={`h-full rounded-full bg-indigo-500 ${barClassName}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

export default ProgressBar;
