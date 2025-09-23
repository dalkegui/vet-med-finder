import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash2, ImageIcon } from "lucide-react";
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
  updated_at: string;
}

export default function MedicineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState<Medicamento | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (id) {
      fetchMedicine();
    }
  }, [id]);

  const fetchMedicine = async () => {
    try {
      const { data, error } = await supabase
        .from("medicamentos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setMedicine(data);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({
        title: "Erro ao carregar medicamento",
        description: error.message || "Medicamento não encontrado",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!medicine) return;

    try {
      // Delete image from storage if exists
      if (medicine.imagem_path) {
        await supabase.storage
          .from('medicamentos-images')
          .remove([medicine.imagem_path]);
      }

      // Delete medicine record
      const { error } = await supabase
        .from("medicamentos")
        .delete()
        .eq("id", medicine.id);

      if (error) throw error;

      toast({
        title: "Medicamento excluído",
        description: "O medicamento foi removido com sucesso",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o medicamento",
        variant: "destructive",
      });
    }
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    return `https://ktgvmmgiszumvdaamnhs.supabase.co/storage/v1/object/public/medicamentos-images/${imagePath}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-lg">Carregando medicamento...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Medicamento não encontrado</h1>
            <Link to="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar à busca
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar à busca
              </Button>
            </Link>
            
            {user && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o medicamento "{medicine.nome}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-2xl">{medicine.nome}</CardTitle>
                  <CardDescription className="text-lg">
                    <span className="font-medium text-primary">{medicine.classe}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Princípio Ativo</h3>
                    <p className="text-muted-foreground">{medicine.principio_ativo}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Indicação</h3>
                    <p className="text-muted-foreground leading-relaxed">{medicine.indicacao}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Metatags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {medicine.metatags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Image */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Imagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center">
                    {medicine.imagem_path ? (
                      <img
                        src={getImageUrl(medicine.imagem_path)}
                        alt={medicine.nome}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="text-muted-foreground text-center">
                                <svg class="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p>Imagem não disponível</p>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="text-muted-foreground text-center">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                        <p>Sem imagem</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Species */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Espécies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {medicine.especies.map((especie) => (
                      <Badge key={especie} variant="outline">
                        {especie}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span>{formatDate(medicine.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atualizado em:</span>
                    <span>{formatDate(medicine.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}