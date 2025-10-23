import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import PasswordResetForm from "../../components/auth/PasswordResetForm";

export default function PasswordReset() {
  return (
    <>
      <PageMeta
        title="Forgot Password | ADAA Employment LLC"
        description="Reset your password for ADAA Employment LLC - Professional employment management platform"
      />
      <AuthLayout>
        <PasswordResetForm />
      </AuthLayout>
    </>
  );
}
