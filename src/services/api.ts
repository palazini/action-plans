// src/services/api.ts
import { supabase } from '../lib/supabaseClient';
import type {
  ActionPlanInsert,
  DashboardStats,
  ElementWithRelations,
  ActionPlanStatus,
  PillarStats,
  ActionPlanWithElement,
  MaturityLevel,
  LevelScore,
  ElementWithLevelScores,
} from '../types';
import { MATURITY_LEVELS } from '../types';

export async function fetchBacklogElements(country: string, level: MaturityLevel = 'FOUNDATION'): Promise<ElementWithRelations[]> {
  return fetchBacklogByLevel(country, level);
}

/**
 * Busca elementos com score < 100 para um nível específico de maturidade
 * Usa a tabela country_level_scores
 */
export async function fetchBacklogByLevel(
  country: string,
  level: MaturityLevel
): Promise<ElementWithRelations[]> {
  // 1. Buscar scores do país para o nível específico com score < 100
  let scoresQuery = supabase
    .from('country_level_scores')
    .select('element_id, country, score, notes, level')
    .eq('level', level)
    .lt('score', 100);

  if (country !== 'Global') {
    scoresQuery = scoresQuery.eq('country', country);
  }

  const { data: scoresData, error: scoresError } = await scoresQuery;
  if (scoresError) throw scoresError;

  const scores = (scoresData ?? []) as any[];
  if (scores.length === 0) return [];

  // 2. Buscar elementos globais correspondentes
  const elementIds = scores.map(s => s.element_id);

  const { data: elementsData, error: elementsError } = await supabase
    .from('elements_master')
    .select(`
      id,
      code,
      name_local,
      name_en,
      pillar_id,
      is_active,
      pillar:pillars_master (
        id,
        code,
        name_local,
        name_en,
        description_local,
        is_active
      )
    `)
    .in('id', elementIds);

  if (elementsError) throw elementsError;

  // 3. Buscar action_plans relacionados (filtrar pelo nível)
  const { data: plansData, error: plansError } = await supabase
    .from('action_plans')
    .select(`
      id,
      element_master_id,
      status,
      problem,
      solution,
      owner_name,
      due_date,
      created_at,
      country,
      maturity_level
    `)
    .in('element_master_id', elementIds)
    .eq('maturity_level', level);

  if (plansError) throw plansError;

  // 4. Criar mapa de scores
  const scoresMap = new Map<string, { score: number; notes: string | null; country: string }>();
  for (const s of scores) {
    const key = `${s.element_id}_${s.country}`;
    scoresMap.set(key, { score: s.score, notes: s.notes, country: s.country });
  }

  // 5. Criar mapa de planos por element_master_id
  const plansMap = new Map<string, any[]>();
  for (const plan of (plansData ?? [])) {
    const key = plan.element_master_id;
    if (!plansMap.has(key)) {
      plansMap.set(key, []);
    }
    plansMap.get(key)!.push(plan);
  }

  // 6. Montar resultado
  const elements = (elementsData ?? []) as any[];
  const result: ElementWithRelations[] = [];

  for (const el of elements) {
    const matchingScores = scores.filter(s => s.element_id === el.id);

    for (const scoreEntry of matchingScores) {
      const pillarRaw = el.pillar;
      const pillar = Array.isArray(pillarRaw) ? pillarRaw[0] : pillarRaw;

      // Skip if pillar is inactive
      if (pillar && pillar.is_active === false) continue;

      // Skip if element itself is inactive
      if (el.is_active === false) continue;

      result.push({
        id: el.id,
        code: el.code,
        name: el.name_local ?? el.name_en ?? '',
        foundation_score: scoreEntry.score, // Using 'score' from level_scores
        notes: scoreEntry.notes,
        country: scoreEntry.country,
        pillar: pillar ? {
          id: pillar.id,
          code: pillar.code,
          name: pillar.name_local ?? pillar.name_en ?? '',
          description: pillar.description_local
        } : null,
        action_plans: (plansMap.get(el.id) ?? []).filter(p =>
          p.country === scoreEntry.country
        ),
      });
    }
  }

  return result;
}
/**
 * Estatísticas gerais do dashboard
 * Usa as novas tabelas globais
 */
