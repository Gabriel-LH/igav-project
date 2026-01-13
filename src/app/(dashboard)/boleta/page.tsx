// pages/index.js

'use client'
import { useState } from "react";
import Boleta from "@/src/components/boleta/boleta";

export default function Home() {
  const [size, setSize] = useState("80"); // default 80 mm

  const printBoleta = () => {
    window.print();
  };

  return (
    <div className="p-4">
      <Boleta size={size} className="printable" />

      <div className="mt-4 flex gap-2 print:hidden">
        <button
          onClick={() => setSize("80")}
          className={`px-4 py-2 rounded ${size === "80" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          80 mm
        </button>
        <button
          onClick={() => setSize("58")}
          className={`px-4 py-2 rounded ${size === "58" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          58 mm
        </button>
        <button
          onClick={printBoleta}
          className="px-4 py-2 rounded bg-green-500 text-white"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
}
