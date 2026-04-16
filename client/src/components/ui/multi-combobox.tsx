"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import RingLoading from "../loading/Ring"

interface MultiComboboxProps {
    options: Array<{ value: string; label: string }>
    values: string[] | string
    onSearchChange?: (value: string) => void
    onValuesChange?: (values: string[] | string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    loading?: boolean
    disabled?: boolean
    multiple?: boolean
}

export function MultiCombobox({
    options,
    values = [],
    onSearchChange,
    onValuesChange,
    placeholder = "Seleccionar opciones...",
    searchPlaceholder = "Buscar...",
    emptyMessage = "No se encontraron opciones.",
    className,
    loading = false,
    disabled = false,
    multiple = true,
}: MultiComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange?.(search)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const handleSelect = (currentValue: string) => {
        if (multiple) {
            const currentValues = Array.isArray(values) ? values : [];
            const newValues = currentValues.includes(currentValue)
                ? currentValues.filter((value) => value !== currentValue)
                : [...currentValues, currentValue];
            onValuesChange?.(newValues);
        } else {
            // En modo único, si ya está seleccionado, lo deseleccionamos
            const currentValueStr = typeof values === 'string' ? values : '';
            const newValue = currentValueStr === currentValue ? '' : currentValue;
            onValuesChange?.(newValue);
            setOpen(false); // Cerrar el popover en modo único
        }
    };

    const handleRemove = (valueToRemove: string) => {
        if (multiple) {
            const currentValues = Array.isArray(values) ? values : [];
            const newValues = currentValues.filter((value) => value !== valueToRemove);
            onValuesChange?.(newValues);
        } else {
            onValuesChange?.('');
        }
    };

    // Mantener un estado interno de todas las opciones seleccionadas para mostrar los badges
    const [allSelectedOptions, setAllSelectedOptions] = React.useState<Array<{ value: string; label: string }>>([]);

    // Actualizar las opciones seleccionadas cuando cambian los values
    React.useEffect(() => {
        const currentValues = multiple 
            ? (Array.isArray(values) ? values : [])
            : (typeof values === 'string' && values ? [values] : []);
            
        const newSelectedOptions = currentValues.map(value => {
            // Buscar en las opciones actuales primero
            const currentOption = options.find(option => option.value === value);
            if (currentOption) return currentOption;
            
            // Si no está en las opciones actuales, buscar en las opciones previamente seleccionadas
            const previousOption = allSelectedOptions.find(option => option.value === value);
            if (previousOption) return previousOption;
            
            // Si no se encuentra, crear una opción temporal
            return { value, label: `Elemento ${value}` };
        });
        
        setAllSelectedOptions(newSelectedOptions);
    }, [values, options, multiple]);

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn("w-full justify-between min-h-10", className)}
                    >
                        {(() => {
                            if (multiple) {
                                const currentValues = Array.isArray(values) ? values : [];
                                return currentValues.length > 0 ? (
                                    <span className="truncate">
                                        {currentValues.length} seleccionado{currentValues.length !== 1 ? 's' : ''}
                                    </span>
                                ) : (
                                    placeholder
                                );
                            } else {
                                const currentValue = typeof values === 'string' ? values : '';
                                const displayLabel = currentValue
                                    ? (options.find(opt => opt.value === currentValue)?.label
                                        || allSelectedOptions.find(opt => opt.value === currentValue)?.label)
                                    : undefined;
                                return currentValue ? (
                                    <span className="truncate">
                                        {displayLabel || currentValue}
                                    </span>
                                ) : (
                                    placeholder
                                );
                            }
                        })()}
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <div className="p-2">
                        <Input 
                            placeholder={searchPlaceholder} 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)}
                            className="mb-2"
                        />
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <RingLoading color="primary" size={25} />
                            </div>
                        ) : options.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                                    <div className="max-h-60 overflow-y-auto">
                                {options.map((option) => {
                                    const isSelected = multiple 
                                        ? (Array.isArray(values) ? values.includes(option.value) : false)
                                        : (typeof values === 'string' ? values === option.value : false);
                                    
                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => handleSelect(option.value)}
                                            className={cn(
                                                "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm",
                                                isSelected && "bg-accent"
                                            )}
                                        >
                                            <CheckIcon
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
            
            {/* Mostrar elementos seleccionados solo en modo múltiple */}
            {multiple && allSelectedOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {allSelectedOptions.map((option) => (
                        <Badge
                            key={option.value}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                        >
                            {option.label}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto !px-0 hover:bg-transparent"
                                onClick={() => handleRemove(option.value)}
                            >
                                <X className="size-3.5" />
                            </Button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    )
}
