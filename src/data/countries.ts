
export const AVAILABLE_COUNTRIES = [
    { name: 'Global', code: 'GL', i18nKey: 'countries.GL' },
    { name: 'Argentina', code: 'AR', i18nKey: 'countries.AR' },
    { name: 'Brazil', code: 'BR', i18nKey: 'countries.BR' },
    { name: 'Brazil (Hiter)', code: 'BR_Hiter', i18nKey: 'countries.BR_Hiter' },
    { name: 'China', code: 'CN', i18nKey: 'countries.CN' },
    { name: 'Germany (Gestra)', code: 'DE_Gestra', i18nKey: 'countries.DE_Gestra' },
    { name: 'France', code: 'FR', i18nKey: 'countries.FR' },
    { name: 'India', code: 'IN', i18nKey: 'countries.IN' },
    { name: 'Italy', code: 'IT', i18nKey: 'countries.IT' },
    { name: 'UK', code: 'GB', i18nKey: 'countries.GB' },
    { name: 'USA', code: 'US', i18nKey: 'countries.US' },
];

export function getCountryTranslationKey(countryName: string | null | undefined): string {
    if (!countryName) return '';
    const country = AVAILABLE_COUNTRIES.find(c => c.name === countryName);
    return country ? country.i18nKey : '';
}