export async function fetchDashboardStats(country: string, level: MaturityLevel = 'FOUNDATION'): Promise<DashboardStats> {
  // Total de elementos globais (ativos apenas)
  const { data: activeElements, error: activeError } = await supabase
    .from('elements_master')
    .select('id, pillars_master!inner(is_active)')
    .eq('pillars_master.is_active', true)
    .eq('is_active', true); // Added strict check for element active status

  if (activeError) throw activeError;
  const activeElementIds = new Set((activeElements ?? []).map(e => e.id));
  const totalElements = activeElementIds.size;

  // Buscar backlog (with level parameter)
  const backlog = await fetchBacklogElements(country, level);

  const gapElements = backlog.length;
  const elementsWithoutPlan = backlog.filter(
    (el) => !el.action_plans || el.action_plans.length === 0,
  ).length;

  // Count fully completed elements per level
  const { data: levelScores, error: levelError } = await supabase
    .from('country_level_scores')
    .select('level, score, element_id')
    .eq('country', country)
    .eq('score', 100);

  if (levelError) throw levelError;

  const maturityCounts: Record<string, number> = {
    FOUNDATION: 0,
    BRONZE: 0,
    SILVER: 0,
    GOLD: 0,
    PLATINUM: 0,
  };

  (levelScores || []).forEach((item: any) => {
    // Only count active elements (requires element_id in select)
    if (activeElementIds.has(item.element_id)) {
      if (maturityCounts[item.level] !== undefined) {
        maturityCounts[item.level]++;
      }
    }
  });

  return {
    totalElements: totalElements ?? 0,
    gapElements,
    elementsWithoutPlan,
    maturityCounts: maturityCounts as any,
  };
}

export type PillarSummary = {
  pillarId: string;
  pillarCode: string;
  pillarName: string;
  gapCount: number;
  avgScore: number;
};

export type GlobalCountryStats = {
  country: string;
  totalElements: number;
  gapElements: number;
  elementsWithPlan: number;
  elementsWithoutPlan: number;
  // Action Plans
  totalActionPlans: number;
  completedActionPlans: number;
  // Foundation Maturity
  foundationAvgScore: number;
  foundationCompleteCount: number;
  // Per-pillar summary
  pillarSummary: PillarSummary[];
};

/**
 * Estatísticas detalhadas por país (para o dashboard Global)
 * Usa as novas tabelas globais (country_level_scores - FOUNDATION)
 */
