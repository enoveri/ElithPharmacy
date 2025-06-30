import { useIsMobile } from "../../hooks/useIsMobile";
import Customers from "../../pages/Customers";
import MobileCustomers from "../mobile/MobileCustomers";

function ResponsiveCustomers() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileCustomers /> : <Customers />;
}

export default ResponsiveCustomers;
