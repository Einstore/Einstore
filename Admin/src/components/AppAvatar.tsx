type AppAvatarProps = {
  name?: string | null;
  iconUrl?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-20 w-20 text-2xl",
} as const;

const AppAvatar = ({ name, iconUrl, size = "md" }: AppAvatarProps) => {
  const initials = name
    ? name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
    : "";

  if (iconUrl) {
    return (
      <span
        className={`inline-flex ${sizes[size]} overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600`}
        aria-hidden="true"
      >
        <img src={iconUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex ${sizes[size]} items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300`}
      aria-hidden="true"
    >
      {initials || "A"}
    </span>
  );
};

export default AppAvatar;
