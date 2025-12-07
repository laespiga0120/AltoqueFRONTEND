import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientSearchCombobox } from '@/components/operations/ClientSearchCombobox';
import { AccountStatusTable } from '@/components/operations/AccountStatusTable';
import { TransactionModal } from '@/components/operations/TransactionModal';
import { ClientAccount } from '@/types/operations';

export default function PaymentOperations() {
    const navigate = useNavigate();
    const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Button>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Operaciones de Caja
                    </h1>
                    <p className="text-muted-foreground">Procesa pagos y consulta estados de cuenta</p>
                </div>
            </div>

            {/* Client Search */}
            <Card
                className="border-0 overflow-hidden"
                style={{
                    background: 'var(--gradient-card)',
                    boxShadow: 'var(--shadow-card)'
                }}
            >
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                            <Receipt className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Buscar Cliente</CardTitle>
                            <CardDescription className="text-base">
                                Busca por DNI o nombre para ver el estado de cuenta
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ClientSearchCombobox
                        selectedClient={selectedClient}
                        onSelect={setSelectedClient}
                    />
                </CardContent>
            </Card>

            {/* Account Status */}
            {selectedClient && (
                <Card
                    className="border-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{
                        background: 'var(--gradient-card)',
                        boxShadow: 'var(--shadow-card)'
                    }}
                >
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg">
                                    <CreditCard className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Estado de Cuenta</CardTitle>
                                    <CardDescription className="text-base">
                                        {selectedClient.clientName} • DNI: {selectedClient.clientDNI}
                                    </CardDescription>
                                </div>
                            </div>
                            {selectedClient.totalDebt > 0 && (
                                <Button
                                    onClick={() => setPaymentModalOpen(true)}
                                    size="lg"
                                    className="gap-2 bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:opacity-90 transition-all"
                                >
                                    <CreditCard className="h-5 w-5" />
                                    Procesar Pago
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <AccountStatusTable account={selectedClient} />
                    </CardContent>
                </Card>
            )}

            {/* Payment Modal */}
            {selectedClient && (
                <TransactionModal
                    open={paymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    account={selectedClient}
                />
            )}
        </div>
    );
}
