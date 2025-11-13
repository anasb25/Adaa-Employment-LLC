import { useEffect } from "react";
import { usePageTitle } from "../../context/PageTitleContext";

interface BreadcrumbProps {
  pageTitle: string;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle }) => {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle(pageTitle);
  }, [pageTitle, setPageTitle]);

  // This component no longer renders anything, it just sets the page title
  return null;
};

export default PageBreadcrumb;
