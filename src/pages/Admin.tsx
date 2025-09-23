import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Upload, Plus } from "lucide-react";

const ESPECIES_OPTIONS = [
  "Cães", "Gatos", "Bovinos", "Equinos", "Ovinos", "Aves", "Peixes", "Suínos", "Roedores"
];

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    principio_ativo: "",
    classe: "",
    especies: [] as string[],
    indicacao: "",
    metatags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEspecieToggle = (especie: string) => {
    setFormData(prev => ({
      ...prev,
      especies: prev.especies.includes(especie)
        ? prev.especies.filter(e => e !== especie)
        : [...prev.especies, especie]
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.metatags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        metatags: [...prev.metatags, newTag.trim().toLowerCase()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      metatags: prev.metatags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "Apenas arquivos JPG e PNG são aceitos",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('medicamentos-images')
        .upload(filePath, file);

      if (error) throw error;

      return data.path;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.nome.trim() || !formData.principio_ativo.trim() || 
        !formData.classe.trim() || formData.especies.length === 0 || 
        !formData.indicacao.trim() || formData.metatags.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let imagePath = null;
      
      // Upload image if provided
      if (imageFile) {
        imagePath = await uploadImage(imageFile);
        if (!imagePath) {
          throw new Error("Falha no upload da imagem");
        }
      }

      // Insert medicine
      const { error } = await supabase
        .from("medicamentos")
        .insert({
          nome: formData.nome.trim(),
          principio_ativo: formData.principio_ativo.trim(),
          classe: formData.classe.trim(),
          especies: formData.especies,
          indicacao: formData.indicacao.trim(),
          metatags: formData.metatags,
          imagem_path: imagePath,
        });

      if (error) throw error;

      toast({
        title: "Medicamento cadastrado!",
        description: "O medicamento foi adicionado com sucesso",
      });

      // Reset form
      setFormData({
        nome: "",
        principio_ativo: "",
        classe: "",
        especies: [],
        indicacao: "",
        metatags: [],
      });
      setImageFile(null);
      
      // Redirect to search
      navigate("/");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Cadastrar Medicamento</h1>
            <p className="text-muted-foreground mt-2">
              Adicione um novo medicamento veterinário ao sistema
            </p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Informações do Medicamento</CardTitle>
              <CardDescription>
                Preencha todos os campos obrigatórios marcados com *
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: IZOOT B12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classe">Classe *</Label>
                    <Input
                      id="classe"
                      value={formData.classe}
                      onChange={(e) => setFormData(prev => ({ ...prev, classe: e.target.value }))}
                      placeholder="Ex: Antibiótico"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="principio_ativo">Princípio Ativo *</Label>
                  <Input
                    id="principio_ativo"
                    value={formData.principio_ativo}
                    onChange={(e) => setFormData(prev => ({ ...prev, principio_ativo: e.target.value }))}
                    placeholder="Ex: Imodicarb + Vitamina B12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Espécies * (selecione pelo menos 1)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ESPECIES_OPTIONS.map((especie) => (
                      <div key={especie} className="flex items-center space-x-2">
                        <Checkbox
                          id={especie}
                          checked={formData.especies.includes(especie)}
                          onCheckedChange={() => handleEspecieToggle(especie)}
                        />
                        <label htmlFor={especie} className="text-sm">
                          {especie}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indicacao">Indicação *</Label>
                  <Textarea
                    id="indicacao"
                    value={formData.indicacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, indicacao: e.target.value }))}
                    placeholder="Ex: Babésia; Anaplasmose; Tristeza parasitária; Apatia; Anorexia; Abatimento."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Metatags * (adicione pelo menos 1)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Digite uma tag e pressione +"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.metatags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Imagem (opcional)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                    <div className="text-sm text-muted-foreground">
                      Max: 5MB • JPG, PNG
                    </div>
                  </div>
                  {imageFile && (
                    <div className="text-sm text-success">
                      ✓ {imageFile.name} selecionado
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar Medicamento
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}