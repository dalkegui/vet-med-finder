import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ImageIcon } from "lucide-react";

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

interface MedicineCardProps {
  medicine: Medicamento;
  showActions?: boolean;
  onEdit?: (medicine: Medicamento) => void;
  onDelete?: (medicine: Medicamento) => void;
}

export function MedicineCard({ medicine, showActions = false, onEdit, onDelete }: MedicineCardProps) {
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    // Return Supabase storage URL for the image
    return `https://ktgvmmgiszumvdaamnhs.supabase.co/storage/v1/object/public/medicamentos-images/${imagePath}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card className="shadow-card hover:shadow-medical transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              <Link 
                to={`/medicine/${medicine.id}`}
                className="hover:text-primary transition-colors"
              >
                {medicine.nome}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1">
              <span className="font-medium text-primary">{medicine.classe}</span>
              {" • "}
              {medicine.principio_ativo}
            </CardDescription>
          </div>
          
          {showActions && (onEdit || onDelete) && (
            <div className="flex gap-1 ml-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(medicine)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(medicine)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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
                    parent.innerHTML = '<div class="text-muted-foreground"><svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                  }
                }}
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              {truncateText(medicine.indicacao, 120)}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {medicine.metatags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {medicine.metatags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{medicine.metatags.length - 4} mais
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">Espécies:</span>
            {medicine.especies.slice(0, 3).map((especie) => (
              <Badge key={especie} variant="outline" className="text-xs">
                {especie}
              </Badge>
            ))}
            {medicine.especies.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{medicine.especies.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}