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
  FileText,
  Printer,
  Sparkles,
  ArrowLeft,
  UserPlus,
  Loader2,
  Building2,
  User
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
  
  // Estado unificado del formulario
  const [formState, setFormState] = useState({
    // Persona Natural
    direccionCliente: "",
    fechaNacimiento: "",
    correoCliente: "",
    telefonoCliente: "",
    esPep: false,
    // Persona Jurídica
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

  const exceedsUIT = parseFloat(loanState.amount || "0") > UIT_VALUE;

  useEffect(() => {
    // Validación: debe tener DNI o RUC en el summary que viene del Dashboard
    const documentId = clientSummary?.ruc || clientSummary?.dniCliente;

    if (!documentId) {
      toast.error("No se ha proporcionado un documento de identidad válido.");
      navigate("/");
      return;
    }

    const fetchClientDetails = async () => {
      try {
        setLoadingClientDetails(true);
        
        // --- CORRECCIÓN: Usar endpoint unificado "detalles/{doc}" ---
        // El backend sabe si es DNI o RUC por la longitud y devuelve el DTO correcto.
        const data = await clientService.getDetailsByDocument(documentId);

        setClientDetails(data);
        
        // Mapeo inicial de datos al formulario
        setFormState({
          // Natural
          direccionCliente: data.direccionCliente || "",
          fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.split("T")[0] : "",
          correoCliente: data.correoCliente || "",
          telefonoCliente: data.telefonoCliente || "",
          esPep: data.esPep || false,
          // Jurídica
          ruc: data.ruc || "",
          razonSocial: data.razonSocial || "",
          direccionFiscal: data.direccionFiscal || "",
          fechaConstitucion: data.fechaConstitucion ? data.fechaConstitucion.split("T")[0] : "",
          representanteLegalDni: data.representanteLegalDni || "",
          representanteLegalNombre: data.representanteLegalNombre || "",
          cargoRepresentante: "", 
        });

        // Si esNuevo es false, significa que ya existe en BD
        if (!data.esNuevo) {
          setIsClientRegistered(true);
          toast.info("Cliente registrado. Información cargada.");
        } else {
            toast.info(data.tipo === 'JURIDICA' 
                ? "Empresa nueva. Por favor complete el registro." 
                : "Cliente nuevo. Por favor complete el registro.");
        }

      } catch (error) {
        console.error(error);
        toast.error("No se pudo cargar la información. Intente de nuevo.");
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
      toast.error("No se pudo generar el documento.");
    }
  };

  const handleRegisterClient = async () => {
    if (!clientDetails) return;
    
    const isJuridica = clientDetails.tipo === "JURIDICA";

    // --- VALIDACIÓN DE CAMPOS ---
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
      // Persona Natural
      if (
        !formState.direccionCliente ||
        !formState.fechaNacimiento ||
        !formState.correoCliente ||
        !formState.telefonoCliente
      ) {
        toast.error("Todos los campos son obligatorios.");
        return;
      }
      if (!isOfLegalAge(formState.fechaNacimiento)) {
        toast.error("El cliente debe ser mayor de 18 años.");
        return;
      }
    }

    // Validaciones comunes
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.correoCliente)) {
      toast.error("Ingrese un correo válido.");
      return;
    }
    if (!/^\d{9}$/.test(formState.telefonoCliente)) {
      toast.error("El teléfono debe tener 9 dígitos.");
      return;
    }

    setLoading(true);
    try {
      // Preparamos el payload combinando el objeto base con el estado del formulario
      const payload: Partial<ClientDetail> = {
        ...clientDetails,
        ...formState,
        // Aseguramos que el tipo no se pierda
        tipo: clientDetails.tipo 
      };
      
      const registeredClient = await clientService.registerOrUpdate(payload);
      setClientDetails({
        ...registeredClient,
        tipo: clientDetails.tipo // Importante: Preservar el tipo original por si el backend no lo devuelve
      });
      setIsClientRegistered(true);
      toast.success(
          isJuridica 
            ? "Empresa registrada correctamente." 
            : "Cliente registrado correctamente."
      );
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
      toast.error("Error: ID de cliente no válido. Guarde la información primero.");
      return;
    }
    if (!isClientRegistered) {
      toast.warning("Por favor, guarde la información del cliente antes de continuar.");
      return;
    }

    const amount = parseFloat(loanState.amount);
    const interest = parseFloat(loanState.interestRate);
    const installments = parseInt(loanState.installments, 10);

    // Validaciones numéricas básicas
    if (amount <= 0 || isNaN(amount)) { toast.error("Monto inválido."); return; }
    if (interest <= 0 || isNaN(interest)) { toast.error("Interés inválido."); return; }
    if (installments <= 0 || isNaN(installments)) { toast.error("Plazo inválido."); return; }

    setLoading(true);
    try {
      const loanPayload: LoanDto = {
        idCliente: Number(clientDetails.idCliente), // Aseguramos conversión a número
        monto: amount,
        tasaInteresAnual: interest,
        numeroCuotas: installments,
        fechaPrestamo: loanState.loanDate,
      };

      const newLoan = await loanService.registerLoan(loanPayload);
      toast.success(`Préstamo #${newLoan.idPrestamo} registrado.`);
      
      // Navegar a detalles con el objeto completo
      navigate(`/loans/${newLoan.idPrestamo}`, { state: { loan: newLoan } });

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al registrar préstamo: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingClientDetails) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando información...</p>
      </div>
    );
  }

  if (!clientDetails) return null;

  const isJuridica = clientDetails.tipo === "JURIDICA";
  const areFieldsDisabled = !clientDetails.esNuevo || isClientRegistered;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isClientRegistered ? "Registrar Nuevo Préstamo" : "Registro de Cliente"}
          </h1>
          <p className="text-muted-foreground">
            {isJuridica ? "Persona Jurídica" : "Persona Natural"}
          </p>
        </div>
      </div>

      {/* TARJETA DE INFORMACIÓN DEL CLIENTE */}
      <Card className="border-0 shadow-lg" style={{ background: "var(--gradient-card)" }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              {isJuridica ? <Building2 className="h-6 w-6 text-primary" /> : <User className="h-6 w-6 text-primary" />}
            </div>
            <div>
              <CardTitle className="text-xl">
                 {isJuridica ? "Datos de la Empresa" : "Datos Personales"}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* --- RENDERIZADO CONDICIONAL: JURÍDICA vs NATURAL --- */}
            {isJuridica ? (
              /* FORMULARIO PERSONA JURÍDICA */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">RUC</Label>
                    <Input
                       id="ruc"
                       value={formState.ruc || clientDetails.ruc || ""} 
                       onChange={handleFormChange}
                       className="mt-2 h-12 text-base font-bold"
                       disabled={true} // El RUC no se edita, viene de la búsqueda
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Razón Social</Label>
                    <Input
                       id="razonSocial"
                       value={formState.razonSocial} 
                       onChange={handleFormChange}
                       className="mt-2 h-12 text-base font-bold"
                       disabled={areFieldsDisabled}
                       placeholder="Nombre de la empresa S.A.C."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30">
                   <div>
                    <Label htmlFor="direccionFiscal" className="text-sm font-semibold text-muted-foreground">Dirección Fiscal</Label>
                    <Input
                      id="direccionFiscal"
                      value={formState.direccionFiscal || ""}
                      onChange={handleFormChange}
                      className="mt-2 h-12 text-base"
                      disabled={areFieldsDisabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fechaConstitucion" className="text-sm font-semibold text-muted-foreground">Fecha de Constitución</Label>
                    <Input
                      id="fechaConstitucion"
                      type="date"
                      value={formState.fechaConstitucion || ""}
                      onChange={handleFormChange}
                      className="mt-2 h-12 text-base"
                      disabled={areFieldsDisabled}
                    />
                  </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30 border border-accent/20">
                   <div className="md:col-span-2 text-sm font-bold text-accent mb-2">REPRESENTANTE LEGAL</div>
                   <div>
                    <Label htmlFor="representanteLegalDni" className="text-sm font-semibold text-muted-foreground">DNI Representante</Label>
                    <Input
                      id="representanteLegalDni"
                      value={formState.representanteLegalDni || ""}
                      onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                         setFormState(prev => ({...prev, representanteLegalDni: val}));
                      }}
                      className="mt-2 h-12 text-base"
                      disabled={areFieldsDisabled}
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="representanteLegalNombre" className="text-sm font-semibold text-muted-foreground">Nombre Completo</Label>
                    <Input
                      id="representanteLegalNombre"
                      value={formState.representanteLegalNombre || ""}
                      onChange={handleFormChange}
                      className="mt-2 h-12 text-base"
                      disabled={areFieldsDisabled}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* FORMULARIO PERSONA NATURAL */
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-secondary/30">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">DNI</Label>
                    <p className="text-2xl font-bold text-foreground">{clientDetails.dniCliente}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Nombre</Label>
                    <p className="text-2xl font-bold text-foreground">{clientDetails.nombreCliente}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Apellido</Label>
                    <p className="text-2xl font-bold text-foreground">{clientDetails.apellidoCliente}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30">
                  <div>
                    <Label htmlFor="direccionCliente" className="text-sm font-semibold text-muted-foreground">Dirección</Label>
                    <Input
                      id="direccionCliente"
                      value={formState.direccionCliente}
                      onChange={handleFormChange}
                      className="mt-2 h-12 text-base"
                      disabled={areFieldsDisabled}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fechaNacimiento" className="text-sm font-semibold text-muted-foreground">Fecha de Nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={formState.fechaNacimiento}
                      onChange={handleFormChange}
                      className="mt-2 h-12 text-base"
                      disabled={areFieldsDisabled}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* --- CAMPOS COMUNES (CONTACTO) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30">
              <div>
                <Label htmlFor="correoCliente" className="text-sm font-semibold text-muted-foreground">Correo Electrónico</Label>
                <Input
                  id="correoCliente"
                  type="email"
                  value={formState.correoCliente}
                  onChange={handleFormChange}
                  className="mt-2 h-12 text-base"
                  disabled={areFieldsDisabled}
                  required
                />
              </div>
              <div>
                <Label htmlFor="telefonoCliente" className="text-sm font-semibold text-muted-foreground">Teléfono</Label>
                <Input
                  id="telefonoCliente"
                  type="tel"
                  value={formState.telefonoCliente}
                  onChange={handleFormChange}
                  className="mt-2 h-12 text-base"
                  disabled={areFieldsDisabled}
                  required
                  maxLength={9}
                />
              </div>
            </div>
            
            {/* PEP CHECKBOX (Solo Natural) */}
            {!isJuridica && (
               <div className="flex items-center gap-4 p-6 rounded-2xl bg-secondary/30 border border-primary/20">
                  <Checkbox
                    id="esPep"
                    checked={formState.esPep}
                    onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, esPep: !!checked }))}
                    className="h-5 w-5"
                    disabled={areFieldsDisabled}
                  />
                  <div className="flex-1">
                    <Label htmlFor="esPep" className="cursor-pointer font-semibold text-base">
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
            )}

            {/* Botón de Guardar Cliente (Solo si no está registrado) */}
            {!isClientRegistered && (
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={handleRegisterClient}
                  className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg gap-2"
                  disabled={loading}
                >
                  <UserPlus className="h-5 w-5" />
                  {loading ? "Guardando..." : "Guardar Información"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TARJETA DE DETALLES DEL PRÉSTAMO (Deshabilitada si no hay cliente registrado) */}
      <div className={`${!isClientRegistered ? "opacity-50 pointer-events-none grayscale" : ""}`}>
        <Card className="border-0 shadow-lg" style={{ background: "var(--gradient-card)" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Detalles del Préstamo</CardTitle>
                <CardDescription className="text-base">Configure las condiciones del crédito</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitLoan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base font-semibold">Monto del Préstamo (S/)</Label>
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
                  <Label htmlFor="interestRate" className="text-base font-semibold">Interés Anual (%)</Label>
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
                  <Label htmlFor="loanDate" className="text-base font-semibold">Fecha del Préstamo</Label>
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
                  <Label htmlFor="installments" className="text-base font-semibold">Plazo (Cuotas)</Label>
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
                    Monto superior a 1 UIT (S/ {UIT_VALUE.toLocaleString("es-PE")}). Se requiere declaración jurada.
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