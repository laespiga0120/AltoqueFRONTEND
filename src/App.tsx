import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewLoan from "./pages/NewLoan";
import LoanDetails from "./pages/LoanDetails";
import PaymentOperations from "./pages/PaymentOperations";
import CashRegister from "./pages/CashRegister";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PaymentStatus from "./pages/PaymentStatus";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <NewLoan />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <LoanDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/operations"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentOperations />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cash-register"
            element={
              <ProtectedRoute>
                <Layout>
                  <CashRegister />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Rutas de retorno de Mercado Pago */}
          <Route
            path="/payment/success"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentStatus status="success" />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/failure"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentStatus status="failure" />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/pending"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentStatus status="pending" />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;