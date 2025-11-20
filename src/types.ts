// src/types.ts

export type Pillar = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
};

export type ActionPlanStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED';

export type ActionPlan = {
  id: string;
  element_id: string;
  problem: string;
  solution: string;
  owner_name: string;
  due_date: string | null;
  status: ActionPlanStatus;
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
  action_plans: {
    id: string;
    status: ActionPlanStatus;
    problem: string;
    solution: string;
    owner_name: string;
    due_date: string | null;
    created_at: string;
  }[];
};

export type DashboardStats = {
  totalElements: number;
  gapElements: number;
  elementsWithoutPlan: number;
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
