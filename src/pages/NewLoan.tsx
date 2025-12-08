import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  FileText,
  Printer,
  Sparkles,
  ArrowLeft,
  UserPlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { clientService } from "../api/clientService";
import { ClientSummary, ClientDetail } from "../types/client";
import { loanService } from "../api/loanService";
import { LoanDto } from "../types/loan";

const UIT_VALUE = 5150;

const isOfLegalAge = (birthDateString: string): boolean => {
  if (!birthDateString) return false;
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age >= 18;
};

export default function NewLoan() {
  const location = useLocation();
  const navigate = useNavigate();
  const clientSummary = location.state?.client as ClientSummary | undefined;

  const [clientDetails, setClientDetails] = useState<ClientDetail | null>(null);
  const [formState, setFormState] = useState({
    direccionCliente: "",
    fechaNacimiento: "",
    correoCliente: "",
    telefonoCliente: "",
    esPep: false,
    // Estado para Persona Jurídica
    ruc: "",
    razonSocial: "",
    direccionFiscal: "",
    fechaConstitucion: "",
    representanteLegalDni: "",
    representanteLegalNombre: "",
    cargoRepresentante: "",
  });
  const [loanState, setLoanState] = useState({
    amount: "",
    interestRate: "24",
    loanDate: new Date().toISOString().split("T")[0],
    installments: "1",
  });

  const [isClientRegistered, setIsClientRegistered] = useState(false);
  const [loadingClientDetails, setLoadingClientDetails] = useState(true);
  const [loading, setLoading] = useState(false);

  const exceedsUIT = parseFloat(loanState.amount) > UIT_VALUE;

  useEffect(() => {
    // Validación: debe tener DNI o RUC
    if (!clientSummary?.dniCliente && !clientSummary?.ruc) {
      toast.error("No se ha proporcionado un documento de identidad válido.");
      navigate("/");
      return;
    }

    const fetchClientDetails = async () => {
      try {
        setLoadingClientDetails(true);
        let data: ClientDetail;
        
        if (clientSummary.tipo === 'JURIDICA' && clientSummary.ruc) {
           data = await clientService.getDetailsByRUC(clientSummary.ruc);
        } else if (clientSummary.dniCliente) {
           data = await clientService.getDetailsByDNI(clientSummary.dniCliente);
        } else {
           throw new Error("Identificador de cliente no válido");
        }

        setClientDetails(data);
        setFormState({
          direccionCliente: data.direccionCliente || "",
          fechaNacimiento: data.fechaNacimiento
            ? data.fechaNacimiento.split("T")[0]
            : "",
          correoCliente: data.correoCliente || "",
          telefonoCliente: data.telefonoCliente || "",
          esPep: data.esPep || false,
          // Mapeo de datos de PJ
          ruc: data.ruc || "",
          razonSocial: data.razonSocial || "",
          direccionFiscal: data.direccionFiscal || "",
          fechaConstitucion: data.fechaConstitucion
            ? data.fechaConstitucion.split("T")[0]
            : "",
          representanteLegalDni: data.representanteLegalDni || "",
          representanteLegalNombre: data.representanteLegalNombre || "",
          cargoRepresentante: "", // Si hubiese
        });

        if (!data.esNuevo) {
          setIsClientRegistered(true);
          toast.info("Cliente ya registrado. Se ha cargado su información.");
        }
      } catch (error) {
        console.error(error);
        toast.error(
          "No se pudo cargar la información del cliente. Intente de nuevo."
        );
        navigate("/");
      } finally {
        setLoadingClientDetails(false);
      }
    };

    fetchClientDetails();
  }, [clientSummary, navigate]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState((prev) => ({ ...prev, [id]: value }));
  };

  const handleLoanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLoanState((prev) => ({ ...prev, [id]: value }));
  };

  const handleDownloadPEP = async () => {
    if (!clientDetails) return;
    toast.info("Generando declaración jurada PEP...");
    try {
      const clientDataForPdf: ClientDetail = {
        ...clientDetails,
        ...formState,
      };
      await clientService.downloadPEPPdf(clientDataForPdf);
      toast.success("Descarga iniciada.");
    } catch (error) {
      toast.error("No se pudo generar el documento.");
    }
  };

  const handleDownloadUITDeclaration = async () => {
    if (!clientDetails) {
      toast.error("No hay datos del cliente para generar el documento.");
      return;
    }
    toast.info("Generando declaración jurada por monto...");
    try {
      const clientDataForPdf: ClientDetail = {
        ...clientDetails,
        ...formState,
      };
      await clientService.downloadUITPdf(
        clientDataForPdf,
        parseFloat(loanState.amount)
      );
      toast.success("Descarga de la declaración iniciada.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(`No se pudo generar el documento: ${errorMessage}`);
    }
  };

  const handleRegisterClient = async () => {
    if (!clientDetails) return;

    if (!clientDetails) return;
    
    // VALIDACIÓN DIFERENCIADA
    const isJuridica = clientDetails.tipo === "JURIDICA";

    if (isJuridica) {
      if (
        !formState.ruc ||
        !formState.razonSocial ||
        !formState.direccionFiscal ||
        !formState.fechaConstitucion ||
        !formState.representanteLegalDni ||
        !formState.representanteLegalNombre
      ) {
         toast.error("Todos los campos de la empresa son obligatorios.");
         return;
      }
      if (formState.ruc.length !== 11) {
        toast.error("El RUC debe tener 11 dígitos.");
        return;
      }
      if(formState.representanteLegalDni.length !== 8){
        toast.error("El DNI del representante debe tener 8 dígitos.");
        return;
      }
    } else {
      // Validación Persona Natural
      if (
        !formState.direccionCliente ||
        !formState.fechaNacimiento ||
        !formState.correoCliente ||
        !formState.telefonoCliente
      ) {
        toast.error(
          "Todos los campos de información del cliente son obligatorios."
        );
        return;
      }
      if (!isOfLegalAge(formState.fechaNacimiento)) {
        toast.error("El cliente debe ser mayor de 18 años.");
        return;
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.correoCliente)) {
      toast.error("Por favor, ingrese un correo electrónico válido.");
      return;
    }
    if (!/^\d{9}$/.test(formState.telefonoCliente)) {
      toast.error("El número de teléfono debe contener 9 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<ClientDetail> = {
        ...clientDetails,
        ...formState,
      };
      const registeredClient = await clientService.registerOrUpdate(payload);
      setClientDetails(registeredClient);
      setIsClientRegistered(true);
      toast.success("Información del cliente guardada correctamente.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al guardar: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientDetails?.idCliente) {
      toast.error(
        "El cliente no tiene un ID válido. Guarde su información primero."
      );
      return;
    }
    if (!isClientRegistered) {
      toast.warning("Por favor, primero guarde la información del cliente.");
      return;
    }

    const amount = parseFloat(loanState.amount);
    const interest = parseFloat(loanState.interestRate);
    const installments = parseInt(loanState.installments, 10);

    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto del préstamo debe ser un número mayor a cero.");
      return;
    }
    if (isNaN(interest) || interest <= 0) {
      toast.error("La tasa de interés debe ser un número mayor a cero.");
      return;
    }
    if (isNaN(installments) || installments <= 0) {
      toast.error("El número de cuotas debe ser mayor a cero.");
      return;
    }

    setLoading(true);
    try {
      const loanPayload: LoanDto = {
        idCliente: Number(clientDetails.idCliente),
        monto: amount,
        tasaInteresAnual: interest,
        numeroCuotas: installments,
        fechaPrestamo: loanState.loanDate,
      };

      // --- INICIO DE LA CORRECCIÓN ---
      // 1. Se llama al servicio y la respuesta (`newLoan`) ya tiene la estructura
      //    correcta (tipo `Loan`) que espera la página de detalles.
      const newLoan = await loanService.registerLoan(loanPayload);
      toast.success(`Préstamo #${newLoan.idPrestamo} registrado exitosamente.`);

      // 2. Se pasa el objeto `newLoan` directamente en la navegación.
      //    No es necesario construir un objeto intermedio.
      navigate(`/loans/${newLoan.idPrestamo}`, { state: { loan: newLoan } });
      // --- FIN DE LA CORRECCIÓN ---
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al registrar el préstamo: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingClientDetails) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando información del cliente...</p>
      </div>
    );
  }

  if (!clientDetails) return null;

  const areClientFieldsDisabled = !clientDetails.esNuevo || isClientRegistered;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Registrar Nuevo Préstamo
          </h1>
          <p className="text-muted-foreground">
            Complete la información del préstamo
          </p>
        </div>
      </div>

      <Card
        className="border-0"
        style={{
          background: "var(--gradient-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Información del Cliente</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clientDetails.tipo === "JURIDICA" ? (
               /* --- FORMULARIO PERSONA JURIDICA --- */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">
                      RUC
                    </Label>
                    <Input
                       id="ruc"
                       value={formState.ruc || clientDetails.ruc || ""} 
                       onChange={handleFormChange}
                       className="mt-2 h-12 text-base font-bold"
                       disabled={areClientFieldsDisabled || !!clientDetails.ruc} // RUC suele ser inmutable si ya viene
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Razón Social
                    </Label>
                    <Input
                       id="razonSocial"
                       value={formState.razonSocial} 
                       onChange={handleFormChange}
                       className="mt-2 h-12 text-base font-bold"
                       disabled={areClientFieldsDisabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30">
                   <div>
                    <Label htmlFor="direccionFiscal" className="text-sm font-semibold text-muted-foreground">
                      Dirección Fiscal
                    </Label>
                    <Input
                      id="direccionFiscal"
                      value={formState.direccionFiscal || ""}
                      onChange={handleFormChange}
                      className="mt-2 h-12 text-base"
                      disabled={areClientFieldsDisabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fechaConstitucion" className="text-sm font-semibold text-muted-foreground">
                      Fecha de Constitución
                    </Label>
                    <Input
                      id="fechaConstitucion"
                      type="date"
                      value={formState.fechaConstitucion || ""}
                      onChange={handleFormChange}
                      className="mt-2 h-12 text-base"
                      disabled={areClientFieldsDisabled}
                    />
                  </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30">
                   <div>
                    <Label htmlFor="representanteLegalDni" className="text-sm font-semibold text-muted-foreground">
                      DNI Representante Legal
                    </Label>
                    <Input
                      id="representanteLegalDni"
                      value={formState.representanteLegalDni || ""}
                      onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                         setFormState(prev => ({...prev, representanteLegalDni: val}));
                      }}
                      className="mt-2 h-12 text-base"
                      disabled={areClientFieldsDisabled}
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="representanteLegalNombre" className="text-sm font-semibold text-muted-foreground">
                      Nombre Representante Legal
                    </Label>
                    <Input
                      id="representanteLegalNombre"
                      value={formState.representanteLegalNombre || ""}
                      onChange={handleFormChange}
                      className="mt-2 h-12 text-base"
                      disabled={areClientFieldsDisabled}
                    />
                  </div>
                </div>
                 {/* Reutilizamos campos comunes si es necesario, e.g. telefono/correo de contacto de la empresa */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30">
                    <div>
                    <Label htmlFor="correoCliente" className="text-sm font-semibold text-muted-foreground">
                      Correo Electrónico (Contacto)
                    </Label>
                    <Input
                      id="correoCliente"
                      type="email"
                      value={formState.correoCliente}
                      onChange={handleFormChange}
                      className="mt-2 h-12 text-base"
                      disabled={areClientFieldsDisabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefonoCliente" className="text-sm font-semibold text-muted-foreground">
                      Teléfono (Contacto)
                    </Label>
                    <Input
                      id="telefonoCliente"
                      type="tel"
                      value={formState.telefonoCliente}
                      onChange={handleFormChange}
                      className="mt-2 h-12 text-base"
                      disabled={areClientFieldsDisabled}
                      maxLength={9}
                    />
                  </div>
                 </div>

              </div>
            ) : (
                /* --- FORMULARIO PERSONA NATURAL (EXISTENTE) --- */
              <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-secondary/30">
            {/* ...resto del form natural... */}
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  DNI
                </Label>
                <p className="text-2xl font-bold text-foreground">
                  {clientDetails.dniCliente}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Nombre
                </Label>
                <p className="text-2xl font-bold text-foreground">
                  {clientDetails.nombreCliente}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Apellido
                </Label>
                <p className="text-2xl font-bold text-foreground">
                  {clientDetails.apellidoCliente}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30">
              <div>
                <Label
                  htmlFor="direccionCliente"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Dirección
                </Label>
                <Input
                  id="direccionCliente"
                  type="text"
                  value={formState.direccionCliente}
                  onChange={handleFormChange}
                  className="mt-2 h-12 text-base"
                  disabled={areClientFieldsDisabled}
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="fechaNacimiento"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Fecha de Nacimiento
                </Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formState.fechaNacimiento}
                  onChange={handleFormChange}
                  className="mt-2 h-12 text-base"
                  disabled={areClientFieldsDisabled}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30">
              <div>
                <Label
                  htmlFor="correoCliente"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Correo Electrónico
                </Label>
                <Input
                  id="correoCliente"
                  type="email"
                  value={formState.correoCliente}
                  onChange={handleFormChange}
                  className="mt-2 h-12 text-base"
                  disabled={areClientFieldsDisabled}
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="telefonoCliente"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Teléfono
                </Label>
                <Input
                  id="telefonoCliente"
                  type="tel"
                  value={formState.telefonoCliente}
                  onChange={handleFormChange}
                  className="mt-2 h-12 text-base"
                  disabled={areClientFieldsDisabled}
                  required
                  maxLength={9}
                />
              </div>
            </div>
             <div className="flex items-center gap-4 p-6 rounded-2xl bg-secondary/30 border border-primary/20">
              <Checkbox
                id="esPep"
                checked={formState.esPep}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, esPep: !!checked }))
                }
                className="h-5 w-5"
                disabled={areClientFieldsDisabled}
              />
              <div className="flex-1">
                <Label
                  htmlFor="esPep"
                  className="cursor-pointer font-semibold text-base"
                >
                  Cliente es Persona Expuesta Políticamente (PEP)
                </Label>
              </div>
              {formState.esPep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadPEP}
                  className="gap-2 flex-shrink-0 border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Printer className="h-4 w-4" />
                  Declaración PEP
                </Button>
              )}
            </div>
            </>
            )}
            {!isClientRegistered && (
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={handleRegisterClient}
                  className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg gap-2"
                  disabled={loading}
                >
                  <UserPlus className="h-5 w-5" />
                  {loading ? "Guardando..." : "Guardar Cliente"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div
        className={`${
          !isClientRegistered ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <Card
          className="border-0"
          style={{
            background: "var(--gradient-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Detalles del Préstamo</CardTitle>
                <CardDescription className="text-base">
                  Préstamo de libre disponibilidad a 30 días
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitLoan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base font-semibold">
                    Monto del Préstamo (S/)
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={loanState.amount}
                      onChange={handleLoanChange}
                      required
                      min="0"
                      step="0.01"
                      className="h-12 text-base"
                    />
                    {exceedsUIT && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadUITDeclaration}
                        className="gap-2 flex-shrink-0 border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <Printer className="h-4 w-4" />
                        Declaración
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="interestRate"
                    className="text-base font-semibold"
                  >
                    Interés Anual (%)
                  </Label>
                  <Input
                    id="interestRate"
                    type="number"
                    placeholder="24"
                    value={loanState.interestRate}
                    onChange={handleLoanChange}
                    required
                    min="0"
                    step="0.01"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanDate" className="text-base font-semibold">
                    Fecha del Préstamo
                  </Label>
                  <Input
                    id="loanDate"
                    type="date"
                    value={loanState.loanDate}
                    onChange={handleLoanChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="installments"
                    className="text-base font-semibold"
                  >
                    Plazo (Número de Cuotas)
                  </Label>
                  <Input
                    id="installments"
                    type="number"
                    placeholder="1"
                    value={loanState.installments}
                    onChange={handleLoanChange}
                    required
                    min="1"
                    step="1"
                    className="h-12 text-base"
                  />
                </div>
              </div>
              {exceedsUIT && (
                <Alert className="border-primary/50 bg-primary/5">
                  <FileText className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm font-medium">
                    El monto supera 1 UIT (S/{" "}
                    {UIT_VALUE.toLocaleString("es-PE")}). Se requiere
                    declaración jurada.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !isClientRegistered}
                  className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Procesando..." : "Registrar Préstamo"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="h-14 px-8"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
