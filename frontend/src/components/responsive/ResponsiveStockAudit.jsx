import { useIsMobile } from "../../hooks/useIsMobile";
import StockAudit from "../../pages/StockAudit";
import MobileStockAudit from "../mobile/MobileStockAudit";

function ResponsiveStockAudit() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileStockAudit /> : <StockAudit />;
}

export default ResponsiveStockAudit; 