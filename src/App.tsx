import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import PasswordReset from "./pages/AuthPages/PasswordReset";
import AcceptInvitation from "./pages/AuthPages/AcceptInvitation";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ExpiryAlerts from "./pages/Dashboard/ExpiryAlerts";
import RoleManagement from "./pages/RoleManagement";
import UserManagement from "./pages/UserManagement";
import EmployeeManagement from "./pages/EmployeeManagement";
import SkillManagement from "./pages/SkillManagement";
import SkillTypesManagement from "./pages/SkillTypesManagement";
import SupplierManagement from "./pages/SupplierManagement";
import ClientManagement from "./pages/ClientManagement";
import ProjectManagement from "./pages/ProjectManagement";
import SpecialDaysManagement from "./pages/SpecialDaysManagement";
import RateVariantsManagement from "./pages/RateVariantsManagement";
import CreateMobilization from "./pages/CreateMobilization";
import EditMobilization from "./pages/EditMobilization";
import DailyMobilizationManagement from "./pages/DailyMobilizationManagement";
import MonthlyProjectTimesheets from "./pages/MonthlyProjectTimesheets";
import DailyUtilizationReport from "./pages/DailyUtilizationReport";
import PayrollManagement from "./pages/PayrollManagement";
import InvoiceManagement from "./pages/InvoiceManagement";
import InvoiceDetail from "./pages/InvoiceDetail";
import SettlementManagement from "./pages/SettlementManagement";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthGuard from "./components/auth/AuthGuard";
import AppProviders from "./providers/AppProviders";

export default function App() {
  return (
    <AppProviders>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Protected Dashboard Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/expiry-alerts" element={<ExpiryAlerts />} />
            <Route index path="/" element={<Home />} />

            {/* Main Pages */}
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/suppliers" element={<SupplierManagement />} />
            <Route path="/skills" element={<SkillManagement />} />
            <Route path="/clients" element={<ClientManagement />} />
            <Route path="/projects" element={<ProjectManagement />} />
            <Route path="/special-days" element={<SpecialDaysManagement />} />
            <Route path="/rate-variants" element={<RateVariantsManagement />} />
            <Route
              path="/mobilizations"
              element={<DailyMobilizationManagement />}
            />
            <Route
              path="/mobilizations/create"
              element={<CreateMobilization />}
            />
            <Route
              path="/mobilizations/:id/edit"
              element={<EditMobilization />}
            />
            <Route
              path="/mobilizations/daily"
              element={<DailyMobilizationManagement />}
            />
            <Route path="/timesheets" element={<MonthlyProjectTimesheets />} />
            <Route
              path="/timesheets/monthly"
              element={<MonthlyProjectTimesheets />}
            />
            <Route path="/daily-report" element={<DailyUtilizationReport />} />
            <Route path="/payroll" element={<PayrollManagement />} />
            <Route path="/invoices" element={<InvoiceManagement />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/settlements" element={<SettlementManagement />} />

            {/* Admin Pages */}
            <Route path="/admin/roles" element={<RoleManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route
              path="/admin/skill-types"
              element={<SkillTypesManagement />}
            />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Public Auth Routes - Only accessible when NOT authenticated */}
          <Route
            path="/signin"
            element={
              <AuthGuard>
                <SignIn />
              </AuthGuard>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthGuard>
                <ForgotPassword />
              </AuthGuard>
            }
          />
          <Route
            path="/reset-password"
            element={
              <AuthGuard>
                <PasswordReset />
              </AuthGuard>
            }
          />

          {/* Public Invitation Route - Accessible without authentication */}
          <Route path="/accept-invitation" element={<AcceptInvitation />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AppProviders>
  );
}
