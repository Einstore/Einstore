import {
  faBarsProgress,
  faBoxesStacked,
  faFlag,
  faGear,
  faHouse,
  faLock,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const icons = {
  overview: faHouse,
  apps: faBoxesStacked,
  builds: faRocket,
  pipelines: faBarsProgress,
  security: faLock,
  settings: faGear,
  flags: faFlag,
} as const;

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  className?: string;
};

const Icon = ({ name, className }: IconProps) => {
  return <FontAwesomeIcon icon={icons[name]} className={className} />;
};

export default Icon;
