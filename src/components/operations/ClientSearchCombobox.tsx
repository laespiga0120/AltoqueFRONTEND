import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, User, Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { clientService, ClientSearchResult } from '@/api/clientService';

interface ClientSearchComboboxProps {
    onSelect: (client: ClientSearchResult | null) => void;
    selectedClient: ClientSearchResult | null;
}

export function ClientSearchCombobox({ onSelect, selectedClient }: ClientSearchComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ClientSearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                // El servicio ahora se encarga del log y el mapeo
                const data = await clientService.searchClients(query);
                setResults(data);
            } catch (error) {
                console.error("Error en componente search:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Helper para mostrar el nombre correcto (Jurídica vs Natural)
    const getDisplayName = (client: ClientSearchResult) => {
        if (client.tipo === 'JURIDICA' && client.razonSocial) {
            return client.razonSocial;
        }
        // Fallback robusto: concatena lo que haya
        return `${client.nombreCliente || ''} ${client.apellidoCliente || ''}`.trim() || client.razonSocial || "Sin Nombre";
    };

    const getDisplayDocument = (client: ClientSearchResult) => {
        if (client.ruc) return `RUC: ${client.ruc}`;
        if (client.dniCliente) return `DNI: ${client.dniCliente}`;
        return "S/D";
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-14 text-base bg-card"
                >
                    {selectedClient ? (
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                {selectedClient.tipo === 'JURIDICA' ? (
                                    <Building2 className="h-4 w-4 text-primary" />
                                ) : (
                                    <User className="h-4 w-4 text-primary" />
                                )}
                            </div>
                            <div className="text-left">
                                <p className="font-semibold">{getDisplayName(selectedClient)}</p>
                                <p className="text-sm text-muted-foreground">
                                    {getDisplayDocument(selectedClient)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Buscar por DNI o RUC
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-popover" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Escriba para buscar..."
                        value={query}
                        onValueChange={setQuery}
                        className="h-12"
                    />
                    <CommandList>
                        {loading && (
                            <div className="py-6 flex justify-center text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Buscando en BD...
                            </div>
                        )}
                        
                        {!loading && query.length >= 2 && results.length === 0 && (
                            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                        )}

                        <CommandGroup heading="Resultados">
                            {results.map((client) => (
                                <CommandItem
                                    key={client.idCliente} // Usamos idCliente mapeado
                                    value={`${client.idCliente}`}
                                    onSelect={() => {
                                        onSelect(client);
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                    className="py-3 cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedClient?.idCliente === client.idCliente ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">{getDisplayName(client)}</p>
                                            {client.tipo === 'JURIDICA' && (
                                                <Building2 className="h-3 w-3 text-muted-foreground ml-2 inline" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {getDisplayDocument(client)}
                                        </p>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}