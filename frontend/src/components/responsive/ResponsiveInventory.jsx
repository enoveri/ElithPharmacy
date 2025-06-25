import { useIsMobile } from "../../hooks/useIsMobile";
import Inventory from "../../pages/Inventory";
import MobileInventory from "../mobile/MobileInventory";

function ResponsiveInventory() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileInventory /> : <Inventory />;
}

export default ResponsiveInventory;
