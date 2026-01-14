// src/pages/ActionPlansPage.tsx
import { useState, useMemo, type ReactNode } from 'react';
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
} from '@tabler/icons-react';

import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useActionPlans, useUpdateActionPlanStatus } from '../hooks/useQueries';
import type { ActionPlanStatus, ActionPlanWithElement, MaturityLevel } from '../types';
import { EditActionPlanForm } from '../components/action-plans/EditActionPlanForm';
import { LevelSelector } from '../components/LevelSelector';
import { LevelBanner } from '../components/LevelBanner';
import { getCountryTranslationKey } from '../data/countries';

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
  const [levelFilter, setLevelFilter] = useState<MaturityLevel>('FOUNDATION');
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
  const handleExportExcel = async () => {
    // Import dinâmico - ExcelJS só é carregado quando o usuário clica em exportar
    const { exportActionPlansToExcel } = await import('../utils/excelExport');
    const filename = `Action_Plans_${selectedCountry}_${new Date().toISOString().split('T')[0]}`;
    await exportActionPlansToExcel(filteredPlans, filename);
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

  // Count plans per level
  const levelCounts = useMemo(() => {
    const counts: Record<MaturityLevel, number> = {
      FOUNDATION: 0,
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
    };
    plans.forEach((plan) => {
      const level = plan.maturity_level || 'FOUNDATION';
      if (counts[level] !== undefined) {
        counts[level]++;
      }
    });
    return counts;
  }, [plans]);

  // Count completed plans for current level
  const completedCount = useMemo(() => {
    return plans.filter(
      (p) => (p.maturity_level || 'FOUNDATION') === levelFilter && p.status === 'DONE'
    ).length;
  }, [plans, levelFilter]);

  // Filtros - always filter by level (no 'ALL' option for level anymore)
  const filteredPlans = plans.filter((plan) => {
    // Always filter by maturity level
    if ((plan.maturity_level || 'FOUNDATION') !== levelFilter) return false;

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
                <Text fw={700}>
                  {(() => {
                    const key = getCountryTranslationKey(countryLabel);
                    return key ? t(key) : countryLabel;
                  })()}
                </Text>
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
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="flex-start">
        <Box>
          <Title order={2} c="dark.8" fw={800}>
            {t('pages.actionPlans.title')}
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            {isGlobalView
              ? t(
                'pages.actionPlans.descriptionGlobal',
                'Global list of action plans (all units you can view).',
              )
              : t('pages.actionPlans.description')}
          </Text>
        </Box>

        {/* EXPORT BUTTON */}
        <Tooltip
          withArrow
          label={
            isGlobalView
              ? t('pages.actionPlans.useHeaderExport')
              : t('pages.actionPlans.exportToExcel')
          }
        >
          <Button
            variant="light"
            color="green"
            onClick={!isGlobalView ? handleExportExcel : undefined}
            disabled={isGlobalView || filteredPlans.length === 0}
            leftSection={<IconDownload size={16} />}
          >
            {t('pages.actionPlans.export', 'Export')}
          </Button>
        </Tooltip>
      </Group>

      {/* Level Selector - Cards */}
      <LevelSelector
        selectedLevel={levelFilter}
        onLevelChange={setLevelFilter}
        planCounts={levelCounts}
      />

      {/* Level Banner */}
      <LevelBanner
        level={levelFilter}
        planCount={levelCounts[levelFilter]}
        completedCount={completedCount}
      />

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

      {/* Filters Card */}
      <Card
        radius="lg"
        shadow="sm"
        p="lg"
        style={{
          border: '1px solid var(--mantine-color-gray-2)',
        }}
      >
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Group gap="xl" wrap="wrap">
            <div>
              <Group gap="xs" mb={6}>
                <ThemeIcon size="xs" variant="light" color="blue">
                  <IconFilter size={12} />
                </ThemeIcon>
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
                  <ThemeIcon size="xs" variant="light" color="grape">
                    <IconDatabase size={12} />
                  </ThemeIcon>
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

          <TextInput
            size="sm"
            leftSection={<IconSearch size={16} />}
            placeholder={`${t('filters.owner')}...`}
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.currentTarget.value)}
            style={{ minWidth: 220 }}
          />
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
