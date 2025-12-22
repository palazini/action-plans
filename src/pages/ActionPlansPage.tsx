// src/pages/ActionPlansPage.tsx
import { useState, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  Card,
  Center,
  Group,
  Loader,
  SegmentedControl,
  Table,
  Text,
  TextInput,
  Menu,
  Modal,
  ActionIcon,
  Stack,
  ThemeIcon,
  rem,
  Box,
  Title,
  Button,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconChevronDown,
  IconPencil,
  IconFilter,
  IconDatabase,
  IconSearch,
  IconClipboardList,
  IconDownload,
  IconFileSpreadsheet,
} from '@tabler/icons-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useActionPlans, useUpdateActionPlanStatus } from '../hooks/useQueries';
import type { ActionPlanStatus, ActionPlanWithElement } from '../types';
import { EditActionPlanForm } from '../components/action-plans/EditActionPlanForm';

function statusColor(status: ActionPlanStatus): string {
  switch (status) {
    case 'PLANNED':
      return 'blue';
    case 'IN_PROGRESS':
      return 'yellow';
    case 'DONE':
      return 'green';
    case 'CANCELLED':
      return 'gray';
    default:
      return 'gray';
  }
}

const STATUS_VALUES: ActionPlanStatus[] = [
  'PLANNED',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED',
];

