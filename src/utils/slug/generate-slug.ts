export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
    .replace(/\s+/g, "_") // Reemplazar espacios con guión bajo
    .replace(/[^a-z0-9_]/g, "") // Eliminar caracteres especiales (excepto _)
    .replace(/^_+|_+$/g, ""); // Eliminar guiones bajos al inicio y final
};
