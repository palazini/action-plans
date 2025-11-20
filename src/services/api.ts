// src/services/api.ts
import { supabase } from '../lib/supabaseClient';
import type {
  ActionPlanInsert,
  DashboardStats,
  ElementWithRelations,
  ActionPlanStatus,
  Pillar,
  PillarStats,
  ActionPlanWithElement,
} from '../types';

// Forma "crua" que o Supabase retorna a linha de elemento com joins (backlog)
type RawElementRow = {
  id: string;
  code: string | null;
  name: string;
  foundation_score: number;
  notes: string | null;
  pillar: Pillar[] | Pillar | null;
  action_plans:
    | {
        id: string;
        status: ActionPlanStatus;
        problem: string;
        solution: string;
        owner_name: string;
        due_date: string | null;
        created_at: string;
      }[]
    | null;
};

// Forma "crua" dos planos de ação vindos do Supabase (lista de planos)
type RawActionPlanRow = {
  id: string;
  problem: string | null;
  solution: string | null;
  problem_pt: string | null;
  problem_en: string | null;
  action_pt: string | null;
  action_en: string | null;
  owner_name: string;
  due_date: string | null;
  status: ActionPlanStatus;
  created_at: string;
  updated_at: string;
  // join com elements + pillars vem como "qualquer coisa" (às vezes array)
  element: any;
};

/**
 * Elementos com FOUNDATION < 100 + pilar + planos (detalhados)
 */
export async function fetchBacklogElements(): Promise<ElementWithRelations[]> {
  const { data, error } = await supabase
    .from('elements')
    .select(
      `
      id,
      code,
      name,
      foundation_score,
      notes,
      pillar:pillars (
        id,
        code,
        name,
        description
      ),
      action_plans (
        id,
        status,
        problem,
        solution,
        owner_name,
        due_date,
        created_at
      )
    `,
    )
    .lt('foundation_score', 100)
    .order('foundation_score', { ascending: true });

  if (error) {
    throw error;
  }

  // TS é chato com o tipo retornado, então usamos unknown -> RawElementRow[]
  const rows = (data ?? []) as unknown as RawElementRow[];

  const normalized: ElementWithRelations[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    foundation_score: row.foundation_score,
    notes: row.notes,
    pillar: Array.isArray(row.pillar)
      ? row.pillar[0] ?? null
      : row.pillar ?? null,
    action_plans: row.action_plans ?? [],
  }));

  return normalized;
}

/**
 * Estatísticas gerais do dashboard
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [totalRes, backlog] = await Promise.all([
    supabase.from('elements').select('*', { count: 'exact', head: true }),
    fetchBacklogElements(),
  ]);

  if (totalRes.error) {
    throw totalRes.error;
  }

  const totalElements = totalRes.count ?? 0;
  const gapElements = backlog.length;
  const elementsWithoutPlan = backlog.filter(
    (el) => !el.action_plans || el.action_plans.length === 0,
  ).length;

  return {
    totalElements,
    gapElements,
    elementsWithoutPlan,
  };
}

/**
 * Estatísticas por pilar (apenas elementos com FOUNDATION < 100)
 */
