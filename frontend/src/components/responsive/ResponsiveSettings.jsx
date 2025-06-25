import { useIsMobile } from "../../hooks/useIsMobile";
import Settings from "../../pages/Settings";
import MobileSettings from "../mobile/MobileSettings";

function ResponsiveSettings() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileSettings /> : <Settings />;
}

export default ResponsiveSettings;
