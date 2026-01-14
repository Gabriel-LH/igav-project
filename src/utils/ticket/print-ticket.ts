export const printTicket = (htmlContent: string) => {
  const printWindow = window.open('', '_blank', );
  if (printWindow) {
    printWindow.document.body.innerHTML = (`
      <html>
        <head>
          <title>Imprimir Ticket</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 10px; font-family: monospace; display: flex; justify-content: center;   flex-direction: column; align-items: center; }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);
    printWindow.document.close();
    // Esperamos a que Tailwind cargue los estilos antes de imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }
};