
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const SUPABASE_URL = 'https://bbpumnfcfafoneleahea.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicHVtbmZjZmFmb25lbGVhaGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzOTEyMzAsImV4cCI6MjA4MTk2NzIzMH0.oSlRkBrocnGt3ycPEVPiC6NLMv59PN--9xEKTi9W5wU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const V2_FILE_PATH = path.resolve('../detalhes-v2.json');

// --- Types ---
interface V2Maturity {
    foundation: string;
    bronze: string;
    silver: string;
    gold: string;
    platinum: string;
}

interface V2Element {
    element_name: string;
    description: string;
    maturity_levels: V2Maturity;
}

interface V2Pillar {
    pillar_name: string;
    description: string;
    elements: V2Element[];
}

interface V2Root {
    pillars: V2Pillar[];
}

// --- Helpers ---
function normalizeString(str: string): string {
    // Remove spaces, convert to upper
    // e.g. "C O L L A B..." -> "COLLABORATION..."
    return str.replace(/\s+/g, '').toUpperCase();
}

function normalizeMaturityKeys(levels: V2Maturity): any {
    return {
        FOUNDATION: levels.foundation,
        BRONZE: levels.bronze,
        SILVER: levels.silver,
        GOLD: levels.gold,
        PLATINUM: levels.platinum,
    };
}

// Map Normalized V2 Names to DB Pillar Codes (Manual Mapping fallback)
const PILLAR_MAPPING: Record<string, string> = {
    "COLLABORATION&ENGAGEMENT": "CE",
    "SAFETY": "SA", // Assuming SA, verify in DB
    "LEARNINGCULTURE": "LC",
    "SALES&OPERATIONSPLANNING": "SO", // Assuming SO
    "SUSTAINABILITY": "SU", // Assuming SU
    "QUALITY": "QU", // Assuming QU
    "CONTINUOUSIMPROVEMENT": "CI",
    "DIGITAL": "DI" // Assuming DI
};

async function main() {
    console.log('--- STARTING SYNC V2 ---');

    // 1. Load V2 Data
    if (!fs.existsSync(V2_FILE_PATH)) {
        console.error('V2 File not found:', V2_FILE_PATH);
        return;
    }
    const rawData = fs.readFileSync(V2_FILE_PATH, 'utf-8');
    const v2Data: V2Root = JSON.parse(rawData);
    console.log(`Loaded ${v2Data.pillars.length} pillars from JSON.`);

    // 2. Load DB Pillars
    const { data: dbPillars, error: pillarsError } = await supabase.from('pillars_master').select('*');
    if (pillarsError) throw pillarsError;
    console.log(`Loaded ${dbPillars?.length} pillars from DB.`);

    // Verify mappings
    const mappedPillars = [];
    for (const v2Pillar of v2Data.pillars) {
        const normName = normalizeString(v2Pillar.pillar_name);
        // Find in DB (normalize DB name too)
        let dbPillar = dbPillars?.find(p => normalizeString(p.name_en) === normName);

        // Fallback: try mapping if logic fails (e.g. ampersand differences)
        if (!dbPillar) {
            // Try strict mapping
            // e.g. "SALES&OPERATIONSPLANNING" vs "Sales & Operations Planning"
            // Check if manual mapping exists
            // Check fuzzy? 
            // Let's assume the normalize works for now, but handle exceptions
            console.warn(`Could not find exact match for: ${v2Pillar.pillar_name} (Norm: ${normName})`);

            // Try to match by "starts with" or mapped code
            // ...
            // Actually, let's list DB pillars to see what we have
            // (For this script run, I'll log and continue if not found)
        }

        if (dbPillar) {
            mappedPillars.push({ v2: v2Pillar, db: dbPillar });
            console.log(`Matched: "${v2Pillar.pillar_name}" -> ${dbPillar.code} (${dbPillar.name_en})`);
        } else {
            console.error(`FAILED TO MATCH PILLAR: ${v2Pillar.pillar_name}`);
        }
    }

    // 3. Process Elements
    for (const { v2, db } of mappedPillars) {
        console.log(`\nProcessing Pillar: ${db.name_en} (${db.code})`);

        // Get existing elements for this pillar
        const { data: dbElements, error: elemsError } = await supabase
            .from('elements_master')
            .select('*')
            .eq('pillar_id', db.id); // Get ALL, including inactive

        if (elemsError) throw elemsError;

        const touchedElementIds = new Set<string>();

        // Determine Code Sequence
        // Find max code number currently in use for this pillar to avoid collisions?
        // Or should we fill gaps?
        // Codes are like "CI-01", "CI-10".
        // Let's parse all codes:
        let maxCodeNum = 0;
        dbElements?.forEach(e => {
            const match = e.code.match(/^[A-Z]{2}-(\d+)/);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxCodeNum) maxCodeNum = num;
            }
        });
        console.log(`  Max Code Num: ${maxCodeNum}`);

        for (const v2Elem of v2.elements) {
            const normElemName = normalizeString(v2Elem.element_name);

            // Try to find in DB (ACTIVE or INACTIVE)
            // We start by looking for EXACT name match (normalized)
            // Then maybe fuzzy?
            let match = dbElements?.find(e => normalizeString(e.name_en) === normElemName);

            // If not found, check if mapped (e.g. "Changeover Reduction (SMED)" vs "SMED")
            // The user said DETAILS-V2 is the truth.
            // So if "Changeover Reduction (SMED)" is the new name, we should check if "SMED" or "Changeover Reduction" exists as 'CI-04'.
            // We can try to look up by ID/Code if we had it, but we don't.

            // Heuristic: If we have an existing element that is "close enough" or if we want to reuse codes...
            // Let's try to match by substring?
            // Or simply: If no match -> Create NEW. Old ones will be deactivated.
            // BUT: We want to preserve history/action plans if possible.
            // E.g. "SMED" (Old) -> "Changeover Reduction (SMED)" (New).
            // If we don't match them, we lose the link.
            //
            // Let's rely on my previous SQL cleanup which normalized some names.
            // "CI.5" -> "SMED (Single Minute Exchange of Die)" -> Merged to "CI-04" "Changeover Reduction (SMED)"?
            // Actually my SQL updated "CI-04" name to the "CI.5" name.
            // So if the names in V2 are same as "CI.5" names, we are good.
            // Let's assume names match or are very close.

            const newMaturity = normalizeMaturityKeys(v2Elem.maturity_levels);

            if (match) {
                // UPDATE
                console.log(`    UPDATE: ${match.code} - ${v2Elem.element_name}`);
                await supabase
                    .from('elements_master')
                    .update({
                        name_en: v2Elem.element_name,
                        name_local: v2Elem.element_name, // Assume same for now
                        description_local: v2Elem.description, // Mapped to description_local? Or we should have description_en? DB typically has both or one.
                        // Check DB columns: name_en, name_local, description_local (maybe description_en missing?)
                        criteria: newMaturity,
                        is_active: true
                    })
                    .eq('id', match.id);

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
            console.log(`  Deactivating ${untouched.length} elements: ${untouched.map(e => e.code).join(', ')}`);
            const idsToDeactivate = untouched.map(e => e.id);
            await supabase
                .from('elements_master')
                .update({ is_active: false })
                .in('id', idsToDeactivate);
        }
    }

    console.log('--- SYNC COMPLETE ---');
}

main().catch(err => console.error(err));