export function ActionPlansPage() {
  const { t, i18n } = useTranslation();
  const { selectedCountry } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pillarFilter, setPillarFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('');

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<ActionPlanWithElement | null>(
    null,
  );

  const isGlobalView = selectedCountry === 'Global';

  const currentLang =
    i18n.language && i18n.language.startsWith('en') ? 'en' : 'pt';

  // React Query hooks
  const {
    data: plans = [],
    isLoading: loading,
    error: queryError,
    refetch
  } = useActionPlans(selectedCountry);

  const updateStatusMutation = useUpdateActionPlanStatus();

  const error = queryError ? t('table.noPlans') : null;

  function resolveProblem(plan: ActionPlanWithElement): string {
    if (currentLang === 'en') {
      return (
        plan.problem_en ??
        plan.problem_pt ??
        plan.problem ??
        ''
      );
    }
    // pt
    return (
      plan.problem_pt ??
      plan.problem_en ??
      plan.problem ??
      ''
    );
  }

  function resolveAction(plan: ActionPlanWithElement): string {
    if (currentLang === 'en') {
      return (
        plan.action_en ??
        plan.action_pt ??
        plan.solution ??
        ''
      );
    }
    // pt
    return (
      plan.action_pt ??
      plan.action_en ??
      plan.solution ??
      ''
    );
  }

  async function handleChangeStatus(
    planId: string,
    newStatus: ActionPlanStatus,
  ) {
    setUpdatingId(planId);
    try {
      await updateStatusMutation.mutateAsync({ id: planId, status: newStatus });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  // --- LÓGICA DE EXPORTAÇÃO EXCEL (ESTILIZADO) ---
  // Aqui exporta apenas o que está na tabela (país atual ou visão Global filtrada).
  // O "export globalzão" consolidado você usa pelo botão no Header.
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    const setupWorksheet = (sheetName: string, data: any[], columns: any[]) => {
      const sheet = workbook.addWorksheet(sheetName);

      sheet.columns = columns;
      sheet.addRows(data);

      sheet.eachRow((row, rowNumber) => {
        row.alignment = {
          vertical: 'top',
          wrapText: true,
          horizontal: 'left',
        };

        if (rowNumber === 1) {
          row.height = 25;
          row.eachCell((cell) => {
            cell.font = {
              bold: true,
              color: { argb: 'FFFFFFFF' },
              size: 12,
            };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF228BE6' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
        } else {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };

            if (rowNumber % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8F9FA' },
              };
            }
          });
        }
      });
    };

    // --- EN ---
    const columnsEn = [
      { header: 'Pillar', key: 'pillar', width: 10 },
      { header: 'Element', key: 'element', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Problem', key: 'problem', width: 50 },
      { header: 'Action', key: 'action', width: 50 },
      { header: 'Owner', key: 'owner', width: 25 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
    ];

    const dataEn = filteredPlans.map((p) => ({
      pillar: p.element?.pillar?.code ?? p.element?.pillar?.name,
      element: p.element?.name,
      status: p.status,
      problem: p.problem_en ?? p.problem_pt ?? '',
      action: p.action_en ?? p.solution ?? '',
      owner: p.owner_name,
      dueDate: p.due_date ?? '-',
    }));

    setupWorksheet('English (EN)', dataEn, columnsEn);

    // --- Local (PT) ---
    const columnsLocal = [
      { header: 'Pilar', key: 'pillar', width: 10 },
      { header: 'Elemento', key: 'element', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Problema', key: 'problem', width: 50 },
      { header: 'Ação', key: 'action', width: 50 },
      { header: 'Responsável', key: 'owner', width: 25 },
      { header: 'Prazo', key: 'dueDate', width: 15 },
    ];

    const dataLocal = filteredPlans.map((p) => ({
      pillar: p.element?.pillar?.code ?? p.element?.pillar?.name,
      element: p.element?.name,
      status: t(`status.${p.status}`),
      problem: p.problem_pt ?? p.problem ?? '',
      action: p.action_pt ?? p.solution ?? '',
      owner: p.owner_name,
      dueDate: p.due_date ?? '-',
    }));

    setupWorksheet('Local (PT)', dataLocal, columnsLocal);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(
      blob,
      `Action_Plans_${selectedCountry}_${new Date()
        .toISOString()
        .split('T')[0]}.xlsx`,
    );
  };
  // ----------------------------------

  // Opções de pilar
  const pillarOptions = Array.from(
    new Map(
      plans
        .filter((p) => p.element?.pillar)
        .map((p) => [
          p.element!.pillar!.id,
          {
            label:
              p.element!.pillar!.code || p.element!.pillar!.name || 'Sem pilar',
            value: p.element!.pillar!.id,
          },
        ]),
    ).values(),
  );

  // Filtros
  const filteredPlans = plans.filter((plan) => {
    if (statusFilter !== 'ALL' && plan.status !== statusFilter) return false;

    if (pillarFilter !== 'ALL' && plan.element?.pillar?.id !== pillarFilter) {
      return false;
    }

    if (ownerFilter.trim()) {
      if (
        !plan.owner_name
          .toLowerCase()
          .includes(ownerFilter.trim().toLowerCase())
      ) {
        return false;
      }
    }

    return true;
  });

  // Linhas da tabela (com agrupamento por país na visão Global)
  const rows = (() => {
    // visão "normal" (apenas país atual)
    if (!isGlobalView) {
      return filteredPlans.map((plan) => (
        <Table.Tr key={plan.id}>
          {/* Pilar */}
          <Table.Td style={{ verticalAlign: 'top' }}>
            <Group gap="sm" wrap="nowrap">
              <Box w={4} h={24} bg="blue.4" style={{ borderRadius: 4 }} />
              <Text size="sm" fw={500}>
                {plan.element?.pillar?.code ?? '-'}
              </Text>
            </Group>
          </Table.Td>

          {/* Elemento */}
          <Table.Td style={{ verticalAlign: 'top' }}>
            <Text size="sm" fw={500} style={{ whiteSpace: 'normal' }}>
              {plan.element?.name ?? '-'}
            </Text>
          </Table.Td>

          {/* Status */}
          <Table.Td style={{ width: 140, verticalAlign: 'top' }}>
            <Menu withinPortal shadow="sm" width={160}>
              <Menu.Target>
                <Badge
                  color={statusColor(plan.status)}
                  variant="light"
                  size="sm"
                  rightSection={<IconChevronDown size={12} />}
                  style={{ cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  {t(`status.${plan.status}`)}
                </Badge>
              </Menu.Target>
              <Menu.Dropdown>
                {STATUS_VALUES.map((value) => (
                  <Menu.Item
                    key={value}
                    onClick={() => handleChangeStatus(plan.id, value)}
                    disabled={updatingId === plan.id || value === plan.status}
                    color={value === plan.status ? 'blue' : undefined}
                    style={{ fontWeight: value === plan.status ? 600 : 400 }}
                  >
                    {t(`status.${value}`)}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Table.Td>

          {/* Problema */}
          <Table.Td style={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
            <Text size="sm" lh={1.4} c="dark.9">
              {resolveProblem(plan)}
            </Text>
          </Table.Td>

          {/* Ação */}
          <Table.Td style={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
            <Text size="sm" lh={1.4} c="dark.9">
              {resolveAction(plan)}
            </Text>
          </Table.Td>

          {/* Responsável */}
          <Table.Td style={{ whiteSpace: 'normal', verticalAlign: 'top', maxWidth: 150, wordBreak: 'break-word' }}>
            <Text size="sm" fw={500}>
              {plan.owner_name}
            </Text>
          </Table.Td>

          {/* Prazo */}
          <Table.Td style={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
            <Text size="sm" c="dimmed">
              {plan.due_date ?? '-'}
            </Text>
          </Table.Td>

          {/* Ações */}
          <Table.Td align="right" style={{ verticalAlign: 'top' }}>
            <ActionIcon
              variant="subtle"
              color="blue"
              aria-label={t('actions.edit')}
              onClick={() => setEditingPlan(plan)}
            >
              <IconPencil size={16} />
            </ActionIcon>
          </Table.Td>
        </Table.Tr>
      ));
    }

    // visão Global: agrupa por país
    const sorted = [...filteredPlans].sort((a, b) => {
      const countryA = (a.country ?? '').localeCompare(b.country ?? '');
      if (countryA !== 0) return countryA;

      const pillarA =
        a.element?.pillar?.code ||
        a.element?.pillar?.name ||
        '';
      const pillarB =
        b.element?.pillar?.code ||
        b.element?.pillar?.name ||
        '';
      return pillarA.localeCompare(pillarB);
    });

    const result: ReactNode[] = [];
    let lastCountry: string | null = null;

    sorted.forEach((plan) => {
      const countryLabel = plan.country ?? 'N/A';

      if (countryLabel !== lastCountry) {
        lastCountry = countryLabel;
        result.push(
          <Table.Tr key={`country-${countryLabel}`}>
            <Table.Td colSpan={8} style={{ backgroundColor: '#f1f3f5' }}>
              <Group gap="xs">
                <Badge size="xs" variant="filled" color="blue">
                  {t('table.country', { defaultValue: 'Country' })}
                </Badge>
                <Text fw={700}>{countryLabel}</Text>
              </Group>
            </Table.Td>
          </Table.Tr>,
        );
      }

      result.push(
        <Table.Tr key={plan.id}>
          {/* Pilar */}
          <Table.Td style={{ verticalAlign: 'top' }}>
            <Group gap="sm" wrap="nowrap">
              <Box w={4} h={24} bg="blue.4" style={{ borderRadius: 4 }} />
              <Text size="sm" fw={500}>
                {plan.element?.pillar?.code ?? '-'}
              </Text>
            </Group>
          </Table.Td>

          {/* Elemento */}
          <Table.Td style={{ verticalAlign: 'top' }}>
            <Text size="sm" fw={500} style={{ whiteSpace: 'normal' }}>
              {plan.element?.name ?? '-'}
            </Text>
          </Table.Td>

          {/* Status */}
          <Table.Td style={{ width: 140, verticalAlign: 'top' }}>
            <Menu withinPortal shadow="sm" width={160}>
              <Menu.Target>
                <Badge
                  color={statusColor(plan.status)}
                  variant="light"
                  size="sm"
                  rightSection={<IconChevronDown size={12} />}
                  style={{ cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  {t(`status.${plan.status}`)}
                </Badge>
              </Menu.Target>
              <Menu.Dropdown>
                {STATUS_VALUES.map((value) => (
                  <Menu.Item
                    key={value}
                    onClick={() => handleChangeStatus(plan.id, value)}
                    disabled={updatingId === plan.id || value === plan.status}
                    color={value === plan.status ? 'blue' : undefined}
                    style={{ fontWeight: value === plan.status ? 600 : 400 }}
                  >
                    {t(`status.${value}`)}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Table.Td>

          {/* Problema */}
          <Table.Td style={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
            <Text size="sm" lh={1.4} c="dark.9">
              {resolveProblem(plan)}
            </Text>
          </Table.Td>

          {/* Ação */}
          <Table.Td style={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
            <Text size="sm" lh={1.4} c="dark.9">
              {resolveAction(plan)}
            </Text>
          </Table.Td>

          {/* Responsável */}
          <Table.Td style={{ whiteSpace: 'normal', verticalAlign: 'top', maxWidth: 150, wordBreak: 'break-word' }}>
            <Text size="sm" fw={500}>
              {plan.owner_name}
            </Text>
          </Table.Td>

          {/* Prazo */}
          <Table.Td style={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
            <Text size="sm" c="dimmed">
              {plan.due_date ?? '-'}
            </Text>
          </Table.Td>

          {/* Ações */}
          <Table.Td align="right" style={{ verticalAlign: 'top' }}>
            <ActionIcon
              variant="subtle"
              color="blue"
              aria-label={t('actions.edit')}
              onClick={() => setEditingPlan(plan)}
            >
              <IconPencil size={16} />
            </ActionIcon>
          </Table.Td>
        </Table.Tr>,
      );
    });

    return result;
  })();

  return (
    <Stack gap="lg">
      <Group justify="space-between" mb="xs">
        <div>
          <Title order={2} c="dark.8">
            {t('pages.actionPlans.title')}
          </Title>
          <Text c="dimmed" size="sm">
            {isGlobalView
              ? t(
                'pages.actionPlans.descriptionGlobal',
                'Lista global de planos de ação (todas as unidades que você pode ver).',
              )
              : t('pages.actionPlans.description')}
          </Text>
        </div>

        {/* BOTÃO EXPORTAR EXCEL */}
        <Tooltip
          withArrow
          label={
            isGlobalView
              ? t('pages.actionPlans.useHeaderExport')
              : t('pages.actionPlans.exportToExcel')
          }
        >
          <Button
            variant="default"
            onClick={!isGlobalView ? handleExportExcel : undefined}
            disabled={isGlobalView || filteredPlans.length === 0}
          >
            <Group gap={6}>
              <IconDownload size={18} />
              <IconFileSpreadsheet size={18} color="green" />
            </Group>
          </Button>
        </Tooltip>
      </Group>

      {error && (
        <Alert
          mb="md"
          icon={<IconAlertCircle size={16} />}
          color="red"
          title={t('pages.actionPlans.title')}
          variant="filled"
        >
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card withBorder radius="md" shadow="sm" p="lg">
        <Group justify="space-between" align="flex-end">
          <Group gap="xl">
            <div>
              <Group gap="xs" mb={6}>
                <IconFilter size={14} style={{ opacity: 0.6 }} />
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  {t('filters.status')}
                </Text>
              </Group>
              <SegmentedControl
                size="xs"
                value={statusFilter}
                onChange={setStatusFilter}
                data={[
                  { label: t('filters.status_all'), value: 'ALL' },
                  { label: t('status.PLANNED'), value: 'PLANNED' },
                  { label: t('status.IN_PROGRESS'), value: 'IN_PROGRESS' },
                  { label: t('status.DONE'), value: 'DONE' },
                  { label: t('status.CANCELLED'), value: 'CANCELLED' },
                ]}
              />
            </div>

            {pillarOptions.length > 0 && (
              <div>
                <Group gap="xs" mb={6}>
                  <IconDatabase size={14} style={{ opacity: 0.6 }} />
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                    {t('filters.pillar')}
                  </Text>
                </Group>
                <SegmentedControl
                  size="xs"
                  value={pillarFilter}
                  onChange={setPillarFilter}
                  data={[
                    { label: t('filters.status_all'), value: 'ALL' },
                    ...pillarOptions,
                  ]}
                />
              </div>
            )}
          </Group>

          <div style={{ minWidth: 250 }}>
            <TextInput
              size="sm"
              leftSection={<IconSearch size={16} />}
              placeholder={`${t('filters.owner')}...`}
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.currentTarget.value)}
            />
          </div>
        </Group>
      </Card>

      {loading ? (
        <Center h={200}>
          <Loader size="lg" type="dots" />
        </Center>
      ) : plans.length === 0 ? (
        <Center
          p="xl"
          bg="white"
          style={{
            borderRadius: 8,
            border: `1px solid ${rem('#dee2e6')}`,
          }}
        >
          <Stack align="center" gap="xs">
            <ThemeIcon size={60} radius="xl" variant="light" color="gray">
              <IconClipboardList size={30} />
            </ThemeIcon>
            <Text fw={600} size="lg" mt="sm" c="dimmed">
              {t('table.noPlans')}
            </Text>
          </Stack>
        </Center>
      ) : filteredPlans.length === 0 ? (
        <Center
          p="xl"
          bg="white"
          style={{
            borderRadius: 8,
            border: `1px solid ${rem('#dee2e6')}`,
          }}
        >
          <Stack align="center" gap="xs">
            <IconSearch size={40} color="gray" style={{ opacity: 0.3 }} />
            <Text c="dimmed">{t('table.noPlansForFilter')}</Text>
          </Stack>
        </Center>
      ) : (
        <Card withBorder radius="md" shadow="sm" p={0}>
          <Table verticalSpacing="sm" highlightOnHover striped>
            <Table.Thead bg="gray.0">
              <Table.Tr>
                <Table.Th>{t('table.pillar')}</Table.Th>
                <Table.Th>{t('table.element')}</Table.Th>
                <Table.Th>{t('table.status')}</Table.Th>
                <Table.Th style={{ width: '25%' }}>
                  {t('table.problem')}
                </Table.Th>
                <Table.Th style={{ width: '25%' }}>
                  {t('table.action')}
                </Table.Th>
                <Table.Th style={{ width: 150 }}>{t('table.owner')}</Table.Th>
                <Table.Th>{t('table.dueDate')}</Table.Th>
                <Table.Th align="right" />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal
        opened={editingPlan !== null}
        onClose={() => setEditingPlan(null)}
        title={<Text fw={700}>{t('actions.edit')}</Text>}
        size="lg"
        centered
        overlayProps={{ blur: 3 }}
      >
        {editingPlan && (
          <EditActionPlanForm
            plan={editingPlan}
            onCancel={() => setEditingPlan(null)}
            onSuccess={() => {
              setEditingPlan(null);
              refetch();
            }}
          />
        )}
      </Modal>
    </Stack>
  );
}
