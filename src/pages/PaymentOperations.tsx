import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientSearchCombobox } from '@/components/operations/ClientSearchCombobox';
import { AccountStatusTable } from '@/components/operations/AccountStatusTable';
import { TransactionModal } from '@/components/operations/TransactionModal';
import { ClientAccount } from '@/types/operations';
import { operationsService } from '@/api/operationsService';
import { ClientSearchResult } from '@/api/clientService'; // Importamos el tipo extendido
import { toast } from 'sonner';

export default function PaymentOperations() {
    const navigate = useNavigate();
    
    // Usamos el tipo correcto que incluye idCliente
    const [selectedClientData, setSelectedClientData] = useState<ClientSearchResult | null>(null);
    const [accountStatus, setAccountStatus] = useState<ClientAccount | null>(null);
    const [loadingAccount, setLoadingAccount] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    const fetchAccountStatus = async (clientId: number) => {
        setLoadingAccount(true);
        try {
            console.log(`🔍 Consultando estado de cuenta para ID: ${clientId}`);
            const status = await operationsService.getAccountStatusByClient(clientId);
            setAccountStatus(status);
        } catch (error) {
            console.error("Error fetching account status:", error);
            toast.error("No se pudo cargar el estado de cuenta", {
                description: "Verifique si el cliente tiene un préstamo activo."
            });
        } finally {
            setLoadingAccount(false);
        }
    };

    const handleClientSelect = async (client: ClientSearchResult | null) => {
        setSelectedClientData(client);
        setAccountStatus(null); 

        // Verificamos idCliente explícitamente
        if (client && client.idCliente) {
            await fetchAccountStatus(client.idCliente);
        }
    };

    const handlePaymentSuccess = () => {
        // Recargamos los datos SIN poner en null el estado anterior para evitar que el modal se cierre
        if (selectedClientData && selectedClientData.idCliente) {
             const clientId = selectedClientData.idCliente;
             // Ejecutamos la actualización en segundo plano (o con loading discreto si se prefiere)
             // pero IMPORTANTE: No llamamos a setAccountStatus(null) aquí.
             operationsService.getAccountStatusByClient(clientId)
                .then(status => setAccountStatus(status))
                .catch(err => console.error("Error refreshing data:", err));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Volver
                </Button>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Operaciones de Caja
                    </h1>
                    <p className="text-muted-foreground">Procesa pagos y consulta estados de cuenta</p>
                </div>
            </div>

            {/* Buscador */}
            <Card className="border-0 overflow-hidden" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                            <Receipt className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Buscar Cliente</CardTitle>
                            <CardDescription>Ingrese DNI, RUC o Nombre para consultar</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ClientSearchCombobox
                        selectedClient={selectedClientData}
                        onSelect={handleClientSelect}
                    />
                </CardContent>
            </Card>

            {/* Loading */}
            {loadingAccount && (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* Tabla de Estado */}
            {!loadingAccount && accountStatus && (
                <Card className="border-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg">
                                    <CreditCard className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Estado de Préstamo</CardTitle>
                                    <CardDescription>
                                        {accountStatus.clienteNombre} • {accountStatus.documento}
                                    </CardDescription>
                                </div>
                            </div>
                            {accountStatus.deudaPendienteTotal > 0 && (
                                <Button
                                    onClick={() => setPaymentModalOpen(true)}
                                    size="lg"
                                    className="gap-2 bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:opacity-90"
                                >
                                    <CreditCard className="h-5 w-5" />
                                    Procesar Pago
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <AccountStatusTable account={accountStatus} />
                    </CardContent>
                </Card>
            )}

            {/* Modal */}
            {accountStatus && (
                <TransactionModal
                    open={paymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    account={accountStatus}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}