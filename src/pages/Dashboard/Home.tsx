import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ExpiringDocumentsCard from "../../components/dashboard/ExpiringDocumentsCard";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | ADAA Employment LLC"
        description="ADAA Employment LLC - Main dashboard for employment management and workforce administration"
      />
      <PageBreadcrumb pageTitle="Dashboard" />
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <ExpiringDocumentsCard />
      </div>
    </>
  );
}
