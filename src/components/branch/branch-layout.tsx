import { BranchesModule } from "./branch-module";

export function BranchLayout() { 
  return (
    <div className="flex flex-col gap-1">
      <BranchesModule/>
    </div>
  );
}