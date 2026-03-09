import { BranchConfig } from "../types/branch/type.branchConfig" 

export const MOCK_BRANCH_CONFIG: BranchConfig = {
    id: "1",
    branchId: "1",
    openHours: {
        open: "08:00",
        close: "18:00",
    },
    daysInLaundry: 3,
    daysInMaintenance: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
}