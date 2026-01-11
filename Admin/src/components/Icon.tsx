import {
  faBars,
  faBarsProgress,
  faBoxesStacked,
  faBell,
  faChevronDown,
  faCircleUser,
  faFlag,
  faGear,
  faGlobe,
  faGrip,
  faHouse,
  faKey,
  faLock,
  faMagnifyingGlass,
  faMoon,
  faPlus,
  faRocket,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { faApple, faAndroid } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const icons = {
  overview: faHouse,
  apps: faBoxesStacked,
  builds: faRocket,
  pipelines: faBarsProgress,
  security: faLock,
  settings: faGear,
  flags: faFlag,
  bell: faBell,
  ios: faApple,
  android: faAndroid,
  search: faMagnifyingGlass,
  globe: faGlobe,
  moon: faMoon,
  grid: faGrip,
  user: faCircleUser,
  chevronDown: faChevronDown,
  plus: faPlus,
  sun: faSun,
  menu: faBars,
  key: faKey,
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
