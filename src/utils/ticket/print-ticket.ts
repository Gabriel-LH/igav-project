export const printTicket = (htmlContent: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // 1. Crear el iframe oculto
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      iframe.title = 'Printer Iframe';
      
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        document.body.removeChild(iframe);
        reject(new Error('No se pudo acceder al documento del iframe.'));
        return;
      }

      // 2. Inyectar contenido
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Imprimir Ticket</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; padding: 10px; font-family: monospace; display: flex; justify-content: center; flex-direction: column; align-items: center; }
            </style>
          </head>
          <body>${htmlContent}</body>
        </html>
      `);
      doc.close();

      // 3. Lógica de Impresión
      const triggerPrint = () => {
        try {
          // Pequeño delay adicional para asegurar renderizado de Tailwind
          setTimeout(() => {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              
              // Limpieza después de imprimir
              iframe.contentWindow.onafterprint = () => {
                document.body.removeChild(iframe);
                resolve();
              };

              // Fallback para navegadores que no soportan onafterprint
              setTimeout(() => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
                resolve();
              }, 1000);
            }
          }, 500);
        } catch (error) {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          reject(error);
        }
      };

      // Esperar a que el contenido cargue (incluyendo scripts externos como Tailwind)
      if (iframe.contentWindow) {
        iframe.contentWindow.onload = triggerPrint;
        
        // Fallback para navegadores que no disparan onload en iframes manuales
        setTimeout(() => {
          if (doc.readyState === 'complete') {
            triggerPrint();
          }
        }, 2000);
      } else {
        triggerPrint();
      }

    } catch (error) {
      reject(error);
    }
  });
};