export async function fetchPillarStats(): Promise<PillarStats[]> {
  const backlog = await fetchBacklogElements();

  const map = new Map<string, PillarStats>();

  for (const el of backlog) {
    const pillar = el.pillar;
    const key = pillar?.id ?? 'unknown';

    if (!map.has(key)) {
      map.set(key, {
        pillarId: pillar?.id ?? 'unknown',
        pillarCode: pillar?.code ?? '-',
        pillarName: pillar?.name ?? 'Sem pilar',
        gapElements: 0,
        elementsWithPlan: 0,
        elementsWithoutPlan: 0,
      });
    }

    const stats = map.get(key)!;
    stats.gapElements += 1;

    if (el.action_plans.length > 0) {
      stats.elementsWithPlan += 1;
    } else {
      stats.elementsWithoutPlan += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.pillarCode.localeCompare(b.pillarCode),
  );
}

/**
 * Lista todos os planos de ação com elemento + pilar
 */
export async function fetchActionPlans(): Promise<ActionPlanWithElement[]> {
  const { data, error } = await supabase
    .from('action_plans')
    .select(`
      id,
      problem,
      solution,
      problem_pt,
      problem_en,
      action_pt,
      action_en,
      owner_name,
      due_date,
      status,
      created_at,
      updated_at,
      element:elements (
        id,
        code,
        name,
        foundation_score,
        notes,
        pillar:pillars (
          id,
          code,
          name,
          description
        )
      )
    `)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  // De novo: convertemos via unknown pra nossa forma crua
  const rows = (data ?? []) as unknown as RawActionPlanRow[];

  const mapped = rows.map((row) => {
    let element: ElementWithRelations | null = null;

    if (row.element) {
      // Supabase às vezes traz como array
      const rawElement = Array.isArray(row.element)
        ? row.element[0] ?? null
        : row.element;

      if (rawElement) {
        const rawPillar = rawElement.pillar;
        const normalizedPillar = Array.isArray(rawPillar)
          ? rawPillar[0] ?? null
          : rawPillar ?? null;

        element = {
          id: rawElement.id,
          code: rawElement.code,
          name: rawElement.name,
          foundation_score: rawElement.foundation_score,
          notes: rawElement.notes,
          pillar: normalizedPillar,
          // aqui a relação de planos não foi selecionada; como o tipo exige,
          // garantimos que sempre exista um array
          action_plans: rawElement.action_plans ?? [],
        };
      }
    }

    return {
      id: row.id,
      problem: row.problem,
      solution: row.solution,
      problem_pt: row.problem_pt,
      problem_en: row.problem_en,
      action_pt: row.action_pt,
      action_en: row.action_en,
      owner_name: row.owner_name,
      due_date: row.due_date,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      element,
    };
  });

  // Aqui "forçamos" o tipo final depois de normalizar tudo
  return mapped as ActionPlanWithElement[];
}

/**
 * Cria um plano de ação
 * - grava sempre o português em problem / solution / problem_pt / action_pt
 * - se vier EN, grava também em problem_en / action_en
 */
export async function createActionPlan(
  input: ActionPlanInsert & {
    problemEn?: string;
    actionEn?: string;
  },
): Promise<void> {
  const { elementId, problem, solution, ownerName, dueDate, problemEn, actionEn } =
    input;

  const payload: any = {
    element_id: elementId,
    // “genérico” (mantém compatibilidade com o que já existia)
    problem,
    solution,
    // colunas específicas PT
    problem_pt: problem,
    action_pt: solution,
    owner_name: ownerName,
  };

  if (dueDate) {
    payload.due_date = dueDate.toISOString().slice(0, 10);
  }

  // se você preencher inglês, grava também
  if (problemEn && problemEn.trim().length > 0) {
    payload.problem_en = problemEn;
  }

  if (actionEn && actionEn.trim().length > 0) {
    payload.action_en = actionEn;
  }

  const { error } = await supabase.from('action_plans').insert(payload);

  if (error) {
    throw error;
  }
}

/**
 * Atualiza um plano de ação
 * - recebe PT obrigatório, EN opcional
 * - sempre atualiza problem / solution / problem_pt / action_pt
 * - se vier EN, atualiza problem_en / action_en
 */
export async function updateActionPlan(input: {
  id: string;
  problem: string; // PT
  solution: string; // PT
  ownerName: string;
  dueDate?: Date | null;
  problemEn?: string; // EN opcional
  actionEn?: string; // EN opcional
}): Promise<void> {
  const payload: any = {
    problem: input.problem,
    solution: input.solution,
    owner_name: input.ownerName,
    problem_pt: input.problem,
    action_pt: input.solution,
  };

  if (input.dueDate !== undefined) {
    if (input.dueDate === null) {
      payload.due_date = null;
    } else {
      payload.due_date = input.dueDate.toISOString().slice(0, 10);
    }
  }

  if (input.problemEn !== undefined) {
    // pode ser string vazia se quiser “limpar” o inglês
    payload.problem_en =
      input.problemEn.trim().length > 0 ? input.problemEn : null;
  }

  if (input.actionEn !== undefined) {
    payload.action_en =
      input.actionEn.trim().length > 0 ? input.actionEn : null;
  }

  const { error } = await supabase
    .from('action_plans')
    .update(payload)
    .eq('id', input.id);

  if (error) {
    throw error;
  }
}

/**
 * Atualiza o status de um plano de ação
 */
export async function updateActionPlanStatus(
  id: string,
  status: ActionPlanStatus,
): Promise<void> {
  const { error } = await supabase
    .from('action_plans')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw error;
  }
}
