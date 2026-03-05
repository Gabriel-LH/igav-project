// components/shifts/ShiftsModule.tsx
"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShiftsTable } from "./table/shift-table";
import { ShiftDetails } from "./shift-details";
import type {
  Shift,
  ShiftAssignment,
} from "@/src/application/interfaces/shift/shift";

// Datos mock
const MOCK_SHIFTS: Shift[] = [
  {
    id: "1",
    name: "Turno Mañana",
    startTime: "06:00",
    endTime: "14:00",
    workingDays: [
      { day: "L", label: "Lunes", active: true },
      { day: "M", label: "Martes", active: true },
      { day: "X", label: "Miércoles", active: true },
      { day: "J", label: "Jueves", active: true },
      { day: "V", label: "Viernes", active: true },
      { day: "S", label: "Sábado", active: false },
      { day: "D", label: "Domingo", active: false },
    ],
    toleranceMinutes: 15,
    allowOvertime: true,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Turno Tarde",
    startTime: "14:00",
    endTime: "22:00",
    workingDays: [
      { day: "L", label: "Lunes", active: true },
      { day: "M", label: "Martes", active: true },
      { day: "X", label: "Miércoles", active: true },
      { day: "J", label: "Jueves", active: true },
      { day: "V", label: "Viernes", active: true },
      { day: "S", label: "Sábado", active: false },
      { day: "D", label: "Domingo", active: false },
    ],
    toleranceMinutes: 10,
    allowOvertime: true,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Turno Noche",
    startTime: "22:00",
    endTime: "06:00",
    workingDays: [
      { day: "L", label: "Lunes", active: true },
      { day: "M", label: "Martes", active: true },
      { day: "X", label: "Miércoles", active: true },
      { day: "J", label: "Jueves", active: true },
      { day: "V", label: "Viernes", active: true },
      { day: "S", label: "Sábado", active: true },
      { day: "D", label: "Domingo", active: false },
    ],
    toleranceMinutes: 20,
    allowOvertime: false,
    status: "inactive",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_ASSIGNMENTS: ShiftAssignment[] = [
  {
    id: "a1",
    employeeId: "1",
    employeeName: "Juan Pérez",
    shiftId: "1",
    startDate: new Date("2024-01-01"),
    endDate: undefined,
    status: "active",
  },
  {
    id: "a2",
    employeeId: "2",
    employeeName: "María García",
    shiftId: "1",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    status: "active",
  },
  {
    id: "a3",
    employeeId: "3",
    employeeName: "Carlos López",
    shiftId: "2",
    startDate: new Date("2024-02-01"),
    endDate: undefined,
    status: "active",
  },
];

// Definimos tipos para el estado y acciones del reducer
type State = {
  shifts: Shift[];
  assignments: ShiftAssignment[];
  isLoading: boolean;
};

type Action =
  | { type: "SET_SHIFTS"; payload: Shift[] }
  | { type: "SET_ASSIGNMENTS"; payload: ShiftAssignment[] }
  | { type: "SET_LOADING"; payload: boolean }
  | {
      type: "INIT_DATA";
      payload: { shifts: Shift[]; assignments: ShiftAssignment[] };
    };

// Reducer para manejar el estado
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_SHIFTS":
      return { ...state, shifts: action.payload };
    case "SET_ASSIGNMENTS":
      return { ...state, assignments: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "INIT_DATA":
      return {
        ...state,
        shifts: action.payload.shifts,
        assignments: action.payload.assignments,
        isLoading: false,
      };
    default:
      return state;
  }
};

export function ShiftsModule() {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Usamos useReducer en lugar de múltiples useState
  const [state, dispatch] = useReducer(reducer, {
    shifts: [],
    assignments: [],
    isLoading: true,
  });

  // Inicializar datos con useRef para evitar doble ejecución
  useEffect(() => {
    let isMounted = true;

    console.log("Inicializando datos...");

    // Simulamos una carga asíncrona
    const loadData = async () => {
      // Pequeño delay para simular carga de API
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (isMounted) {
        dispatch({
          type: "INIT_DATA",
          payload: {
            shifts: MOCK_SHIFTS,
            assignments: MOCK_ASSIGNMENTS,
          },
        });
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []); // La dependencia vacía está bien ahora

  const handleSelectShift = useCallback((shift: Shift) => {
    setSelectedShift(shift);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedShift(null);
  }, []);

  const handleShiftsChange = useCallback((newShifts: Shift[]) => {
    dispatch({ type: "SET_SHIFTS", payload: newShifts });
  }, []);

  const handleAssignmentsChange = useCallback(
    (newAssignments: ShiftAssignment[]) => {
      dispatch({ type: "SET_ASSIGNMENTS", payload: newAssignments });
    },
    [],
  );

  if (state.isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Cargando módulo de turnos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">

      <Tabs
        value={selectedShift ? "details" : "list"}
        onValueChange={(value) => {
          if (value === "list") handleBackToList();
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="list">Lista de Turnos</TabsTrigger>
          {selectedShift && (
            <TabsTrigger value="details">
              Detalles: {selectedShift.name}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <ShiftsTable
            shifts={state.shifts}
            onSelectShift={handleSelectShift}
            onShiftsChange={handleShiftsChange}
          />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedShift && (
            <ShiftDetails
              shift={selectedShift}
              assignments={state.assignments.filter(
                (a) => a.shiftId === selectedShift.id,
              )}
              onAssignmentsChange={handleAssignmentsChange}
              onBack={handleBackToList}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
