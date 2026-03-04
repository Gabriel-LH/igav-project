export interface ConfigChangeLog {
  id: string;
  userId: string;
  userName: string;
  section: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  requiresRestart: boolean;
}