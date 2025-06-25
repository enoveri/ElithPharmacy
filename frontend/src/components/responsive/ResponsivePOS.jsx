import { useIsMobile } from "../../hooks/useIsMobile";
import POS from "../../pages/POS";
import MobilePOS from "../mobile/MobilePOS";

function ResponsivePOS() {
  const isMobile = useIsMobile();
  return isMobile ? <MobilePOS /> : <POS />;
}

export default ResponsivePOS;