export async function fetchGlobalCountryStats(): Promise<GlobalCountryStats[]> {
  // 1. Fetch active elements with pillar info
  const { data: activeElements, error: activeError } = await supabase
    .from('elements_master')
    .select('id, pillar_id, pillars_master!inner(id, code, name_local, name_en, is_active)')
    .eq('pillars_master.is_active', true)
    .eq('is_active', true);

  if (activeError) throw activeError;

  const activeElementIds = new Set((activeElements ?? []).map(e => e.id));
  const totalElements = activeElementIds.size;

  // Create element -> pillar map
  const elementPillarMap = new Map<string, { pillarId: string; code: string; name: string }>();
  for (const el of (activeElements ?? [])) {
    const pillar = (el as any).pillars_master;
    if (pillar) {
      elementPillarMap.set(el.id, {
        pillarId: pillar.id,
        code: pillar.code || '',
        name: pillar.name_local || pillar.name_en || '',
      });
    }
  }

  // 2. Buscar todos os scores FOUNDATION de todos os países
  const { data: scoresData, error: scoresError } = await supabase
    .from('country_level_scores')
    .select('element_id, country, score') // 'score' is foundation_score for FOUNDATION level
    .eq('level', 'FOUNDATION');

  if (scoresError) throw scoresError;

  // 3. Buscar TODOS os action_plans (não só os de gaps)
  const { data: plansData, error: plansError } = await supabase
    .from('action_plans')
    .select('element_master_id, country, status');

  if (plansError) throw plansError;

  // 4. Criar mapa de planos por element_master_id + country
  const plansMap = new Map<string, { total: number; completed: number }>();
  // Also track total plans per country
  const countryPlansMap = new Map<string, { total: number; completed: number }>();

  for (const plan of (plansData ?? [])) {
    if (!activeElementIds.has(plan.element_master_id)) continue;

    const key = `${plan.element_master_id}_${plan.country}`;
    if (!plansMap.has(key)) {
      plansMap.set(key, { total: 0, completed: 0 });
    }
    const entry = plansMap.get(key)!;
    entry.total += 1;
    if (plan.status === 'DONE') entry.completed += 1;

    // Country-level totals
    if (!countryPlansMap.has(plan.country)) {
      countryPlansMap.set(plan.country, { total: 0, completed: 0 });
    }
    const countryEntry = countryPlansMap.get(plan.country)!;
    countryEntry.total += 1;
    if (plan.status === 'DONE') countryEntry.completed += 1;
  }

  // 5. Agrupar por país com métricas expandidas
  type CountryData = GlobalCountryStats & {
    foundationScoreSum: number;
    foundationScoreCount: number;
    pillarData: Map<string, { gapCount: number; scoreSum: number; scoreCount: number; code: string; name: string }>;
  };

  const map = new Map<string, CountryData>();
  const scores = (scoresData ?? []) as any[];

  for (const score of scores) {
    const country = score.country;
    if (!country) continue;
    if (!activeElementIds.has(score.element_id)) continue;

    if (!map.has(country)) {
      map.set(country, {
        country,
        totalElements: totalElements ?? 0,
        gapElements: 0,
        elementsWithPlan: 0,
        elementsWithoutPlan: 0,
        totalActionPlans: 0,
        completedActionPlans: 0,
        foundationAvgScore: 0,
        foundationCompleteCount: 0,
        foundationScoreSum: 0,
        foundationScoreCount: 0,
        pillarSummary: [],
        pillarData: new Map(),
      });
    }

    const stats = map.get(country)!;
    const foundationScore = score.score ?? 0;

    // Accumulate for average
    stats.foundationScoreSum += foundationScore;
    stats.foundationScoreCount += 1;

    if (foundationScore === 100) {
      stats.foundationCompleteCount += 1;
    }

    // Pillar tracking
    const pillarInfo = elementPillarMap.get(score.element_id);
    if (pillarInfo) {
      if (!stats.pillarData.has(pillarInfo.pillarId)) {
        stats.pillarData.set(pillarInfo.pillarId, {
          gapCount: 0,
          scoreSum: 0,
          scoreCount: 0,
          code: pillarInfo.code,
          name: pillarInfo.name,
        });
      }
      const pd = stats.pillarData.get(pillarInfo.pillarId)!;
      pd.scoreSum += foundationScore;
      pd.scoreCount += 1;
      if (foundationScore < 100) {
        pd.gapCount += 1;
      }
    }

    // GAP: foundation_score < 100
    if (foundationScore < 100) {
      stats.gapElements += 1;

      const planKey = `${score.element_id}_${country}`;
      const planInfo = plansMap.get(planKey);

      if (!planInfo || planInfo.total === 0) {
        stats.elementsWithoutPlan += 1;
      } else {
        stats.elementsWithPlan += 1;
        stats.completedActionPlans += planInfo.completed;
      }
    }
  }

  // 6. Finalize stats
  const result: GlobalCountryStats[] = [];

  for (const [country, stats] of map) {
    // Calculate foundation average
    stats.foundationAvgScore = stats.foundationScoreCount > 0
      ? Math.round(stats.foundationScoreSum / stats.foundationScoreCount)
      : 0;

    // Get total action plans for this country
    const countryPlans = countryPlansMap.get(country);
    stats.totalActionPlans = countryPlans?.total ?? 0;
    stats.completedActionPlans = countryPlans?.completed ?? 0;

    // Build pillar summary
    stats.pillarSummary = Array.from(stats.pillarData.entries()).map(([pillarId, pd]) => ({
      pillarId,
      pillarCode: pd.code,
      pillarName: pd.name,
      gapCount: pd.gapCount,
      avgScore: pd.scoreCount > 0 ? Math.round(pd.scoreSum / pd.scoreCount) : 0,
    })).sort((a, b) => a.pillarCode.localeCompare(b.pillarCode));

    // Remove internal tracking fields
    const { foundationScoreSum, foundationScoreCount, pillarData, ...cleanStats } = stats;
    result.push(cleanStats as GlobalCountryStats);
  }

  return result.sort((a, b) => a.country.localeCompare(b.country));
}

