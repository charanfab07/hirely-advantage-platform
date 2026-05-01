import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout.tsx";
import ResumeAnalyzer from "./pages/dashboard/ResumeAnalyzer.tsx";
import CompareResumes from "./pages/dashboard/CompareResumes.tsx";
import CoverLetterGenerator from "./pages/dashboard/CoverLetterGenerator.tsx";
import InterviewPrep from "./pages/dashboard/InterviewPrep.tsx";
import PlaceholderPage from "./pages/dashboard/PlaceholderPage.tsx";
import Upgrade from "./pages/dashboard/Upgrade.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/app/resume" replace />} />
            <Route path="resume" element={<ResumeAnalyzer />} />
            <Route path="compare" element={<CompareResumes />} />
            <Route path="cover-letter" element={<CoverLetterGenerator />} />
            <Route path="interview-prep" element={<InterviewPrep />} />
            <Route
              path="applications"
              element={
                <PlaceholderPage
                  eyebrow="Applications"
                  title="Every conversation, in one place."
                  description="Track every role you've applied to — status, last touch, and what to do next. Filling out soon."
                />
              }
            />
            <Route
              path="outreach"
              element={
                <PlaceholderPage
                  eyebrow="Outreach"
                  title="Cold DMs that warm up fast."
                  description="LinkedIn pings, recruiter follow-ups, and warm intros — all drafted, sent, and tracked from here."
                />
              }
            />
            <Route
              path="saved"
              element={
                <PlaceholderPage
                  eyebrow="Saved roles"
                  title="The shortlist."
                  description="Roles you starred and want to come back to. We'll prep tailored materials when you're ready."
                />
              }
            />
            <Route path="upgrade" element={<Upgrade />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
