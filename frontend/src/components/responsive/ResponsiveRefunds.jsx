import { useIsMobile } from "../../hooks/useIsMobile";
import MobileRefunds from "../mobile/MobileRefunds";
import Refunds from "../../pages/Refunds";

const ResponsiveRefunds = () => {
  const isMobile = useIsMobile();

  return isMobile ? <MobileRefunds /> : <Refunds />;
};

export default ResponsiveRefunds;
