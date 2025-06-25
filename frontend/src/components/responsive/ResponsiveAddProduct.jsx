import { useIsMobile } from "../../hooks/useIsMobile";
import AddProduct from "../../pages/AddProduct";
import MobileAddProduct from "../mobile/MobileAddProduct";

function ResponsiveAddProduct() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileAddProduct /> : <AddProduct />;
}

export default ResponsiveAddProduct;
