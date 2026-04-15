export interface RoutineSpec {
  id: string;
  name: string;
  description: string;
  schedule?: string;
  promptTemplate?: string;
  steps: string[];
}
