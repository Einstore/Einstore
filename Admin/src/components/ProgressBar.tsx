type ProgressBarProps = {
  value: number;
  max: number;
  barClassName?: string;
};

const ProgressBar = ({ value, max, barClassName = "" }: ProgressBarProps) => {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
      <div
        className={`h-full rounded-full bg-teal ${barClassName}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

export default ProgressBar;
