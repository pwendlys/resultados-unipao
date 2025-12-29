import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FiscalProtectedRoute from "@/components/auth/FiscalProtectedRoute";
import Index from "./pages/Index";
import FiscalIndex from "./pages/FiscalIndex";
import SharedReports from "./pages/SharedReports";
import SharedCustomReport from "./pages/SharedCustomReport";
import SharedCustomDashboard from "./pages/SharedCustomDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fiscal" 
              element={
                <FiscalProtectedRoute>
                  <FiscalIndex />
                </FiscalProtectedRoute>
              } 
            />
            <Route path="/relatorios-compartilhados/:shareId" element={<SharedReports />} />
            <Route path="/relatorios-compartilhados/custom/:reportId" element={<SharedCustomReport />} />
            <Route path="/dashboard-compartilhado/:shareId" element={<SharedCustomDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
