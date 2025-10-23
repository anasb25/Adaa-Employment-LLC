import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | ADAA Employment LLC"
        description="Sign in to ADAA Employment LLC - Professional employment management platform"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
