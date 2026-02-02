import { RentalsHeader } from "@/src/components/rentals/rental-header";
import { RentalsGrid } from "@/src/components/rentals/rentals-grid";

export default function RentalsPage() {
  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <RentalsHeader />
        <RentalsGrid />
      </div>
    </>
  );
}
