
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const V2_FILE_PATH = path.resolve(__dirname, '../../detalhes-v2.json');
const OUT_SQL_PATH = path.resolve(__dirname, '../../supabase/migrations/20260113_sync_v2_content.sql');

function normalizeString(str) {
  if (!str) return '';
  return str.replace(/\s+/g, '').toUpperCase();
}

function escapeSql(str) {
  if (!str) return "''";
  // Escape single quotes by doubling them
  return "'" + str.replace(/'/g, "''") + "'";
}

function normalizeMaturityKeys(levels) {
  if (!levels) return {};
  return {
    FOUNDATION: levels.foundation || levels.FOUNDATION,
    BRONZE: levels.bronze || levels.BRONZE,
    SILVER: levels.silver || levels.SILVER,
    GOLD: levels.gold || levels.GOLD,
    PLATINUM: levels.platinum || levels.PLATINUM,
  };
}

const PILLAR_MAPPING = {
  "COLLABORATION&ENGAGEMENT": "CE",
  "SAFETY": "SA",
  "LEARNINGCULTURE": "LC",
  "SALES&OPERATIONSPLANNING": "SO",
  "SUSTAINABILITY": "SU",
  "QUALITY": "QU",
  "CONTINUOUSIMPROVEMENT": "CI",
  "DIGITAL": "DI"
};

function main() {
  console.log('--- GENERATING MIGRATION SQL ---');

  if (!fs.existsSync(V2_FILE_PATH)) {
    console.error('V2 File not found:', V2_FILE_PATH);
    return;
  }
  const rawData = fs.readFileSync(V2_FILE_PATH, 'utf-8');
  const v2Data = JSON.parse(rawData);

  let sql = `-- MIGRATION: Sync Framework with Details V2
-- Generated automatically
BEGIN;

-- Ensure description_local column exists
ALTER TABLE elements_master ADD COLUMN IF NOT EXISTS description_local text;

DO $$
DECLARE
  v_pillar_id uuid;
  v_pillar_code text;
  v_curr_id uuid;
  v_max_code_num int;
  v_new_code text;
  v_touched_ids uuid[];
BEGIN
`;

  for (const pillar of v2Data.pillars) {
    const normName = normalizeString(pillar.pillar_name);
    const mappedCode = PILLAR_MAPPING[normName];

    // Find Pillar ID
    sql += `
  -- ---------------------------------------------------------
  -- Processing Pillar: ${pillar.pillar_name}
  -- ---------------------------------------------------------
  v_pillar_id := NULL;
  v_pillar_code := NULL;
  
  SELECT id, code INTO v_pillar_id, v_pillar_code FROM pillars_master 
  WHERE REPLACE(UPPER(name_en), ' ', '') = ${escapeSql(normName)}
  OR code = '${mappedCode || 'XXX'}';
  
  IF v_pillar_id IS NULL THEN
    RAISE NOTICE 'Pillar not found: ${pillar.pillar_name}';
  ELSE
    RAISE NOTICE 'Syncing Pillar: % (%)', '${pillar.pillar_name}', v_pillar_code;
    
    -- Reset touched IDs for this pillar
    v_touched_ids := '{}';

    -- Loop through elements
`;

    for (const elem of pillar.elements) {
      const criteriaJson = JSON.stringify(normalizeMaturityKeys(elem.maturity_levels));

      sql += `
    -- Elem: ${elem.element_name}
    v_curr_id := NULL;
    
    -- Try to find exact match by name (Standardize spaces a bit?)
    SELECT id INTO v_curr_id FROM elements_master 
    WHERE pillar_id = v_pillar_id 
      AND (
          name_en = ${escapeSql(elem.element_name)} 
          OR name_local = ${escapeSql(elem.element_name)}
          OR REPLACE(UPPER(name_en), ' ', '') = ${escapeSql(normalizeString(elem.element_name))}
      )
    LIMIT 1;

    IF v_curr_id IS NOT NULL THEN
      -- UPDATE
      UPDATE elements_master
      SET 
        name_en = ${escapeSql(elem.element_name)},
        name_local = ${escapeSql(elem.element_name)},
        description_local = ${escapeSql(elem.description)},
        criteria = '${criteriaJson.replace(/'/g, "''")}'::jsonb,
        is_active = true
      WHERE id = v_curr_id;
      
      v_touched_ids := array_append(v_touched_ids, v_curr_id);
    ELSE
      -- INSERT
      -- Generate Code: Get max number
      -- Use substring regex to only capture pure digits at the end, ignoring -OLD
      SELECT COALESCE(MAX(NULLIF(substring(code from '^' || v_pillar_code || '-(\d+)$'), '')::int), 0) INTO v_max_code_num
      FROM elements_master WHERE pillar_id = v_pillar_id AND code LIKE v_pillar_code || '-%';
      
      v_new_code := v_pillar_code || '-' || TO_CHAR(v_max_code_num + 1, 'FM00');
      
      INSERT INTO elements_master (pillar_id, code, name_en, name_local, description_local, criteria, is_active)
      VALUES (
        v_pillar_id,
        v_new_code,
        ${escapeSql(elem.element_name)},
        ${escapeSql(elem.element_name)},
        ${escapeSql(elem.description)},
        '${criteriaJson.replace(/'/g, "''")}'::jsonb,
        true
      )
      RETURNING id INTO v_curr_id;
      
      v_touched_ids := array_append(v_touched_ids, v_curr_id);
    END IF;
`;
    }

    // Deactivation logic
    sql += `
    -- DEACTIVATE Removed Elements for this Pillar
    UPDATE elements_master
    SET is_active = false
    WHERE pillar_id = v_pillar_id
      AND NOT (id = ANY(v_touched_ids));
      
  END IF; -- End Pillar Found
`;
  }

  sql += `
END $$;

COMMIT;
`;

  fs.writeFileSync(OUT_SQL_PATH, sql);
  console.log('Migration generated at:', OUT_SQL_PATH);
}

main();
