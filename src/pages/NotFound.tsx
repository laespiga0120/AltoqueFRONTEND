import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary/30 via-background to-primary/20">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-8xl font-bold text-primary">404</h1>
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-foreground">Página no encontrada</p>
          <p className="text-muted-foreground">La página que buscas no existe</p>
        </div>
        <Button onClick={() => navigate('/')} className="gap-2 mt-6">
          <Home className="h-4 w-4" />
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
