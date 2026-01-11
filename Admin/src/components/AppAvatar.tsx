type AppAvatarProps = {
  name: string;
  size?: "sm" | "md";
};

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-8 w-8 text-sm",
} as const;

const AppAvatar = ({ name, size = "md" }: AppAvatarProps) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className={`flex ${sizes[size]} items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300`}
      aria-hidden="true"
    >
      {initials || "A"}
    </span>
  );
};

export default AppAvatar;
