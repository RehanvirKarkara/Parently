import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ParentShell } from "@/components/layout/ParentShell";
import { useAuthStore } from "@/stores/authStore";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { RoleSelectPage } from "@/pages/auth/RoleSelectPage";
import { ParentActivatePage } from "@/pages/auth/ParentActivatePage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { OnboardingPage } from "@/pages/onboarding/OnboardingPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { FamilyPage } from "@/pages/family/FamilyPage";
import { QuizPage } from "@/pages/family/QuizPage";
import { HealthLogsPage } from "@/pages/health/HealthLogsPage";
import { MedicinesPage } from "@/pages/medicines/MedicinesPage";
import { AIPage } from "@/pages/ai/AIPage";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import { NotificationsPage } from "@/pages/notifications/NotificationsPage";
import { CalendarPage } from "@/pages/calendar/CalendarPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { ParentHomePage } from "@/pages/parent/ParentHomePage";
import { ParentCheckInsPage } from "@/pages/parent/ParentCheckInsPage";
import { ParentCheckInFormPage } from "@/pages/parent/ParentCheckInFormPage";
import { ParentAIPage } from "@/pages/parent/ParentAIPage";
import { ParentLegacyPage } from "@/pages/parent/ParentLegacyPage";
import { ParentHealthPage } from "@/pages/parent/ParentHealthPage";
import { PrivacyPolicyPage } from "@/pages/legal/PrivacyPolicyPage";
import { TermsPage } from "@/pages/legal/TermsPage";
import { MedicalDisclaimerPage } from "@/pages/legal/MedicalDisclaimerPage";
import { AIDataProcessingPage } from "@/pages/legal/AIDataProcessingPage";
import { CookiePolicyPage } from "@/pages/legal/CookiePolicyPage";

function RequireOffspring({ children }: { children: React.ReactNode }) {
  const { mode } = useAuthStore();
  if (mode === "parent") return <Navigate to="/parent" replace />;
  if (mode !== "offspring") return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

function RequireParent({ children }: { children: React.ReactNode }) {
  const { mode, parent } = useAuthStore();
  if (mode !== "parent") return <Navigate to="/login" replace />;
  if (parent && !parent.is_active) return <Navigate to="/parent/activate" replace />;
  return <>{children}</>;
}

function RequirePendingParent({ children }: { children: React.ReactNode }) {
  const { mode, parent } = useAuthStore();
  if (mode === "parent" && parent && !parent.is_active) return <>{children}</>;
  if (mode === "parent") return <Navigate to="/parent" replace />;
  return <Navigate to="/login" replace />;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { mode } = useAuthStore();
  const location = useLocation();
  if (mode === "offspring") return <Navigate to="/" replace />;
  if (mode === "parent") return <Navigate to="/parent" replace />;
  if (location.pathname === "/login" || location.pathname === "/register") return <>{children}</>;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/welcome"
        element={
          <GuestOnly>
            <RoleSelectPage />
          </GuestOnly>
        }
      />
      <Route
        path="/parent/activate"
        element={
          <RequirePendingParent>
            <ParentActivatePage />
          </RequirePendingParent>
        }
      />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Public Legal & Privacy Pages */}
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/medical-disclaimer" element={<MedicalDisclaimerPage />} />
      <Route path="/ai-data-processing" element={<AIDataProcessingPage />} />
      <Route path="/cookie-policy" element={<CookiePolicyPage />} />

      <Route
        element={
          <RequireOffspring>
            <AppShell />
          </RequireOffspring>
        }
      >
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/family" element={<FamilyPage />} />
        <Route path="/family/quiz" element={<QuizPage />} />
        <Route path="/health-logs" element={<HealthLogsPage />} />
        <Route path="/medicines" element={<MedicinesPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/parent"
        element={
          <RequireParent>
            <ParentShell />
          </RequireParent>
        }
      >
        <Route index element={<ParentHomePage />} />
        <Route path="check-ins" element={<ParentCheckInsPage />} />
        <Route path="check-in/:period" element={<ParentCheckInFormPage />} />
        <Route path="ai" element={<ParentAIPage />} />
        <Route path="legacy" element={<ParentLegacyPage />} />
        <Route path="health" element={<ParentHealthPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
