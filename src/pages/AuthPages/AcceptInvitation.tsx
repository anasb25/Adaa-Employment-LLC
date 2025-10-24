import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import AcceptInvitationForm from "../../components/auth/AcceptInvitationForm";

export default function AcceptInvitation() {
  return (
    <>
      <PageMeta
        title="Accept Invitation | ADAA Employment LLC"
        description="Complete your registration with ADAA Employment LLC"
      />
      <AuthLayout>
        <AcceptInvitationForm />
      </AuthLayout>
    </>
  );
}
