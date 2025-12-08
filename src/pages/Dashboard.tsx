import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  Search,
  FileText,
  Eye,
  Sparkles,
  UserCheck,
  UserX,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ClientSummary } from "../types/client";
import { clientService } from "../api/clientService";
import { Loan } from "../types/loan";
import { loanService } from "../api/loanService";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchDocument, setSearchDocument] = useState(""); // Renombrado para ser genérico (DNI/RUC)
  const [searchLoanDNI, setSearchLoanDNI] = useState("");
  const [client, setClient] = useState<ClientSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Estado para préstamos reales
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  // Cargar historial de préstamos al inicio
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoadingLoans(true);
        const allLoans = await loanService.getAllLoans();
        setLoans(allLoans);
      } catch (error) {
        console.error(error);
        toast.error("No se pudo cargar el historial de préstamos.");
      } finally {
        setLoadingLoans(false);
      }
    };

    fetchLoans();
  }, []);

  const handleSearchClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchDocument.length !== 8 && searchDocument.length !== 11) {
      toast.error("Debe ingresar un DNI (8 dígitos) o RUC (11 dígitos)");
      return;
    }
    
    setLoading(true);
    setClient(null);
    setSearched(false);
    
    try {
      // --- CORRECCIÓN: Usar búsqueda unificada ---
      // El backend/servicio decide si es DNI o RUC y busca donde corresponda.
      const result = await clientService.searchByDocument(searchDocument);
      
      if (result) {
        setClient(result);
        toast.success(
          result.tipo === "JURIDICA"
            ? "Empresa encontrada correctamente"
            : "Cliente encontrado correctamente"
        );
      } else {
        // Si es null, es un 404 controlado (Cliente nuevo)
        setClient(null);
        toast.info("Documento no registrado. Puede proceder a crearlo.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error de conexión con el servidor."
      );
      setClient(null);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleNewLoan = () => {
    if (client && !client.tienePrestamoActivo) {
      navigate("/loans/new", { state: { client } });
    }
  };

  // Filtrar préstamos para la tabla
  // Filtrar préstamos para la tabla
  const filteredLoans = loans.filter((loan) => {
    if (loan.estado !== "activo") return false;
    if (!searchLoanDNI) return true;
    const term = searchLoanDNI.toLowerCase();
    const dni = loan.cliente.dniCliente || "";
    const ruc = loan.cliente.ruc || "";
    return dni.includes(term) || ruc.includes(term);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Sección de Bienvenida */}
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-2">
          <Sparkles className="h-4 w-4" />
          Sistema de Gestión de Préstamos
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Bienvenido a Al Toque!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Gestiona préstamos personales y corporativos de forma rápida, simple y segura
        </p>
      </div>

      {/* Sección de Registro de Préstamo / Búsqueda */}
      <Card
        className="border-0 overflow-hidden"
        style={{
          background: "var(--gradient-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <PlusCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                Registrar Nuevo Préstamo
              </CardTitle>
              <CardDescription className="text-base">
                Busca al cliente por DNI o RUC para comenzar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSearchClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="searchDocument" className="text-base font-semibold">
                Número de Documento (DNI o RUC)
              </Label>
              <div className="flex gap-3">
                <Input
                  id="searchDocument"
                  type="text"
                  placeholder="Ej: 12345678 o 20123456789"
                  value={searchDocument}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setSearchDocument(value);
                    setClient(null);
                    setSearched(false);
                  }}
                  required
                  maxLength={11}
                  className="h-12 text-base"
                />
                <Button
                  type="submit"
                  disabled={
                    loading || (searchDocument.length !== 8 && searchDocument.length !== 11)
                  }
                  className="gap-2 px-8 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg"
                >
                  <Search className="h-5 w-5" />
                  {loading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </div>
          </form>

          {/* Resultado: Cliente Encontrado */}
          {searched && client && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-secondary/50 to-secondary/30 border border-primary/20">
                <div className="flex items-start gap-4 mb-4">
                  {client.tienePrestamoActivo ? (
                    <div className="p-3 rounded-xl bg-destructive/10">
                      <UserX className="h-6 w-6 text-destructive" />
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-primary/10">
                      <UserCheck className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {client.tipo === "JURIDICA"
                        ? client.razonSocial
                        : `${client.nombreCliente} ${client.apellidoCliente}`}
                    </h3>
                    <p className="text-muted-foreground font-medium">
                      {client.tipo === "JURIDICA" ? "RUC" : "DNI"}:{" "}
                      {client.tipo === "JURIDICA"
                        ? client.ruc
                        : client.dniCliente}
                    </p>
                     {/* Badge de tipo de cliente */}
                     <Badge variant="outline" className="mt-2">
                        {client.tipo === "JURIDICA" ? "Persona Jurídica" : "Persona Natural"}
                     </Badge>
                  </div>
                </div>

                {client.tienePrestamoActivo ? (
                  <Alert
                    variant="destructive"
                    className="border-destructive/50 bg-destructive/5"
                  >
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="font-semibold text-base">
                      {client.tipo === "JURIDICA"
                        ? "Esta empresa ya tiene un préstamo activo. No puede registrar uno nuevo hasta cancelar el actual."
                        : "Este cliente ya tiene un préstamo activo. No puede registrar uno nuevo hasta cancelar el actual."}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert className="border-primary/50 bg-primary/5 mb-4">
                      <UserCheck className="h-5 w-5 text-primary" />
                      <AlertDescription className="font-semibold text-primary text-base">
                        ✓{" "}
                        {client.tipo === "JURIDICA"
                          ? "Empresa disponible para registrar un nuevo préstamo"
                          : "Cliente disponible para registrar un nuevo préstamo"}
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleNewLoan}
                      size="lg"
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg"
                    >
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Continuar con el Registro
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Resultado: Cliente No Encontrado */}
          {searched && !client && (
            <Alert
              variant="destructive"
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base font-semibold">
                No se encontró información para el documento: {searchDocument}
              </AlertDescription>
            </Alert>
          )}

          {/* Botón de Registro Manual (Solo si no se encontró) */}
          {searched && !client && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
              <Button
                onClick={() => {
                  const isRuc = searchDocument.length === 11;
                  // Preparamos el objeto parcial para el formulario
                  const partialClient = {
                    dniCliente: isRuc ? "" : searchDocument,
                    ruc: isRuc ? searchDocument : "",
                    nombreCliente: "",
                    apellidoCliente: "",
                    razonSocial: "",
                    tipo: isRuc ? "JURIDICA" : "NATURAL", // Autodetectado por longitud
                    tienePrestamoActivo: false,
                  };
                  // @ts-ignore
                  navigate("/loans/new", { state: { client: partialClient } });
                }}
                size="lg"
                className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-300 shadow-lg"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Registrar Nuevo Cliente {searchDocument.length === 11 ? "Jurídico" : ""}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Préstamos */}
      <Card
        className="border-0 overflow-hidden"
        style={{
          background: "var(--gradient-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  Historial de Préstamos
                </CardTitle>
                <CardDescription className="text-base">
                  Consulta los cronogramas de pago activos
                </CardDescription>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Input
                type="text"
                placeholder="Filtrar por DNI o RUC..."
                value={searchLoanDNI}
                onChange={(e) => setSearchLoanDNI(e.target.value)}
                className="h-12 text-base md:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                  <TableHead className="font-bold text-base">Cliente</TableHead>
                  <TableHead className="font-bold text-base">Doc. Identidad</TableHead>
                  <TableHead className="font-bold text-base text-right">
                    Monto
                  </TableHead>
                  <TableHead className="font-bold text-base">Fecha</TableHead>
                  <TableHead className="font-bold text-base">Estado</TableHead>
                  <TableHead className="font-bold text-base text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLoans ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex justify-center items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-lg font-semibold text-muted-foreground">
                          Cargando préstamos...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => (
                    <TableRow
                      key={loan.idPrestamo}
                      className="hover:bg-secondary/20 transition-colors duration-200"
                    >
                      <TableCell className="font-semibold text-base">
                        {/* Lógica para mostrar nombre correcto en lista */}
                         {loan.cliente.razonSocial || `${loan.cliente.nombreCliente} ${loan.cliente.apellidoCliente}`}
                      </TableCell>
                      <TableCell className="text-base">
                         {/* Mostrar RUC o DNI según exista */}
                        {loan.cliente.ruc || loan.cliente.dniCliente}
                      </TableCell>
                      <TableCell className="text-right font-bold text-base text-primary">
                        S/ {loan.monto.toLocaleString("es-PE")}
                      </TableCell>
                      <TableCell className="text-base">
                        {new Date(loan.fechaPrestamo).toLocaleDateString(
                          "es-PE"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 font-semibold">
                          Activo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(`/loans/${loan.idPrestamo}`, {
                              state: { loan },
                            })
                          }
                          className="gap-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary hover:to-accent hover:text-white transition-all duration-300"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Cronograma
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-muted">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-semibold text-muted-foreground">
                          No hay préstamos activos
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}