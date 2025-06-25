import { useIsMobile } from "../../hooks/useIsMobile";
import SalesHistory from "../../pages/SalesHistory";
import MobileSalesHistory from "../mobile/MobileSalesHistory";

function ResponsiveSalesHistory() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileSalesHistory /> : <SalesHistory />;
}

export default ResponsiveSalesHistory;