/**
 * Estatísticas por pilar (apenas elementos com FOUNDATION < 100)
 */
export async function fetchPillarStats(country: string): Promise<PillarStats[]> {
  const backlog = await fetchBacklogElements(country);

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
 * Usa element_master_id para buscar dados de elements_master
 */
export async function fetchActionPlans(country: string): Promise<ActionPlanWithElement[]> {
  // 1. Buscar action_plans
  let query = supabase
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
      country,
      created_at,
      updated_at,
      element_master_id,
      maturity_level
    `)
    .order('created_at', { ascending: true });

  if (country !== 'Global') {
    query = query.eq('country', country);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [];

  // 2. Coletar todos os element_master_ids
  const masterIds = rows
    .map(r => r.element_master_id)
    .filter(id => id != null);

  // 3. Buscar elementos globais
  const { data: elementsData, error: elementsError } = await supabase
    .from('elements_master')
    .select(`
      id,
      code,
      name_local,
      name_en,
      pillar_id,
      pillar:pillars_master (
        id,
        code,
        name_local,
        name_en,
        description_local
      )
    `)
    .in('id', masterIds.length > 0 ? masterIds : ['00000000-0000-0000-0000-000000000000']);

  if (elementsError) throw elementsError;

  // 4. Buscar scores relevates (FOUNDATION)
  let scoresQuery = supabase
    .from('country_level_scores')
    .select('element_id, country, score')
    .eq('level', 'FOUNDATION')
    .in('element_id', masterIds.length > 0 ? masterIds : ['00000000-0000-0000-0000-000000000000']);

  // Se for um país específico, filtra. Se for Global, busca de todos os países (pois temos planos de vários países)
  if (country !== 'Global') {
    scoresQuery = scoresQuery.eq('country', country);
  }

  const { data: scoresData, error: scoresError } = await scoresQuery;
  if (scoresError) throw scoresError;

  // Mapa: elementId_country -> score
  const scoresMap = new Map<string, number>();
  for (const s of (scoresData ?? [])) {
    scoresMap.set(`${s.element_id}_${s.country}`, s.score);
  }

  // 5. Criar mapa de elementos
  const elementsMap = new Map<string, any>();
  for (const el of (elementsData ?? [])) {
    elementsMap.set(el.id, el);
  }

  // 6. Mapear resultado
  const mapped = rows.map((row) => {
    let element: ElementWithRelations | null = null;

    const elementId = row.element_master_id;
    const rawElement = elementsMap.get(elementId);

    if (rawElement) {
      const pillarRaw = rawElement.pillar;
      const pillar = Array.isArray(pillarRaw) ? pillarRaw[0] : pillarRaw;

      // Busca score específico para o elemento E país do plano
      // Se for Global, cada plano tem seu row.country
      const scoreKey = `${elementId}_${row.country}`;
      const score = scoresMap.get(scoreKey) ?? 0;

      element = {
        id: rawElement.id,
        code: rawElement.code,
        name: rawElement.name_local ?? rawElement.name_en ?? '',
        foundation_score: score,
        notes: null,
        pillar: pillar ? {
          id: pillar.id,
          code: pillar.code,
          name: pillar.name_local ?? pillar.name_en ?? '',
          description: pillar.description_local
        } : null,
        action_plans: [],
      };
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
      country: row.country,
      maturity_level: row.maturity_level || 'FOUNDATION',
    };
  });

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
    country: string;
    maturityLevel?: MaturityLevel;
  },
): Promise<void> {
  const { elementId, problem, solution, ownerName, dueDate, problemEn, actionEn, country, maturityLevel } =
    input;

  const payload: any = {
    element_master_id: elementId, // Usa nova coluna que referencia elements_master
    // “genérico” (mantém compatibilidade com o que já existia)
    problem,
    solution,
    // colunas específicas PT
    problem_pt: problem,
    action_pt: solution,
    owner_name: ownerName,
    country,
    maturity_level: maturityLevel || 'FOUNDATION',
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

// --- ADMIN: Pilares & Elementos (Globais) ------------------------------------



// ============================================
// MATURITY LEVEL API FUNCTIONS
// ============================================

/**
 * Fetch all pillars with elements and their maturity level scores for a country
 */
export async function fetchPillarsWithLevelScores(country: string): Promise<{
  pillars: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    elements: ElementWithLevelScores[];
  }[];
}> {
  // 1. Fetch all pillars
  const { data: pillarsData, error: pillarsError } = await supabase
    .from('pillars_master')
    .select('id, code, name_local, name_en, description_local, description_en, is_active')
    .order('is_active', { ascending: false })
    .order('code', { ascending: true });

  if (pillarsError) throw pillarsError;

  // 2. Fetch all elements
  const { data: elementsData, error: elementsError } = await supabase
    .from('elements_master')
    .select('id, code, name_local, name_en, pillar_id, criteria')
    .order('code', { ascending: true });

  if (elementsError) throw elementsError;

  // 2.1 Fetch active action plans to determine if elements have plans
  let plansQuery = supabase
    .from('action_plans')
    .select('element_master_id')
    .not('status', 'in', '("DONE","CANCELLED")');

  if (country !== 'Global') {
    plansQuery = plansQuery.eq('country', country);
  }

  const { data: plansData } = await plansQuery;
  const elementsWithPlans = new Set((plansData ?? []).map((p: any) => p.element_master_id));

  // 3. Fetch level scores for the country
  let scoresQuery = supabase
    .from('country_level_scores')
    .select('id, element_id, level, score, notes, updated_at');

  if (country !== 'Global') {
    scoresQuery = scoresQuery.eq('country', country);
  }

  const { data: scoresData, error: scoresError } = await scoresQuery;

  // If table doesn't exist yet, use empty array
  const scores = scoresError ? [] : (scoresData ?? []);

  // 4. Create scores map: element_id -> level -> score
  const scoresMap = new Map<string, Map<MaturityLevel, LevelScore>>();
  for (const score of scores) {
    if (!scoresMap.has(score.element_id)) {
      scoresMap.set(score.element_id, new Map());
    }
    scoresMap.get(score.element_id)!.set(score.level as MaturityLevel, {
      id: score.id,
      element_id: score.element_id,
      country,
      level: score.level as MaturityLevel,
      score: score.score ?? 0,
      notes: score.notes,
      updated_at: score.updated_at,
    });
  }

  // 5. Build result
  const pillars = (pillarsData ?? []).map((pillar: any) => {
    const pillarElements = (elementsData ?? [])
      .filter((el: any) => el.pillar_id === pillar.id)
      .map((el: any): ElementWithLevelScores => {
        const elementScores = scoresMap.get(el.id) ?? new Map();

        // Build levels object
        const levels: Record<MaturityLevel, LevelScore | null> = {
          FOUNDATION: elementScores.get('FOUNDATION') ?? null,
          BRONZE: elementScores.get('BRONZE') ?? null,
          SILVER: elementScores.get('SILVER') ?? null,
          GOLD: elementScores.get('GOLD') ?? null,
          PLATINUM: elementScores.get('PLATINUM') ?? null,
        };

        return {
          id: el.id,
          code: el.code,
          name: el.name_local ?? el.name_en ?? '',
          pillar_id: el.pillar_id,
          levels,
          criteria: el.criteria,
          hasActivePlan: elementsWithPlans.has(el.id),
        };
      });

    return {
      id: pillar.id,
      code: pillar.code ?? '',
      name: pillar.name_local ?? pillar.name_en ?? '',
      description: pillar.description_local ?? pillar.description_en ?? null,
      is_active: pillar.is_active ?? false,
      elements: pillarElements,
    };
  });

  return { pillars };
}

/**
 * Update a level score for an element in a country
 */
export async function updateLevelScore(input: {
  elementId: string;
  country: string;
  level: MaturityLevel;
  score: number;
  notes?: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('country_level_scores')
    .upsert({
      element_id: input.elementId,
      country: input.country,
      level: input.level,
      score: input.score,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'element_id,country,level'
    });

  if (error) throw error;
}

/**
 * Get maturity summary stats for a country
 */
export async function fetchMaturityStats(country: string): Promise<{
  levelStats: { level: MaturityLevel; avgScore: number; completed: number; total: number }[];
  overallProgress: number;
}> {
  // Fetch all level scores
  let query = supabase
    .from('country_level_scores')
    .select('level, score, element_id');

  if (country !== 'Global') {
    query = query.eq('country', country);
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      levelStats: MATURITY_LEVELS.map(level => ({
        level,
        avgScore: 0,
        completed: 0,
        total: 0,
      })),
      overallProgress: 0,
    };
  }

  // Filter out scores from inactive pillars
  // We need to fetch active elements first
  const { data: activeElements } = await supabase
    .from('elements_master')
    .select('id, pillars_master!inner(is_active)')
    .eq('pillars_master.is_active', true);

  const activeElementIds = new Set((activeElements ?? []).map(e => e.id));

  // Calculate stats per level
  const levelData: Record<MaturityLevel, number[]> = {
    FOUNDATION: [],
    BRONZE: [],
    SILVER: [],
    GOLD: [],
    PLATINUM: [],
  };

  for (const row of data) {
    // Only include if element is active
    if (!row.element_id || !activeElementIds.has(row.element_id)) {
      continue;
    }

    const level = row.level as MaturityLevel;
    if (levelData[level]) {
      levelData[level].push(row.score ?? 0);
    }
  }

  const levelStats = MATURITY_LEVELS.map(level => {
    const scores = levelData[level];
    const total = scores.length;
    const completed = scores.filter(s => s === 100).length;
    const avgScore = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;

    return { level, avgScore, completed, total };
  });

  // Overall progress: weighted average of all levels
  // Re-calculate using filtered data
  let totalScoreSum = 0;
  let totalScoreCount = 0;

  Object.values(levelData).forEach(scores => {
    totalScoreSum += scores.reduce((a, b) => a + b, 0);
    totalScoreCount += scores.length;
  });

  const overallProgress = totalScoreCount > 0
    ? Math.round(totalScoreSum / totalScoreCount)
    : 0;

  return { levelStats, overallProgress };
}

// ============================================
// ADMIN API FUNCTIONS
// ============================================

export type UserProfile = {
  id: string;
  name: string;
  role: string | null;
  country: string | null;
  created_at: string | null;
};

/**
 * Fetch all user profiles (Admin only)
 */
export async function fetchAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, country, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(p => ({
    id: p.id,
    name: p.full_name || 'Unknown',
    role: p.role,
    country: p.country,
    created_at: p.created_at,
  }));
}

// ============================================
// PILLAR MANAGEMENT API FUNCTIONS
// ============================================

export type PillarAdmin = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

/**
 * Fetch all pillars (Admin only) - includes inactive pillars
 */
export async function fetchAllPillars(): Promise<PillarAdmin[]> {
  const { data, error } = await supabase
    .from('pillars_master')
    .select('id, code, name_local, name_en, description_local, description_en, is_active')
    .order('code', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(p => ({
    id: p.id,
    code: p.code || '',
    name: p.name_local || p.name_en || '',
    description: p.description_local || p.description_en || null,
    is_active: p.is_active ?? true,
  }));
}

/**
 * Update pillar active status (Admin only)
 */
export async function updatePillarStatus(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('pillars_master')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// APP SETTINGS API FUNCTIONS
// ============================================

/**
 * Fetch the active maturity level from app_settings
 */
export async function fetchActiveMaturityLevel(): Promise<MaturityLevel> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'active_maturity_level')
    .single();

  if (error) {
    console.error('Error fetching active maturity level:', error);
    return 'FOUNDATION'; // Default fallback
  }

  // Supabase JSONB returns parsed value - handle both string and quoted string cases
  let level = data.value;

  // If it's a quoted string (legacy format from JSON.stringify), parse it
  if (typeof level === 'string' && level.startsWith('"') && level.endsWith('"')) {
    level = level.slice(1, -1);
  }

  // Validate it's a valid maturity level
  const validLevels = ['FOUNDATION', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  if (validLevels.includes(level)) {
    return level as MaturityLevel;
  }

  return 'FOUNDATION';
}

/**
 * Update the active maturity level (Admin only)
 */
export async function updateActiveMaturityLevel(level: MaturityLevel): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({
      value: level, // Store as plain string, not JSON.stringify
      updated_at: new Date().toISOString()
    })
    .eq('key', 'active_maturity_level');

  if (error) throw error;
}
