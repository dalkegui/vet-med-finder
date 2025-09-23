import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface SearchBarProps {
  onSearch: (query: string, especies: string[]) => void;
  isLoading?: boolean;
}

const ESPECIES_OPTIONS = [
  "Cães",
  "Gatos", 
  "Bovinos",
  "Equinos",
  "Ovinos",
  "Aves",
  "Peixes",
  "Suínos",
  "Roedores",
];

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [selectedEspecies, setSelectedEspecies] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, selectedEspecies);
  };

  const toggleEspecie = (especie: string) => {
    setSelectedEspecies(prev => 
      prev.includes(especie) 
        ? prev.filter(e => e !== especie)
        : [...prev, especie]
    );
  };

  const clearFilters = () => {
    setSelectedEspecies([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Digite doença, sintoma ou medicamento..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {selectedEspecies.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedEspecies.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtrar por Espécies</h4>
                {selectedEspecies.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ESPECIES_OPTIONS.map((especie) => (
                  <div key={especie} className="flex items-center space-x-2">
                    <Checkbox
                      id={especie}
                      checked={selectedEspecies.includes(especie)}
                      onCheckedChange={() => toggleEspecie(especie)}
                    />
                    <label
                      htmlFor={especie}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {especie}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Buscando..." : "Buscar"}
        </Button>
      </form>
      
      {selectedEspecies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {selectedEspecies.map((especie) => (
            <Badge key={especie} variant="outline" className="flex items-center gap-1">
              {especie}
              <button
                onClick={() => toggleEspecie(especie)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}