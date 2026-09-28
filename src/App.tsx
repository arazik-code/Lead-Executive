import { lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AppProvider } from "@/lib/store";
const Index = lazy(() => import("./pages/Index"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Pipeline = lazy(() => import("./pages/Pipeline"));
const Leads = lazy(() => import("./pages/Leads"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Messages = lazy(() => import("./pages/Messages"));
const Qualification = lazy(() => import("./pages/Qualification"));
const Routing = lazy(() => import("./pages/Routing"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ApiLeadsPage = lazy(() => import("@/components/leads/ApiLeadsPage"));
const ApiQualificationPage = lazy(() => import("@/components/qualification/ApiQualificationPage"));
const ApiRoutingPage = lazy(() => import("@/components/routing/ApiRoutingPage"));
const ApiMessagesPage = lazy(() => import("@/components/messages/ApiMessagesPage"));
const ApiDashboardPage = lazy(() => import("@/components/dashboard/ApiDashboardPage"));
const ApiPipelinePage = lazy(() => import("@/components/leads/ApiPipelinePage"));
const ApiAnalyticsPage = lazy(() => import("@/components/analytics/ApiAnalyticsPage"));
const ApiSettingsPage = lazy(() => import("@/components/settings/ApiSettingsPage"));
const ApiTeamPage = lazy(() => import("@/components/settings/ApiTeamPage"));
const ApiHelpPage = lazy(() => import("@/components/help/ApiHelpPage"));
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/auth/AuthProvider";

const queryClient = new QueryClient();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

function AppRoutes() {
  return <>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-[40vh] grid place-items-center text-sm text-muted-foreground">Loading page…</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<WorkspaceRoute api={<ApiDashboardPage />} prototype={<Index />} />} />
          <Route path="/pipeline" element={<WorkspaceRoute api={<ApiPipelinePage />} prototype={<Pipeline />} />} />
          <Route path="/leads" element={<WorkspaceRoute api={<ApiLeadsRoute />} prototype={<Leads />} />} />
          <Route path="/analytics" element={<WorkspaceRoute api={<ApiAnalyticsPage />} prototype={<Analytics />} />} />
          <Route path="/messages" element={<WorkspaceRoute api={<ApiMessagesPage />} prototype={<Messages />} />} />
          <Route path="/qualification" element={<WorkspaceRoute api={<ApiQualificationPage />} prototype={<Qualification />} />} />
          <Route path="/routing" element={<WorkspaceRoute api={<ApiRoutingPage />} prototype={<Routing />} />} />
          <Route path="/help" element={<WorkspaceRoute api={<ApiHelpPage />} prototype={<Help />} />} />
          <Route path="/settings" element={<WorkspaceRoute api={<ApiSettingsPage />} prototype={<Settings />} />} />
          <Route path="/team" element={<WorkspaceRoute api={<ApiTeamPage />} prototype={<NotFound />} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </>;
}

function WorkspaceRoute({ api, prototype }: { api: ReactNode; prototype: ReactNode }) {
  const { apiBaseUrl, token } = useAuth();
  const page = apiBaseUrl && token ? api : prototype;
  return apiBaseUrl && !token ? <AuthGate>{page}</AuthGate> : <>{page}</>;
}

function ApiLeadsRoute(){
  const location=useLocation();
  return <ApiLeadsPage key={location.search}/>;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeProvider defaultTheme="light" storageKey="elc-theme">
          <TooltipProvider>
            <AuthProvider apiBaseUrl={apiBaseUrl ?? ""}>
              <AppRoutes />
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
