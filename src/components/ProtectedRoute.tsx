import { Navigate } from "react-router-dom";
import { authService } from "@/api/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Usamos nuestra función centralizada para verificar si el usuario está autenticado.
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Si no está autenticado, lo redirigimos a la página de login.
    // 'replace' evita que la ruta de login se quede en el historial de navegación.
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizamos el componente hijo (Layout, Dashboard, etc.).
  return <>{children}</>;
};

export default ProtectedRoute;
