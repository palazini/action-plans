// src/data/maturityCriteria.ts
// Auto-imported from detalhes.json - contains maturity level criteria for each element

import type { MaturityLevel } from '../types';

export type ElementCriteria = {
    name: string;
    behaviour: string;
    maturityLevels: Partial<Record<MaturityLevel, string>>;
};

export type PillarCriteria = {
    name: string;
    description: string;
    elements: ElementCriteria[];
};

// Import the JSON data
import criteriaData from '../../detalhes.json';

// Transform and export
export const maturityCriteria: PillarCriteria[] = (criteriaData as any[]).map(pillar => ({
    name: pillar.name,
    description: pillar.description || '',
    elements: (pillar.elements || []).map((el: any) => ({
        name: el.name,
        behaviour: el.behaviour || '',
        maturityLevels: el.maturity_levels || {},
    })),
}));

/**
 * Find criteria for a specific element by name (fuzzy match)
 */
export function findElementCriteria(elementName: string): ElementCriteria | null {
    const normalizedName = elementName.toLowerCase().trim();

    for (const pillar of maturityCriteria) {
        for (const element of pillar.elements) {
            const criteriaName = element.name.toLowerCase().trim();
            // Exact match or contains
            if (criteriaName === normalizedName ||
                criteriaName.includes(normalizedName) ||
                normalizedName.includes(criteriaName)) {
                return element;
            }
        }
    }

    return null;
}

/**
 * Get criteria text for a specific level
 */
export function getLevelCriteria(elementName: string, level: MaturityLevel): string | null {
    const criteria = findElementCriteria(elementName);
    if (!criteria) return null;
    return criteria.maturityLevels[level] || null;
}
