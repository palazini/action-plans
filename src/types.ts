// src/types.ts

export type Pillar = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export type ActionPlanStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED';

// Maturity levels in order of progression
export type MaturityLevel = 'FOUNDATION' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export const MATURITY_LEVELS: MaturityLevel[] = ['FOUNDATION', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

// Score for a specific level
export type LevelScore = {
  id?: string;
  element_id: string;
  country: string;
  level: MaturityLevel;
  score: number;
  notes?: string | null;
  updated_at?: string;
};

// Element with all level scores
export type ElementWithLevelScores = {
  id: string;
  code: string | null;
  name: string;
  pillar_id: string;
  pillar?: Pillar | null;
  levels: Record<MaturityLevel, LevelScore | null>;
  criteria?: {
    behaviour?: string;
    maturity_levels?: Record<string, string>;
  } | null;
};

export type ActionPlan = {
  id: string;
  element_master_id: string; // Referencia elements_master
  problem: string;
  solution: string;
  owner_name: string;
  due_date: string | null;
  status: ActionPlanStatus;
  maturity_level: MaturityLevel; // New: Which level this plan targets
  created_at: string;
  updated_at: string;
};

export type ElementWithRelations = {
  id: string;
  code: string | null;
  name: string;
  foundation_score: number;
  notes?: string | null;
  pillar: Pillar | null;
  is_active?: boolean;
  action_plans: {
    id: string;
    status: ActionPlanStatus;
    problem: string;
    solution: string;
    owner_name: string;
    due_date: string | null;
    created_at: string;
  }[];
  country?: string;
};

export type DashboardStats = {
  totalElements: number;
  gapElements: number;
  elementsWithoutPlan: number;
  maturityCounts: Record<MaturityLevel, number>;
};

export type PillarStats = {
  pillarId: string;
  pillarCode: string;
  pillarName: string;
  gapElements: number;
  elementsWithPlan: number;
  elementsWithoutPlan: number;
};

export type ActionPlanInsert = {
  elementId: string;
  problem: string;
  solution: string;
  ownerName: string;
  dueDate?: Date | null;
};

// Plano com elemento + pilar junto (para tela Planos)
export type ActionPlanWithElement = {
  id: string;

  // campos originais (podem continuar existindo)
  problem: string | null;
  solution: string | null;
  country?: string | null;

  // campos por idioma
  problem_pt: string | null;
  problem_en: string | null;
  action_pt: string | null;
  action_en: string | null;

  owner_name: string;
  due_date: string | null;
  status: ActionPlanStatus;
  created_at: string;
  updated_at: string;

  // agora referenciando o tipo já existente
  element: ElementWithRelations | null;
};
