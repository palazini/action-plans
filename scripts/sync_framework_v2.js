
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const SUPABASE_URL = 'https://bbpumnfcfafoneleahea.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicHVtbmZjZmFmb25lbGVhaGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzOTEyMzAsImV4cCI6MjA4MTk2NzIzMH0.oSlRkBrocnGt3ycPEVPiC6NLMv59PN--9xEKTi9W5wU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const V2_FILE_PATH = path.resolve(__dirname, '../../detalhes-v2.json');

// --- Helpers ---
function normalizeString(str) {
    if (!str) return '';
    // Remove spaces, convert to upper
    // e.g. "C O L L A B..." -> "COLLABORATION..."
    return str.replace(/\s+/g, '').toUpperCase();
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

// Map Normalized V2 Names to DB Pillar Codes (Manual Mapping fallback)
const PILLAR_MAPPING = {
    "COLLABORATION&ENGAGEMENT": "CE",
    "SAFETY": "SA",
    "LEARNINGCULTURE": "LC",
    "SALES&OPERATIONSPLANNING": "SO", // Might be SOP or SP?
    "SUSTAINABILITY": "SU",
    "QUALITY": "QU",
    "CONTINUOUSIMPROVEMENT": "CI",
    "DIGITAL": "DI"
};

async function main() {
    console.log('--- STARTING SYNC V2 (JS) - FIX ---');

    // 1. Load V2 Data
    if (!fs.existsSync(V2_FILE_PATH)) {
        console.error('V2 File not found:', V2_FILE_PATH);
        return;
    }
    const rawData = fs.readFileSync(V2_FILE_PATH, 'utf-8');
    const v2Data = JSON.parse(rawData);

    // 2. Load DB Pillars
    const { data: dbPillars, error: pillarsError } = await supabase.from('pillars_master').select('*');
    if (pillarsError) {
        console.error('Error fetching pillars:', pillarsError);
        return;
    }
    console.log(`Loaded ${dbPillars?.length} pillars from DB:`);
    dbPillars.forEach(p => console.log(`  [${p.code}] ${p.name_en} (Norm: ${normalizeString(p.name_en)})`));

    // Verify mappings
    const mappedPillars = [];
    for (const v2Pillar of v2Data.pillars) {
        const normName = normalizeString(v2Pillar.pillar_name);

        // Strategy 1: Match by Optimized Name
        let dbPillar = dbPillars?.find(p => normalizeString(p.name_en) === normName);

        // Strategy 2: Match by Mapping Code (Fallback)
        if (!dbPillar && PILLAR_MAPPING[normName]) {
            const targetCode = PILLAR_MAPPING[normName];
            dbPillar = dbPillars?.find(p => p.code === targetCode);
        }

        if (dbPillar) {
            mappedPillars.push({ v2: v2Pillar, db: dbPillar });
            console.log(`SUCCESS: "${v2Pillar.pillar_name}" -> [${dbPillar.code}]`);
        } else {
            console.error(`FAILED TO MATCH PILLAR: ${v2Pillar.pillar_name} (Norm: ${normName})`);
        }
    }

    // 3. Process Elements
    for (const { v2, db } of mappedPillars) {
        console.log(`\nProcessing Pillar: ${db.name_en} (${db.code})`);

        // Get existing elements for this pillar
        const { data: dbElements, error: elemsError } = await supabase
            .from('elements_master')
            .select('*')
            .eq('pillar_id', db.id);

        if (elemsError) {
            console.error('Error fetching elements:', elemsError);
            continue;
        }

        const touchedElementIds = new Set();
        // Track codes
        const existingCodes = new Set(dbElements.map(e => e.code));

        // Determine Max Code Number
        let maxCodeNum = 0;
        dbElements?.forEach(e => {
            const match = e.code.match(/[A-Z]+-(\d+)/);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxCodeNum) maxCodeNum = num;
            }
        });

        for (const v2Elem of v2.elements) {
            const normElemName = normalizeString(v2Elem.element_name);

            // Match by Name (Normalized)
            // Check both EN and LOCAL names, and check for substrings to handle "SMED" vs "Changeover (SMED)" cases
            let match = dbElements?.find(e => {
                const dbNorm = normalizeString(e.name_en);
                const dbLocalNorm = normalizeString(e.name_local);
                return dbNorm === normElemName || dbLocalNorm === normElemName;
            });

            // Special Fuzzy Handle
            if (!match) {
                match = dbElements?.find(e => {
                    const dbNorm = normalizeString(e.name_en);
                    return (dbNorm.includes(normElemName) || normElemName.includes(dbNorm)) && Math.abs(dbNorm.length - normElemName.length) < 15; // length check to avoid over-matching
                });
            }

            const newMaturity = normalizeMaturityKeys(v2Elem.maturity_levels);

            if (match) {
                // UPDATE
                // console.log(`    UPDATE: ${match.code}`);
                const { error: updateError } = await supabase
                    .from('elements_master')
                    .update({
                        name_en: v2Elem.element_name,
                        name_local: v2Elem.element_name,
                        description_local: v2Elem.description,
                        criteria: newMaturity,
                        is_active: true
                    })
                    .eq('id', match.id);

                if (updateError) console.error('Error updating:', updateError);
                else console.log(`    Updated: ${match.code} (${v2Elem.element_name})`);

                touchedElementIds.add(match.id);
            } else {
                // INSERT
                maxCodeNum++;
                const newCode = `${db.code}-${maxCodeNum.toString().padStart(2, '0')}`;

                console.log(`    INSERT: ${newCode} - ${v2Elem.element_name}`);

                const { data: newElem, error: insertError } = await supabase
                    .from('elements_master')
                    .insert({
                        pillar_id: db.id,
                        code: newCode,
                        name_en: v2Elem.element_name,
                        name_local: v2Elem.element_name,
                        description_local: v2Elem.description,
                        criteria: newMaturity,
                        is_active: true
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('    Error inserting:', insertError);
                } else {
                    if (newElem) touchedElementIds.add(newElem.id);
                }
            }
        }

        // Deactivate Untouched
        const untouched = dbElements?.filter(e => !touchedElementIds.has(e.id));
        if (untouched && untouched.length > 0) {
            console.log(`  Deactivating ${untouched.length} elements: ${untouched.map(e => e.code + ':' + e.name_en).join(', ')}`);

            const idsToDeactivate = untouched.map(e => e.id);
            const { error: deactError } = await supabase
                .from('elements_master')
                .update({ is_active: false })
                .in('id', idsToDeactivate);
            if (deactError) console.error('Error deactivating:', deactError);
        }
    }

    console.log('--- SYNC COMPLETE ---');
}

main().catch(err => console.error(err));
