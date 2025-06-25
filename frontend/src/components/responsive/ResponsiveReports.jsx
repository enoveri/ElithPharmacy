import { useIsMobile } from "../../hooks/useIsMobile";
import Reports from "../../pages/Reports";
import MobileReports from "../mobile/MobileReports";

function ResponsiveReports() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileReports /> : <Reports />;
}

export default ResponsiveReports;
