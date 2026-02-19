This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


//


¡Esa es la pregunta del millón en contabilidad y análisis de datos! Tienes toda la razón en preocuparte: si vendes un "Pack Terno" a $100 (cuando la suma real es $150) y simplemente bajas los precios a lo loco para que cuadre, tus reportes de "Producto Más Rentable" o "Ingresos por Categoría" se van a distorsionar.

Aquí te explico cómo lo resuelven los sistemas profesionales para que tu Caja cuadre con el dinero real, pero tu Analítica siga diciendo la verdad sobre el valor de tus productos.

Tienes 3 estrategias principales. Te recomiendo la Estrategia 2 (Descuento Prorrateado) para tu caso, pero te explico por qué.

Estrategia 1: El "Ítem Fantasma" (No Recomendada para Analítica) ❌
Creas una línea en la venta llamada "Pack Terno" con precio $100, y agregas los componentes (Saco, Pantalón) con precio $0.

Problema:

Tu Dashboard dirá: "Ingresos por Sacos: $0". "Ingresos por Packs: $10,000".

No sabrás si ganas más alquilando sacos sueltos o en pack.

Pierdes la trazabilidad del valor real de cada prenda.

Estrategia 2: Prorrateo Ponderado (La Estándar de la Industria) 🏆
Esta es la técnica contable correcta. Distribuyes el descuento del pack proporcionalmente al valor original de cada ítem.

Ejemplo:

Precios Reales: Saco ($100) + Pantalón ($50) = Total $150.

Precio Pack: $120 (Descuento total de $30, o sea 20%).

Cómo se guarda en BD:
El sistema calcula el peso de cada ítem en el total original y aplica ese % al precio del pack.

Saco: Representa el 66.6% del valor ($100/$150).

Precio Venta: $120 * 66.6% = **$80**.

Pantalón: Representa el 33.3% del valor ($50/$150).

Precio Venta: $120 * 33.3% = **$40**.

Resultado en BD (SaleItem):
| Producto | Precio Lista (Original) | Precio Venta (Real) | Descuento |
| :--- | :--- | :--- | :--- |
| Saco | $100 | $80 | $20 |
| Pantalón | $50 | $40 | $10 |

Ventajas para tu Dashboard:

Caja: Suma $120 (Correcto).

Analítica:

"Sacos alquilados": 1.

"Ingresos generados por Sacos": $80.

"Descuento otorgado en Sacos": $20.

Sabes exactamente cuánto "sacrificaste" de cada prenda para vender el pack.

Estrategia 3: Guardar el "Precio de Lista" vs "Precio Final" (La más completa) 💎
Para tener una analítica perfecta, tu tabla SaleItem (o RentalItem) debe tener dos columnas de precio:

unitPrice (o listPrice): El precio oficial del catálogo ($100).

finalPrice (o salePrice): El precio al que realmente se cerró la transacción ($80).

Estructura de BD sugerida:

TypeScript
// Modelo SaleItem / RentalItem
{
  productId: "...",
  stockId: "...",
  
  // 1. Para saber cuánto vale teóricamente (Analítica de Valor)
  listPrice: 100.00, 
  
  // 2. Para saber cuánto entró a caja (Analítica Financiera)
  finalPrice: 80.00,  
  
  // 3. Metadata útil
  discountAmount: 20.00,
  appliedPromotion: "PACK_TERNO_EJE", // Para saber POR QUÉ bajó el precio
}
¿Cómo implementarlo en tu código?
Cuando agregues el "Pack" al carrito en el POS, haces el cálculo matemático (Prorrateo) antes de enviarlo al Store.

Función Helper para tu POS:

TypeScript
const addBundleToCart = (bundleName: string, bundlePrice: number, items: InventoryItem[]) => {
    // 1. Calcular precio total original de los items seleccionados
    const totalListPrice = items.reduce((sum, item) => sum + item.price, 0);

    // 2. Calcular factor de ajuste (ej: 0.8 si es 20% off)
    const factor = bundlePrice / totalListPrice;

    items.forEach(item => {
        const adjustedPrice = item.price * factor;

        // 3. Agregar al carrito con la metadata correcta
        cartStore.addItem({
            product: item.product,
            stockId: item.id,
            quantity: 1,
            
            // PRECIO: Usamos el ajustado para que cobre bien
            unitPrice: Number(adjustedPrice.toFixed(2)), 
            
            // METADATA: Guardamos el original para analítica futura
            originalPrice: item.price, 
            discountReason: `Pack: ${bundleName}`
        });
    });
};
¿Qué gráfica usarías en el Dashboard?
Con esta estructura (Estrategia 3), puedes sacar dos métricas brutales:

Ingresos Reales (Cash Flow): Sumas finalPrice. Te dice cuánto dinero tienes.

Demanda Real (Valor de Mercado): Sumas listPrice. Te dice cuánto podrías haber ganado si no hicieras descuentos.

Insight: Si la diferencia es muy grande, estás regalando demasiado margen en tus packs.

Resumen:
Usa el Prorrateo. Rebaja el precio de cada ítem proporcionalmente para que sumen el total del pack. Guarda siempre el Precio Original y el Precio Final en la base de datos. Así tu contador y tu gerente de marketing estarán felices.