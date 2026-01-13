type AppAvatarProps = {
  name?: string | null;
  iconUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  platform?: string | null;
};

const sizes = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-10 w-10 text-base",
  md: "h-11 w-11 text-xl",
  lg: "h-20 w-20 text-2xl",
} as const;

const AppAvatar = ({ name, iconUrl, platform, size = "md" }: AppAvatarProps) => {
  const initials = name
    ? name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
    : "";

  const isAndroid = platform?.toLowerCase() === "android" || platform?.toLowerCase() === "wearos";
  const isIos = platform?.toLowerCase() === "ios" || platform?.toLowerCase() === "tvos";

  const shapeClass = isAndroid ? "rounded-full" : "rounded-lg";

  if (iconUrl) {
    return (
      <span
        className={`inline-flex ${sizes[size]} overflow-hidden ${
          isIos ? "rounded-lg" : shapeClass
        } bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600`}
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
