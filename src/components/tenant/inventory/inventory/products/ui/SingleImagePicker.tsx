// components/ui/SingleImagePicker.tsx
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, ImageIcon, Plus, Loader2, X, Library } from "lucide-react";
import { cn } from "@/lib/utils";

interface SingleImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  // Añadimos esta prop opcional para pasarle las fotos del producto base
  existingImages?: string[];
}

export function SingleImagePicker({
  value,
  onChange,
  disabled,
  existingImages = [],
}: SingleImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simulación: aquí deberías subir a tu servidor/Cloudinary
    const objectUrl = URL.createObjectURL(file);

    setTimeout(() => {
      onChange(objectUrl);
      setIsUploading(false);
      setIsOpen(false);
    }, 600);
  };

  return (
    <>
      {/* TRIGGER: Miniatura en la tabla */}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={cn(
          "relative group w-10 h-10 rounded-md border-2 border-dashed flex items-center justify-center overflow-hidden transition-all shrink-0 bg-muted",
          disabled
            ? "opacity-40 cursor-not-allowed"
            : "hover:border-primary cursor-pointer border-muted-foreground/30",
        )}
      >
        {value ? (
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <Plus className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="w-5 h-5" /> Multimedia de Variante
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Subir</TabsTrigger>
              <TabsTrigger value="library">Galería</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>

            {/* PESTAÑA 1: GALERÍA (Imágenes ya existentes) */}
            <TabsContent value="library" className="py-4">
              <div className="grid grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {existingImages.length > 0 ? (
                  existingImages.map((img, i) => (
                    <div
                      key={i}
                      className={cn(
                        "relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 hover:border-primary transition-all",
                        value === img
                          ? "border-primary ring-2 ring-primary ring-offset-1"
                          : "border-transparent",
                      )}
                      onClick={() => {
                        onChange(img);
                        setIsOpen(false);
                      }}
                    >
                      <img
                        src={img}
                        className="w-full h-full object-cover"
                        alt={`Gallery ${i}`}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 py-10 text-center text-muted-foreground text-sm">
                    No hay imágenes previas en este producto.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* PESTAÑA 2: SUBIR ARCHIVO */}
            <TabsContent value="upload" className="py-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center hover:bg-accent/50 cursor-pointer transition-all"
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Seleccionar archivo</p>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </TabsContent>

            {/* PESTAÑA 3: URL */}
            <TabsContent value="url" className="py-4 space-y-3">
              <Input
                placeholder="Pegar enlace de imagen..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={!urlInput}
                onClick={() => {
                  onChange(urlInput);
                  setIsOpen(false);
                  setUrlInput("");
                }}
              >
                Usar enlace
              </Button>
            </TabsContent>
          </Tabs>

          {value && (
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
              >
                <X className="w-4 h-4 mr-2" /> Quitar imagen
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
