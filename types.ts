
export enum AppState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  REVEALING_CRITERIA = 'REVEALING_CRITERIA',
  SPINNING_PERSON = 'SPINNING_PERSON',
  PICKING_DIRECTION = 'PICKING_DIRECTION',
  FINAL_RESULT = 'FINAL_RESULT',
  DECREE = 'DECREE' // For immediate rules without specific names
}

export enum RotationDirection {
  CLOCKWISE = 'Clockwise',
  COUNTER_CLOCKWISE = 'Counter-Clockwise'
}

export interface SelectionCriteria {
  title: string;
  description: string;
}

export interface OracleResult {
  person?: string;
  direction: RotationDirection;
  criteria: SelectionCriteria;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}
