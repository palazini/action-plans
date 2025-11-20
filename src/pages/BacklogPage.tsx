// src/pages/BacklogPage.tsx
import { useEffect, useState } from 'react';
import {
  Card,
  Title,
  Text,
  Table,
  Badge,
  Button,
  Group,
  Center,
  Loader,
  Alert,
  Modal,
  SegmentedControl,
} from '@mantine/core';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { fetchBacklogElements } from '../services/api';
import type { ElementWithRelations } from '../types';
import { ActionPlanForm } from '../components/action-plans/ActionPlanForm';

export function BacklogPage() {
  const { t } = useTranslation();

  const [elements, setElements] = useState<ElementWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ElementWithRelations | null>(null);
  const [pillarFilter, setPillarFilter] = useState<string>('ALL');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBacklogElements();
      setElements(data);
    } catch (err) {
      console.error(err);
      setError(t('backlog.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pillarOptions = Array.from(
    new Map(
      elements
        .filter((el) => el.pillar)
        .map((el) => [
          el.pillar!.id,
          {
            label: el.pillar!.code || el.pillar!.name,
            value: el.pillar!.id,
          },
        ]),
    ).values(),
  );

  const filteredElements =
    pillarFilter === 'ALL'
      ? elements
      : elements.filter((el) => el.pillar?.id === pillarFilter);

  const rows = filteredElements.map((el) => {
    const hasPlan = el.action_plans && el.action_plans.length > 0;

    return (
      <Table.Tr key={el.id}>
        <Table.Td>{el.pillar?.code ?? '-'}</Table.Td>
        <Table.Td>{el.name}</Table.Td>
        <Table.Td>{el.foundation_score}</Table.Td>
        <Table.Td>
          {hasPlan ? (
            <Badge color="green" variant="light">
              {el.action_plans.length} {t('backlog.planCountSuffix')}
            </Badge>
          ) : (
            <Badge color="red" variant="light">
              {t('backlog.noPlanBadge')}
            </Badge>
          )}
        </Table.Td>
        <Table.Td>
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            variant={hasPlan ? 'outline' : 'filled'}
            onClick={() => setSelected(el)}
          >
            {hasPlan ? t('backlog.addAnotherPlan') : t('backlog.createPlan')}
          </Button>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <>
      <Title order={2} mb="md">
        {t('pages.backlog.title')}
      </Title>

      <Card withBorder radius="md" shadow="xs" mb="md">
        <Text size="sm" c="dimmed">
          {t('pages.backlog.description')}
        </Text>
      </Card>

      {error && (
        <Alert
          mb="md"
          icon={<IconAlertCircle size={16} />}
          color="red"
          title={t('actions.error', { defaultValue: 'Erro' })}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Center>
          <Loader />
        </Center>
      ) : (
        <Card withBorder radius="md" shadow="xs">
          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">
              {t('pages.backlog.filterByPillar')}
            </Text>
            {pillarOptions.length > 0 && (
              <SegmentedControl
                size="xs"
                value={pillarFilter}
                onChange={setPillarFilter}
                data={[
                  { label: t('filters.status_all'), value: 'ALL' },
                  ...pillarOptions,
                ]}
              />
            )}
          </Group>

          {elements.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('pages.backlog.noElements')}
            </Text>
          ) : filteredElements.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('pages.backlog.noElementsForFilter')}
            </Text>
          ) : (
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('table.pillar')}</Table.Th>
                  <Table.Th>{t('table.element')}</Table.Th>
                  <Table.Th>{t('table.foundation')}</Table.Th>
                  <Table.Th>{t('table.plans')}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          )}
        </Card>
      )}

      <Modal
        opened={selected !== null}
        onClose={() => setSelected(null)}
        title={t('pages.backlog.modalTitle')}
        size="lg"
        centered
      >
        {selected && (
          <>
            {selected.action_plans.length > 0 && (
              <Card withBorder radius="md" shadow="xs" mb="md">
                <Text size="sm" fw={500} mb="xs">
                  {t('pages.backlog.existingActionsTitle')}
                </Text>
                <Table verticalSpacing="xs" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('table.owner')}</Table.Th>
                      <Table.Th>{t('table.status')}</Table.Th>
                      <Table.Th>{t('table.dueDate')}</Table.Th>
                      <Table.Th>{t('table.problem')}</Table.Th>
                      <Table.Th>{t('table.action')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selected.action_plans.map((plan) => (
                      <Table.Tr key={plan.id}>
                        <Table.Td>{plan.owner_name}</Table.Td>
                        <Table.Td>
                          <Badge size="xs" variant="light">
                            {/* status traduzido */}
                            {t(`status.${plan.status}`)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{plan.due_date ?? '-'}</Table.Td>
                        <Table.Td>
                          <Text size="xs" lineClamp={2}>
                            {plan.problem}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" lineClamp={2}>
                            {plan.solution}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            )}

            <ActionPlanForm
              element={selected}
              onCancel={() => setSelected(null)}
              onSuccess={async () => {
                setSelected(null);
                await load();
              }}
            />
          </>
        )}
      </Modal>
    </>
  );
}
