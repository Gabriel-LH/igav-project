export const printTicket = (htmlContent: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        reject(new Error('No se pudo abrir ventana de impresión. Verifica bloqueadores de popups.'));
        return;
      }

      printWindow.document.write(`
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
      
      printWindow.document.close();

      // Esperar a que Tailwind cargue
      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.print();
            
            // Esperar a que termine la impresión antes de cerrar
            printWindow.onafterprint = () => {
              setTimeout(() => {
                printWindow.close();
                resolve();
              }, 100);
            };
            
            // Fallback en caso de que onafterprint no se dispare
            setTimeout(() => {
              printWindow.close();
              resolve();
            }, 2000);
            
          } catch (error) {
            printWindow.close();
            reject(error);
          }
        }, 500);
      };

      // Fallback para navegadores que no disparan onload
      setTimeout(() => {
        try {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
            resolve();
          }, 1000);
        } catch (error) {
          printWindow.close();
          reject(error);
        }
      }, 1000);

    } catch (error) {
      reject(error);
    }
  });
};