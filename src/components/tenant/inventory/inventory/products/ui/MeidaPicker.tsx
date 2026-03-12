// components/inventory/MediaPicker.tsx
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
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MediaPickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function MediaPicker({ value = [], onChange }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls = Array.from(files).map((file) => URL.createObjectURL(file));

    setTimeout(() => {
      onChange([...value, ...newUrls]);
      setIsUploading(false);
      setIsOpen(false);
    }, 800);
  };

  const toggleLibraryImage = (url: string) => {
    if (value.includes(url)) {
      onChange(value.filter((item) => item !== url));
    } else {
      onChange([...value, url]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3 w-full">
      <div
        className={cn(
          "w-full min-h-[200px] p-4 border-2 border-dashed rounded-xl bg-muted/20 transition-all",
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 items-start",
        )}
      >
        {value.map((url, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden border bg-background group"
          >
            <Image
              src={url}
              alt={`Imagen ${index}`}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:bg-primary/5 hover:border-primary/50 transition-colors",
            value.length === 0 ? "col-span-full h-40" : "h-full",
          )}
        >
          <Plus className="w-6 h-6 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Añadir
          </span>
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Añadir a la galería</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="w-4 h-4" /> Subir
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-2">
                <ImageIcon className="w-4 h-4" /> Librería
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-2">
                <LinkIcon className="w-4 h-4" /> URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="py-8">
              <div
                onClick={handleUploadClick}
                className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center hover:bg-accent cursor-pointer transition-all"
              >
                {isUploading ? (
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium text-center">
                      Haz clic para seleccionar archivos locales
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </TabsContent>

            <TabsContent value="library" className="py-4">
              <div className="grid grid-cols-3 gap-3 max-h-[350px] overflow-y-auto p-1">
                {/* Aquí simulas las imágenes de tu BD */}
                {[1, 2, 3, 4, 5, 6].map((i) => {
                  const imgUrl = `https://picsum.photos/seed/${i + 50}/600`;
                  const isSelected = value.includes(imgUrl);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "relative aspect-square rounded-md overflow-hidden cursor-pointer border-4 transition-all",
                        isSelected
                          ? "border-primary"
                          : "border-transparent hover:border-primary/30",
                      )}
                      onClick={() => toggleLibraryImage(imgUrl)}
                    >
                      <Image
                        src={imgUrl}
                        alt="Library"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-white rounded-full p-1">
                            <Plus className="w-4 h-4 rotate-45" />{" "}
                            {/* O un check */}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setIsOpen(false)}>Listo</Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="py-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">
                  Introduce el enlace de la imagen
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    // Permitir añadir al presionar "Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (urlInput) {
                          onChange([...value, urlInput]);
                          setUrlInput("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    disabled={!urlInput}
                    onClick={() => {
                      onChange([...value, urlInput]);
                      setUrlInput(""); // Limpiamos para la siguiente URL
                      // No cerramos el modal para que pueda añadir otra
                    }}
                  >
                    Añadir
                  </Button>
                </div>
              </div>

              {/* Mini previsualización de lo que se va a añadir */}
              {urlInput && (
                <div className="relative w-full h-32 rounded-lg border overflow-hidden bg-secondary/10">
                  <Image
                    src={urlInput}
                    alt="Previsualización URL"
                    fill
                    className="object-contain"
                    unoptimized // Útil para previsualizar URLs externas antes de guardarlas
                  />
                </div>
              )}

              <div className="mt-4 flex justify-end border-t pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Finalizar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
