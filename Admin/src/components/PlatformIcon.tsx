import Icon from "./Icon";

type PlatformIconProps = {
  platform?: string | null;
  className?: string;
};

const resolvePlatformIcon = (platform?: string | null) => {
  const normalized = platform?.toLowerCase() ?? "";
  if (normalized === "android" || normalized === "wearos") {
    return "android" as const;
  }
  if (normalized === "ios" || normalized === "tvos") {
    return "ios" as const;
  }
  return null;
};

const PlatformIcon = ({ platform, className }: PlatformIconProps) => {
  const iconName = resolvePlatformIcon(platform);
  if (!iconName) return null;
  return <Icon name={iconName} className={className} />;
};

export default PlatformIcon;
