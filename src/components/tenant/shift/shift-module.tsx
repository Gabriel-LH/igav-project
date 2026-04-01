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



type State = {
  shifts: Shift[];
  assignments: ShiftAssignment[];
  isLoading: boolean;
};

type Action =
  | { type: "SET_SHIFTS"; payload: Shift[] }
  | { type: "SET_ASSIGNMENTS"; payload: ShiftAssignment[] }
  | { type: "SET_LOADING"; payload: boolean };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_SHIFTS":
      return { ...state, shifts: action.payload };
    case "SET_ASSIGNMENTS":
      return { ...state, assignments: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

interface ShiftsModuleProps {
  initialShifts?: Shift[];
}

import { getShiftAssignmentsAction } from "@/src/app/(tenant)/tenant/actions/shift.actions";

export function ShiftsModule({ initialShifts = [] }: ShiftsModuleProps) {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const [state, dispatch] = useReducer(reducer, {
    shifts: initialShifts,
    assignments: [],
    isLoading: false,
  });

  // Re-sync if initialShifts change (e.g. from server action revalidation)
  useEffect(() => {
    dispatch({ type: "SET_SHIFTS", payload: initialShifts });
  }, [initialShifts]);

  const handleSelectShift = useCallback(async (shift: Shift) => {
    setSelectedShift(shift);
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const fetchedAssignments = await getShiftAssignmentsAction(shift.id);
      dispatch({ type: "SET_ASSIGNMENTS", payload: fetchedAssignments });
    } catch (err) {
      console.error("Failed to load assignments", err);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
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
    <div className="container py-6 space-y-6">

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
