import { useIsMobile } from "../../hooks/useIsMobile";
import Purchases from "../../pages/Purchases";
import MobilePurchases from "../mobile/MobilePurchases";

function ResponsivePurchases() {
  const isMobile = useIsMobile();
  return isMobile ? <MobilePurchases /> : <Purchases />;
}

export default ResponsivePurchases;
