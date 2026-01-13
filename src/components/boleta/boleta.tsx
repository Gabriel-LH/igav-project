// components/Boleta.js

'use client'
export default function Boleta({ size = "80", className = "" }) {
  return (
    <div
      className={`mx-auto font-mono ${
        size === "80" ? "w-[80mm] text-[11px]" : "w-[58mm] text-[10px]"
      } ${className}`}
    >
      <div className="text-center">
        <img src="/logo.png" className="mx-auto w-28" alt="logo" />
        <h3>BODEGA DON PEPE</h3>
        <p>RUC: 10456789123</p>
        <p>{size === "80" ? "Av. Lima 123 - Lima" : "B001-00012345"}</p>
        {size === "80" && (
          <>
            <p>BOLETA DE VENTA ELECTRÓNICA</p>
            <p>B001-00012345</p>
          </>
        )}
      </div>

      <hr className="border-t border-dashed my-2" />

      <p>Fecha: 12/01/2026 14:30</p>
      {size === "80" && <p>Cliente: PÚBLICO EN GENERAL</p>}

      <hr className="border-t border-dashed my-2" />

      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Prod</th>
            {size === "80" && <th>Cant</th>}
            {size === "80" && <th>P.U</th>}
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Arroz</td>
            {size === "80" && <td>2</td>}
            {size === "80" && <td>4.00</td>}
            <td className="text-right">8.00</td>
          </tr>
          <tr>
            <td>Azúcar</td>
            {size === "80" && <td>1</td>}
            {size === "80" && <td>3.50</td>}
            <td className="text-right">3.50</td>
          </tr>
        </tbody>
      </table>

      <hr className="border-t border-dashed my-2" />

      {size === "80" && (
        <>
          <p className="text-right">Op. Gravada: S/ 9.75</p>
          <p className="text-right">IGV (18%): S/ 1.75</p>
        </>
      )}
      <h4 className="text-right font-bold">TOTAL: S/ 11.50</h4>

      <hr className="border-t border-dashed my-2" />

      {size === "80" && <p>SON: ONCE CON 50/100 SOLES</p>}
      <p>Forma de pago: EFECTIVO</p>

      <div className="text-center">
        <p>Gracias por su compra</p>
        {size === "80" && <p>Representación impresa de la boleta electrónica</p>}
      </div>
    </div>
  );
}
