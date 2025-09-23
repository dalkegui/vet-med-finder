import { useState, useEffect } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { MedicineCard } from "@/components/medicine/MedicineCard";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-medicine.jpg";

interface Medicamento {
  id: string;
  nome: string;
  principio_ativo: string;
  classe: string;
  especies: string[];
  indicacao: string;
  metatags: string[];
  imagem_path?: string;
  created_at: string;
}

const Index = () => {
  const [medicines, setMedicines] = useState<Medicamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = async (query: string, especies: string[]) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      let searchQuery = supabase
        .from("medicamentos")
        .select("*");

      // Apply text search if query is provided
      if (query.trim()) {
        // Use full-text search with fallback to trigram similarity
        searchQuery = searchQuery.or(
          `search_vector.fts.${query.trim()},nome.ilike.%${query.trim()}%,principio_ativo.ilike.%${query.trim()}%,indicacao.ilike.%${query.trim()}%`
        );
      }

      // Apply species filter if provided
      if (especies.length > 0) {
        searchQuery = searchQuery.overlaps("especies", especies);
      }

      // Order by name for now (could implement ranking later)
      searchQuery = searchQuery.order("nome");

      const { data, error } = await searchQuery;

      if (error) throw error;

      setMedicines(data || []);
      
      if (data?.length === 0) {
        toast({
          title: "Nenhum resultado encontrado",
          description: "Tente usar termos diferentes ou cadastre um novo medicamento.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Erro na busca",
        description: "Ocorreu um erro ao buscar medicamentos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {!hasSearched ? (
          // Hero Section
          <div className="space-y-12 text-center">
            <div className="space-y-4 max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold">
                Sistema de Busca de{" "}
                <span className="bg-gradient-medical bg-clip-text text-transparent">
                  Medicamentos Veterinários
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Encontre rapidamente medicamentos por doença, sintoma ou princípio ativo
              </p>
            </div>

            <div className="max-w-2xl mx-auto rounded-lg overflow-hidden shadow-medical">
              <img
                src={heroImage}
                alt="Sistema de medicamentos veterinários"
                className="w-full h-64 object-cover"
              />
            </div>

            <div className="space-y-8">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {user && (
                  <Link to="/admin">
                    <Button size="lg" className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Cadastrar Medicamento
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => handleSearch("", [])}
                  className="flex items-center gap-2"
                >
                  <Search className="h-5 w-5" />
                  Ver Todos os Medicamentos
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="space-y-4 p-6 rounded-lg bg-card shadow-card">
                <div className="text-3xl font-bold text-primary">1000+</div>
                <div className="font-medium">Medicamentos</div>
                <div className="text-sm text-muted-foreground">
                  Base abrangente de medicamentos veterinários
                </div>
              </div>
              <div className="space-y-4 p-6 rounded-lg bg-card shadow-card">
                <div className="text-3xl font-bold text-accent">9</div>
                <div className="font-medium">Espécies</div>
                <div className="text-sm text-muted-foreground">
                  Cobertura completa para diferentes animais
                </div>
              </div>
              <div className="space-y-4 p-6 rounded-lg bg-card shadow-card">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="font-medium">Disponível</div>
                <div className="text-sm text-muted-foreground">
                  Acesso ininterrupto ao sistema
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Search Results
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Resultados da Busca</h2>
                <p className="text-muted-foreground">
                  {medicines.length} medicamento{medicines.length !== 1 ? "s" : ""} encontrado{medicines.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setHasSearched(false);
                  setMedicines([]);
                }}
              >
                Nova Busca
              </Button>
            </div>

            <SearchBar onSearch={handleSearch} isLoading={isLoading} />

            {medicines.length === 0 && !isLoading ? (
              <div className="text-center py-12 space-y-4">
                <div className="text-6xl">🔍</div>
                <h3 className="text-xl font-medium">Nenhum medicamento encontrado</h3>
                <p className="text-muted-foreground">
                  Tente usar termos diferentes ou cadastre um novo medicamento.
                </p>
                {user && (
                  <Link to="/admin">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Medicamento
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {medicines.map((medicine) => (
                  <MedicineCard
                    key={medicine.id}
                    medicine={medicine}
                    showActions={!!user}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
