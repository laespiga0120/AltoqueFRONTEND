import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  Mail,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle,
  ArrowLeft,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Loan, PaymentInstallment } from "../types/loan";
import { loanService } from "../api/loanService";
import { notificationService } from "../api/notificationService";
import { calculateLoanSchedule } from "../lib/scheduleCalculator";

export default function LoanDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loan, setLoan] = useState<Loan | null>(location.state?.loan || null);
  const [schedule, setSchedule] = useState<PaymentInstallment[]>([]);
  const [loading, setLoading] = useState(!location.state?.loan);
  const [isSending, setIsSending] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [scheduleSent, setScheduleSent] = useState(false);

  useEffect(() => {
    const fetchLoan = async () => {
      if (!id) {
        toast.error("ID de préstamo no válido.");
        navigate("/");
        return;
      }
      try {
        setLoading(true);
        const data = await loanService.getLoanById(id);
        setLoan(data);
      } catch (error) {
        toast.error("No se pudo cargar la información del préstamo.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    if (!loan) {
      fetchLoan();
    }
  }, [id, loan, navigate]);

  useEffect(() => {
    if (loan) {
      const calculatedSchedule = calculateLoanSchedule(
        loan.monto,
        loan.tasaInteresAnual,
        loan.fechaPrestamo,
        loan.numeroCuotas
      );
      setSchedule(calculatedSchedule);
      // Pre-popula el campo de email con el del cliente
      setCustomEmail(loan.cliente.correoCliente || "");
    }
  }, [loan]);

  // --- FUNCIÓN CONECTADA ---
  const handleDownloadDocuments = async () => {
    if (!loan) return;
    const toastId = toast.loading("Descargando documentos...");
    try {
      // Llama a ambos servicios de descarga en paralelo
      await Promise.all([
        loanService.downloadContractPdf(
          loan.idPrestamo,
          loan.cliente.dniCliente
        ),
        loanService.downloadSchedulePdf(
          loan.idPrestamo,
          loan.cliente.dniCliente
        ),
      ]);
      toast.success("Contrato y cronograma descargados.", { id: toastId });
    } catch (error) {
      toast.error("Error al descargar los documentos.", { id: toastId });
    }
  };

  // --- FUNCIÓN CONECTADA ---
  const handleSendSchedule = async () => {
    if (!loan || !loan.cliente.idCliente) {
      toast.error(
        "Faltan datos del cliente o del préstamo para enviar el correo."
      );
      return;
    }
    setIsSending(true);
    const toastId = toast.loading(`Enviando correo a ${customEmail}...`);
    try {
      await notificationService.sendDocumentsByEmail({
        clienteId: loan.cliente.idCliente,
        prestamoId: loan.idPrestamo,
        emailDestino: customEmail,
      });
      setScheduleSent(true);
      toast.success(`Correo enviado exitosamente.`, { id: toastId });
    } catch (error) {
      toast.error(`Error al enviar el correo: ${(error as Error).message}`, {
        id: toastId,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!loan) return null;

  const monthlyInterest = loan.tasaInteresAnual / 12;
  const totalPayment = schedule.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
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
              Cronograma de Pagos
            </h1>
            <p className="text-muted-foreground">
              Préstamo ID: {loan.idPrestamo}
            </p>
          </div>
        </div>
        <Badge className="text-sm px-4 py-2 bg-gradient-to-r from-primary to-accent text-white border-0 font-semibold shadow-lg">
          {loan.estado === "activo" ? "Activo" : "Pagado"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Información del Cliente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/30">
              <Label className="text-sm font-semibold text-muted-foreground">
                DNI
              </Label>
              <p className="text-xl font-bold text-foreground">
                {loan.cliente.dniCliente}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30">
              <Label className="text-sm font-semibold text-muted-foreground">
                Nombre Completo
              </Label>
              <p className="text-xl font-bold text-foreground">
                {`${loan.cliente.nombreCliente} ${loan.cliente.apellidoCliente}`}
              </p>
            </div>
            {loan.cliente.esPep && (
              <Badge className="border-primary/50 bg-primary/10 text-primary font-semibold">
                Cliente PEP
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card
          className="border-0"
          style={{
            background: "var(--gradient-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-xl">Detalles del Préstamo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/30 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Monto
                </Label>
                <p className="text-xl font-bold text-foreground">
                  S/{" "}
                  {loan.monto.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 flex items-center gap-3">
              <Percent className="h-5 w-5 text-accent" />
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Interés Anual
                </Label>
                <p className="text-xl font-bold text-foreground">
                  {loan.tasaInteresAnual}% ({monthlyInterest.toFixed(2)}%
                  mensual)
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Fecha del Préstamo
                </Label>
                <p className="text-base font-bold text-foreground">
                  {new Date(loan.fechaPrestamo).toLocaleDateString("es-PE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card
        className="border-0"
        style={{
          background: "var(--gradient-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Cronograma de Pagos</CardTitle>
              <CardDescription className="text-base">
                Plazo: {loan.numeroCuotas}{" "}
                {loan.numeroCuotas === 1 ? "cuota" : "cuotas"}
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadDocuments}
                className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
              >
                <Download className="h-4 w-4" />
                Descargar Documentos
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={scheduleSent || isSending}
                    className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <Mail className="h-4 w-4" />
                    {scheduleSent ? "Enviado" : "Enviar por Email"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Confirmar envío de correo
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Se enviarán el contrato y el cronograma a la siguiente
                      dirección. Puede modificarla si es necesario.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Correo del destinatario"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSendSchedule}
                      disabled={isSending}
                    >
                      {isSending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      {isSending ? "Enviando..." : "Confirmar Envío"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {scheduleSent && (
            <Alert className="border-primary/50 bg-primary/5">
              <CheckCircle className="h-5 w-5 text-primary" />
              <AlertDescription className="text-primary font-semibold text-base">
                ✓ Los documentos fueron enviados al correo del cliente.
              </AlertDescription>
            </Alert>
          )}
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                  <TableHead className="font-bold text-base">
                    N° Cuota
                  </TableHead>
                  <TableHead className="font-bold text-base">
                    Fecha de Vencimiento
                  </TableHead>
                  <TableHead className="font-bold text-base text-right">
                    Monto Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((payment) => (
                  <TableRow
                    key={payment.installmentNumber}
                    className="hover:bg-secondary/20"
                  >
                    <TableCell className="font-bold text-base">
                      {payment.installmentNumber}
                    </TableCell>
                    <TableCell className="text-base">
                      {new Date(payment.dueDate).toLocaleDateString("es-PE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg text-primary">
                      S/{" "}
                      {payment.amount.toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/20">
            <div className="text-right">
              <Label className="text-base font-semibold text-muted-foreground">
                Total a Pagar
              </Label>
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                S/{" "}
                {totalPayment.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
