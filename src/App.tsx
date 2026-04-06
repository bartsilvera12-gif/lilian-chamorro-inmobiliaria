import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import DevelopmentsPage from "./pages/Developments";
import TestimonialsPage from "./pages/Testimonials";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminPropertiesPage from "./pages/admin/AdminPropertiesPage";
import AdminPropertyFormPage from "./pages/admin/AdminPropertyFormPage";
import AdminQuotesPage from "./pages/admin/AdminQuotesPage";
import AdminNeighborhoodsPage from "./pages/admin/AdminNeighborhoodsPage";
import AdminCitiesPage from "./pages/admin/AdminCitiesPage";
import AdminPropertyTypesPage from "./pages/admin/AdminPropertyTypesPage";
import AdminSuccessCasesPage from "./pages/admin/AdminSuccessCasesPage";
import AdminTestimonialsPage from "./pages/admin/AdminTestimonialsPage";
import AdminDevelopmentsPage from "./pages/admin/AdminDevelopmentsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/propiedades" element={<Properties />} />
              <Route path="/propiedad/:id" element={<PropertyDetail />} />
              <Route path="/desarrollo" element={<DevelopmentsPage />} />
              <Route path="/testimonios" element={<TestimonialsPage />} />

              {/* Admin Auth */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

              {/* Admin Protected */}
              <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
              <Route path="/admin/properties" element={<AdminProtectedRoute><AdminPropertiesPage /></AdminProtectedRoute>} />
              <Route path="/admin/properties/new" element={<AdminProtectedRoute><AdminPropertyFormPage /></AdminProtectedRoute>} />
              <Route path="/admin/properties/:id/edit" element={<AdminProtectedRoute><AdminPropertyFormPage /></AdminProtectedRoute>} />
              <Route path="/admin/quotes" element={<AdminProtectedRoute><AdminQuotesPage /></AdminProtectedRoute>} />
              <Route path="/admin/success-cases" element={<AdminProtectedRoute><AdminSuccessCasesPage /></AdminProtectedRoute>} />
              <Route path="/admin/testimonials" element={<AdminProtectedRoute><AdminTestimonialsPage /></AdminProtectedRoute>} />
              <Route path="/admin/developments" element={<AdminProtectedRoute><AdminDevelopmentsPage /></AdminProtectedRoute>} />
              <Route path="/admin/cities" element={<AdminProtectedRoute><AdminCitiesPage /></AdminProtectedRoute>} />
              <Route path="/admin/neighborhoods" element={<AdminProtectedRoute><AdminNeighborhoodsPage /></AdminProtectedRoute>} />
              <Route path="/admin/property-types" element={<AdminProtectedRoute><AdminPropertyTypesPage /></AdminProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
