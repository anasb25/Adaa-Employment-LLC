import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ExpiringDocumentsCard from "../../components/dashboard/ExpiringDocumentsCard";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Expiry Alerts | ADAA Employment LLC"
        description="ADAA Employment LLC - Document expiry alerts for employment management"
      />
      <PageBreadcrumb pageTitle="Expiry Alerts" />
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <ExpiringDocumentsCard />
      </div>
    </>
  );
}
