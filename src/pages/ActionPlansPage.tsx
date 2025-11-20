// src/pages/ActionPlansPage.tsx
import { useEffect, useState } from 'react';
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
} from '@mantine/core';
import {
  IconAlertCircle,
  IconChevronDown,
  IconPencil,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { fetchActionPlans, updateActionPlanStatus } from '../services/api';
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
  const [plans, setPlans] = useState<ActionPlanWithElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pillarFilter, setPillarFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('');

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<ActionPlanWithElement | null>(
    null,
  );

  const currentLang =
    i18n.language && i18n.language.startsWith('en') ? 'en' : 'pt';

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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActionPlans();
      setPlans(data);
    } catch (err) {
      console.error(err);
      setError(t('table.noPlans'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleChangeStatus(
    planId: string,
    newStatus: ActionPlanStatus,
  ) {
    setUpdatingId(planId);
    try {
      await updateActionPlanStatus(planId, newStatus);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  // Opções de pilar para filtro
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

  // Aplica filtros
  const filteredPlans = plans.filter((plan) => {
    if (statusFilter !== 'ALL' && plan.status !== statusFilter) {
      return false;
    }

    if (
      pillarFilter !== 'ALL' &&
      plan.element?.pillar?.id !== pillarFilter
    ) {
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

  const rows = filteredPlans.map((plan) => (
    <Table.Tr key={plan.id}>
      {/* Pilar */}
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        {plan.element?.pillar?.code ?? '-'}
      </Table.Td>

      {/* Elemento */}
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        {plan.element?.name ?? '-'}
      </Table.Td>

      {/* Status */}
      <Table.Td style={{ whiteSpace: 'nowrap', width: 140 }}>
        <Menu withinPortal>
          <Menu.Target>
            <Badge
              color={statusColor(plan.status)}
              variant="light"
              rightSection={<IconChevronDown size={12} />}
              style={{ cursor: 'pointer' }}
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
              >
                {t(`status.${value}`)}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Table.Td>

      {/* Problema */}
      <Table.Td style={{ whiteSpace: 'normal' }}>
        <Text size="sm">{resolveProblem(plan)}</Text>
      </Table.Td>

      {/* Ação */}
      <Table.Td style={{ whiteSpace: 'normal' }}>
        <Text size="sm">{resolveAction(plan)}</Text>
      </Table.Td>

      {/* Responsável */}
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        {plan.owner_name}
      </Table.Td>

      {/* Prazo */}
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        {plan.due_date ?? '-'}
      </Table.Td>

      {/* Ações – lápis */}
      <Table.Td align="right" style={{ width: 40, whiteSpace: 'nowrap' }}>
        <ActionIcon
          variant="subtle"
          aria-label={t('actions.edit')}
          onClick={() => setEditingPlan(plan)}
        >
          <IconPencil size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Group justify="space-between" mb="md">
        <Text fw={600} fz="xl">
          {t('pages.actionPlans.title')}
        </Text>
      </Group>

      {error && (
        <Alert
          mb="md"
          icon={<IconAlertCircle size={16} />}
          color="red"
          title={t('pages.actionPlans.title')}
        >
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card withBorder radius="md" shadow="xs" mb="md">
        <Group justify="space-between" align="flex-end">
          <Group gap="md">
            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {t('filters.status')}
              </Text>
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
                <Text size="xs" c="dimmed" mb={4}>
                  {t('filters.pillar')}
                </Text>
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

          <div style={{ minWidth: 220 }}>
            <Text size="xs" c="dimmed" mb={4}>
              {t('filters.owner')}
            </Text>
            <TextInput
              size="xs"
              placeholder={t('filters.owner')}
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.currentTarget.value)}
            />
          </div>
        </Group>
      </Card>

      {loading ? (
        <Center>
          <Loader />
        </Center>
      ) : plans.length === 0 ? (
        <Card withBorder radius="md" shadow="xs">
          <Text size="sm" c="dimmed">
            {t('table.noPlans')}
          </Text>
        </Card>
      ) : filteredPlans.length === 0 ? (
        <Card withBorder radius="md" shadow="xs">
          <Text size="sm" c="dimmed">
            {t('table.noPlansForFilter')}
          </Text>
        </Card>
      ) : (
        <Card withBorder radius="md" shadow="xs">
          <Table verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('table.pillar')}</Table.Th>
                <Table.Th>{t('table.element')}</Table.Th>
                <Table.Th>{t('table.status')}</Table.Th>
                <Table.Th>{t('table.problem')}</Table.Th>
                <Table.Th>{t('table.action')}</Table.Th>
                <Table.Th>{t('table.owner')}</Table.Th>
                <Table.Th>{t('table.dueDate')}</Table.Th>
                <Table.Th align="right">{t('table.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal
        opened={editingPlan !== null}
        onClose={() => setEditingPlan(null)}
        title={t('actions.edit')}
        size="lg"
        centered
      >
        {editingPlan && (
          <EditActionPlanForm
            plan={editingPlan}
            onCancel={() => setEditingPlan(null)}
            onSuccess={async () => {
              setEditingPlan(null);
              await load();
            }}
          />
        )}
      </Modal>
    </>
  );
}
