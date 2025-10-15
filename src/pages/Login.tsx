import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Lock, User } from "lucide-react";
import { authService } from "@/api/authService"; // Importamos nuestro servicio

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // La función ahora es asíncrona para poder usar await
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamamos a nuestro servicio de autenticación
      await authService.login({ username, password });

      // Si la promesa se resuelve, el login fue exitoso
      toast.success("¡Bienvenido! Inicio de sesión exitoso");
      navigate("/"); // Redirigimos al dashboard
    } catch (error) {
      // Por defecto, un mensaje genérico.
      let errorMessage = "No se pudo conectar al servidor. Inténtalo de nuevo.";

      // Verificamos que 'error' sea una instancia de Error para acceder a '.message' de forma segura.
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Usamos el toast de sonner que ya tienes configurado
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--gradient-hero)" }}
    >
      <Card
        className="w-full max-w-lg border-0 overflow-hidden"
        style={{
          background: "var(--gradient-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <CardHeader className="space-y-6 text-center pb-8 pt-12">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent blur-2xl opacity-30 animate-pulse" />
              <img
                src={logo}
                alt="Al Toque!"
                className="h-32 object-contain relative z-10 drop-shadow-2xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Panel de Administración
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-semibold">
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-14 pl-12 text-base"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-semibold">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 pl-12 text-base"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg mt-8"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
