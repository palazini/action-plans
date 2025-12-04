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
  Paper,
  Stack,
  ThemeIcon,
  rem,
  Box,
  Tooltip,
} from '@mantine/core';
import { 
  IconAlertCircle, 
  IconPlus, 
  IconDatabase, 
  IconListDetails,
  IconClipboardList 
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { fetchBacklogElements } from '../services/api';
import type { ElementWithRelations } from '../types';
import { ActionPlanForm } from '../components/action-plans/ActionPlanForm';

export function BacklogPage() {
  const { t } = useTranslation();
  const { selectedCountry } = useAuth();

  const [elements, setElements] = useState<ElementWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ElementWithRelations | null>(null);
  const [pillarFilter, setPillarFilter] = useState<string>('ALL');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (!selectedCountry) return;
      const data = await fetchBacklogElements(selectedCountry);
      setElements(data);
    } catch (err) {
      console.error(err);
      setError(t('backlog.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedCountry) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

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
        <Table.Td>
            <Group gap="sm">
                <Box w={4} h={24} bg="blue.4" style={{ borderRadius: 4 }} />
                <Text fw={500} size="sm">{el.pillar?.code ?? '-'}</Text>
            </Group>
        </Table.Td>
        <Table.Td>
            <Text fw={500} size="sm">{el.name}</Text>
        </Table.Td>
        <Table.Td>
            <Badge variant="light" color={el.foundation_score < 50 ? 'red' : 'orange'}>
                {el.foundation_score}%
            </Badge>
        </Table.Td>
        <Table.Td>
          {hasPlan ? (
            <Badge color="teal" variant="light" size="sm">
              {el.action_plans.length} {t('backlog.planCountSuffix')}
            </Badge>
          ) : (
            <Badge color="gray" variant="light" size="sm">
              {t('backlog.noPlanBadge')}
            </Badge>
          )}
        </Table.Td>
        <Table.Td align="right">
          <Button
            size="xs"
            variant={hasPlan ? 'light' : 'filled'}
            color={hasPlan ? 'blue' : 'blue'}
            leftSection={<IconPlus size={14} />}
            onClick={() => setSelected(el)}
          >
            {hasPlan ? t('backlog.addAnotherPlan') : t('backlog.createPlan')}
          </Button>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} c="dark.8">{t('pages.backlog.title')}</Title>
          <Text c="dimmed" size="sm">
            {t('pages.backlog.description')}
          </Text>
        </div>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          title={t('actions.error', { defaultValue: 'Erro' })}
          variant="filled"
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Center h={200}>
          <Loader size="lg" type="dots" />
        </Center>
      ) : (
        <Card withBorder radius="md" shadow="sm" p="lg">
          <Group justify="space-between" mb="lg" align="center">
            <Group gap="xs">
                <ThemeIcon variant="light" color="grape" size="md">
                    <IconDatabase style={{ width: rem(18), height: rem(18) }} />
                </ThemeIcon>
                <Text fw={600} size="sm">{t('pages.backlog.filterByPillar')}</Text>
            </Group>
            
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
            <Center p="xl">
                <Stack align="center" gap="xs">
                    <ThemeIcon size={60} radius="xl" variant="light" color="green">
                        <IconListDetails size={30} />
                    </ThemeIcon>
                    <Text fw={600} size="lg" mt="sm">{t('pages.backlog.allClear')}</Text>
                    <Text c="dimmed" size="sm" ta="center">
                        {t('pages.backlog.noElements')}
                    </Text>
                </Stack>
            </Center>
          ) : filteredElements.length === 0 ? (
            <Center p="xl">
                <Stack align="center">
                    <Text c="dimmed">{t('pages.backlog.noElementsForFilter')}</Text>
                </Stack>
            </Center>
          ) : (
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead bg="gray.0">
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
        title={<Text fw={700}>{t('pages.backlog.modalTitle')}</Text>}
        size="lg"
        centered
        overlayProps={{ blur: 3 }}
      >
        {selected && (
          <Stack gap="md">
            {selected.action_plans.length > 0 && (
              <Paper withBorder radius="md" p="md" bg="gray.0">
                <Group mb="xs" gap="xs">
                    <IconClipboardList size={16} style={{ opacity: 0.7 }} />
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    {t('pages.backlog.existingActionsTitle')}
                    </Text>
                </Group>
                
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('table.owner')}</Table.Th>
                      <Table.Th>{t('table.status')}</Table.Th>
                      <Table.Th>{t('table.problem')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selected.action_plans.map((plan) => (
                      <Table.Tr key={plan.id}>
                        <Table.Td>
                            <Text size="xs" fw={500}>{plan.owner_name}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" variant="outline">
                            {t(`status.${plan.status}`)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Tooltip label={plan.problem} multiline w={200}>
                            <Text size="xs" lineClamp={1} style={{ cursor: 'help' }}>
                                {plan.problem}
                            </Text>
                          </Tooltip>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}

            <ActionPlanForm
              element={selected}
              onCancel={() => setSelected(null)}
              onSuccess={async () => {
                setSelected(null);
                await load();
              }}
              country={selectedCountry!}
            />
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}