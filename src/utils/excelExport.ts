// src/utils/excelExport.ts
// Módulo separado para exportação Excel com carregamento dinâmico
// ExcelJS (~500KB) é carregado apenas quando o usuário clica em "Exportar"

import type { ActionPlanWithElement } from '../types';

export interface ExportColumn {
    header: string;
    key: string;
    width: number;
}

export interface ExportRow {
    [key: string]: string | number | null | undefined;
}

// Estilo padrão para header (azul com texto branco)
const HEADER_STYLE = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF228BE6' } },
    alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
    border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const },
    },
};

// Estilo alternado para linhas pares
const EVEN_ROW_FILL = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFF8F9FA' },
};

// Borda padrão para células
const CELL_BORDER = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
};

/**
 * Carrega ExcelJS dinamicamente e cria um workbook estilizado
 */
async function loadExcelJS() {
    // Import dinâmico - só carrega quando necessário
    const ExcelJS = await import('exceljs');
    return new ExcelJS.default.Workbook();
}

/**
 * Configura colunas e adiciona dados a uma worksheet
 */
function setupWorksheet(sheet: any, columns: ExportColumn[], data: ExportRow[]) {
    // IMPORTANTE: definir colunas ANTES de adicionar dados
    sheet.columns = columns;
    sheet.addRows(data);

    // Aplicar estilos
    sheet.eachRow((row: any, rowNumber: number) => {
        row.alignment = { vertical: 'top', wrapText: true, horizontal: 'left' };

        if (rowNumber === 1) {
            row.height = 25;
            row.eachCell((cell: any) => {
                cell.font = HEADER_STYLE.font;
                cell.fill = HEADER_STYLE.fill;
                cell.alignment = HEADER_STYLE.alignment;
                cell.border = HEADER_STYLE.border;
            });
        } else {
            row.eachCell((cell: any) => {
                cell.border = CELL_BORDER;
                if (rowNumber % 2 === 0) {
                    cell.fill = EVEN_ROW_FILL;
                }
            });
        }
    });
}

/**
 * Exporta planos de ação para Excel (versão para ActionPlansPage)
 * Gera uma planilha em inglês e outra em português
 */
export async function exportActionPlansToExcel(
    plans: ActionPlanWithElement[],
    filename: string = 'action-plans'
): Promise<void> {
    const workbook = await loadExcelJS();

    // Colunas EN
    const columnsEn: ExportColumn[] = [
        { header: 'Pillar', key: 'pillar', width: 10 },
        { header: 'Element', key: 'element', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Problem', key: 'problem', width: 50 },
        { header: 'Action', key: 'action', width: 50 },
        { header: 'Owner', key: 'owner', width: 25 },
        { header: 'Due Date', key: 'dueDate', width: 15 },
    ];

    // Colunas PT
    const columnsPt: ExportColumn[] = [
        { header: 'Pilar', key: 'pillar', width: 10 },
        { header: 'Elemento', key: 'element', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Problema', key: 'problem', width: 50 },
        { header: 'Ação', key: 'action', width: 50 },
        { header: 'Responsável', key: 'owner', width: 25 },
        { header: 'Prazo', key: 'dueDate', width: 15 },
    ];

    // Dados EN
    const dataEn = plans.map((p) => ({
        pillar: p.element?.pillar?.code ?? p.element?.pillar?.name ?? '',
        element: p.element?.name ?? '',
        status: p.status,
        problem: p.problem_en ?? p.problem_pt ?? p.problem ?? '',
        action: p.action_en ?? p.action_pt ?? p.solution ?? '',
        owner: p.owner_name,
        dueDate: p.due_date ?? '-',
    }));

    // Dados PT
    const dataPt = plans.map((p) => ({
        pillar: p.element?.pillar?.code ?? p.element?.pillar?.name ?? '',
        element: p.element?.name ?? '',
        status: p.status,
        problem: p.problem_pt ?? p.problem ?? '',
        action: p.action_pt ?? p.solution ?? '',
        owner: p.owner_name,
        dueDate: p.due_date ?? '-',
    }));

    // Sheet EN
    const sheetEn = workbook.addWorksheet('English (EN)');
    setupWorksheet(sheetEn, columnsEn, dataEn);

    // Sheet PT
    const sheetPt = workbook.addWorksheet('Português (PT)');
    setupWorksheet(sheetPt, columnsPt, dataPt);

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const { saveAs } = await import('file-saver');
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${filename}.xlsx`);
}

/**
 * Exporta planos de ação globais para Excel (versão para MainLayout)
 * Gera uma planilha por país
 */
export async function exportGlobalPlansToExcel(
    countriesWithPlans: { countryName: string; plans: ActionPlanWithElement[] }[],
    filename: string = 'global-action-plans'
): Promise<void> {
    const workbook = await loadExcelJS();

    const columns: ExportColumn[] = [
        { header: 'Country', key: 'country', width: 18 },
        { header: 'Pillar', key: 'pillar', width: 12 },
        { header: 'Element', key: 'element', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Problem (EN)', key: 'problem', width: 50 },
        { header: 'Action (EN)', key: 'action', width: 50 },
        { header: 'Owner', key: 'owner', width: 25 },
        { header: 'Due Date', key: 'dueDate', width: 15 },
    ];

    for (const { countryName, plans } of countriesWithPlans) {
        const sheet = workbook.addWorksheet(countryName);
        const data = plans.map((p) => ({
            country: countryName,
            pillar: p.element?.pillar?.code ?? p.element?.pillar?.name ?? '',
            element: p.element?.name ?? '',
            status: p.status,
            problem: p.problem_en ?? p.problem_pt ?? p.problem ?? '',
            action: p.action_en ?? p.action_pt ?? p.solution ?? '',
            owner: p.owner_name,
            dueDate: p.due_date ?? '',
        }));
        setupWorksheet(sheet, columns, data);
    }

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const { saveAs } = await import('file-saver');
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${filename}.xlsx`);
}
