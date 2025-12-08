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
import { Loan } from "../types/loan"; // Importar el tipo Loan
import { loanService } from "../api/loanService"; // Importar el servicio de préstamos

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchDNI, setSearchDNI] = useState("");
  const [searchLoanDNI, setSearchLoanDNI] = useState("");
  const [client, setClient] = useState<ClientSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // --- CAMBIO: Estado para préstamos reales y estado de carga ---
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  // --- CAMBIO: Cargar los préstamos reales al montar el componente ---
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoadingLoans(true);
        const allLoans = await loanService.getAllLoans();
        setLoans(allLoans);
      } catch (error) {
        toast.error("No se pudo cargar el historial de préstamos.");
      } finally {
        setLoadingLoans(false);
      }
    };

    fetchLoans();
  }, []);

  const handleSearchClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchDNI.length !== 8 && searchDNI.length !== 11) {
      toast.error("Debe ingresar un DNI (8 dígitos) o RUC (11 dígitos)");
      return;
    }
    setLoading(true);
    setClient(null);
    setSearched(false);
    try {
      let result;
      if (searchDNI.length === 11) {
        // Búsqueda por RUC (MOCK)
        result = await clientService.searchByRUC(searchDNI);
      } else {
        // Búsqueda por DNI (Existente)
        result = await clientService.searchByDNI(searchDNI);
      }
      setClient(result);
      toast.success(
        result.tipo === "JURIDICA"
          ? "Empresa encontrada correctamente"
          : "Cliente encontrado correctamente"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ocurrió un error inesperado."
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
  const filteredLoans = loans.filter(
    (loan) =>
      loan.estado === "activo" &&
      (!searchLoanDNI || loan.cliente.dniCliente.includes(searchLoanDNI))
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ... (sección de bienvenida sin cambios) ... */}
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-2">
          <Sparkles className="h-4 w-4" />
          Sistema de Gestión de Préstamos
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Bienvenido a Al Toque!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Gestiona préstamos personales de forma rápida, simple y segura
        </p>
      </div>

      {/* ... (sección de registro de préstamo sin cambios) ... */}
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
                Busca al cliente por DNI para comenzar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSearchClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="searchDNI" className="text-base font-semibold">
                Número de Documento (DNI o RUC)
              </Label>
              <div className="flex gap-3">
                <Input
                  id="searchDNI"
                  type="text"
                  placeholder="Ej: 01234567"
                  value={searchDNI}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setSearchDNI(value);
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
                    loading || (searchDNI.length !== 8 && searchDNI.length !== 11)
                  }
                  className="gap-2 px-8 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg"
                >
                  <Search className="h-5 w-5" />
                  {loading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </div>
          </form>

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

          {searched && !client && (
            <Alert
              variant="destructive"
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base font-semibold">
                No se encontró información para el documento: {searchDNI}
              </AlertDescription>
            </Alert>
          )}

          {/* Bloque para cuando no se encuentra el cliente y se permite continuar anyway (simulando comportamiento descrito) */}
          {searched && !client && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
              <Button
                onClick={() => {
                  // Navegar con datos parciales para rellenar
                  const isRuc = searchDNI.length === 11;
                  const partialClient = {
                    dniCliente: isRuc ? "" : searchDNI,
                    ruc: isRuc ? searchDNI : "",
                    nombreCliente: "",
                    apellidoCliente: "",
                    razonSocial: "",
                    tipo: isRuc ? "JURIDICA" : "NATURAL",
                    tienePrestamoActivo: false,
                  };
                  // @ts-ignore - Enviamos partialClient que cumple con ClientSummary en tiempo de ejecucion aunque le falten campos vacios
                  navigate("/loans/new", { state: { client: partialClient } });
                }}
                size="lg"
                className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-300 shadow-lg"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Registrar Nuevo Cliente {searchDNI.length === 11 ? "Jurídico" : ""}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- CAMBIO: Lista de préstamos ahora usa datos reales --- */}
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
                  Consulta los cronogramas de pago de todos los préstamos
                </CardDescription>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Input
                type="text"
                placeholder="Buscar por DNI..."
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
                  <TableHead className="font-bold text-base">DNI</TableHead>
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
                        {`${loan.cliente.nombreCliente} ${loan.cliente.apellidoCliente}`}
                      </TableCell>
                      <TableCell className="text-base">
                        {loan.cliente.dniCliente}
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
                        <p className="text-sm text-muted-foreground">
                          Registra un préstamo usando el formulario de arriba
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
