import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, User } from 'lucide-react';
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
import { ClientAccount } from '@/types/operations';
import { searchClients, formatCurrency } from '@/lib/operationsData';

interface ClientSearchComboboxProps {
    onSelect: (client: ClientAccount | null) => void;
    selectedClient: ClientAccount | null;
}

export function ClientSearchCombobox({ onSelect, selectedClient }: ClientSearchComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ClientAccount[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        const timer = setTimeout(() => {
            const found = searchClients(query);
            setResults(found);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

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
                                <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold">{selectedClient.clientName}</p>
                                <p className="text-sm text-muted-foreground">DNI: {selectedClient.clientDNI}</p>
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Buscar por DNI o nombre...
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-popover" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Ingrese DNI o nombre del cliente..."
                        value={query}
                        onValueChange={setQuery}
                        className="h-12"
                    />
                    <CommandList>
                        {loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Buscando...
                            </div>
                        )}
                        {!loading && query.length >= 2 && results.length === 0 && (
                            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                        )}
                        {!loading && query.length < 2 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Ingrese al menos 2 caracteres para buscar
                            </div>
                        )}
                        {results.length > 0 && (
                            <CommandGroup heading="Resultados">
                                {results.map((client) => (
                                    <CommandItem
                                        key={client.clientDNI}
                                        value={client.clientDNI}
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
                                                selectedClient?.clientDNI === client.clientDNI ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">{client.clientName}</p>
                                                {client.totalDebt > 0 && (
                                                    <span className="text-sm font-mono font-bold text-destructive">
                                                        {formatCurrency(client.totalDebt)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">DNI: {client.clientDNI}</p>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}