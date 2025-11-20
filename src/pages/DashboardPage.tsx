// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import {
  Card,
  Group,
  SimpleGrid,
  Text,
  Title,
  Center,
  Loader,
  Alert,
  Table,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { fetchDashboardStats, fetchPillarStats } from '../services/api';
import type { DashboardStats, PillarStats } from '../types';

export function DashboardPage() {
  const { t } = useTranslation();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pillarStats, setPillarStats] = useState<PillarStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [general, perPillar] = await Promise.all([
          fetchDashboardStats(),
          fetchPillarStats(),
        ]);
        setStats(general);
        setPillarStats(perPillar);
      } catch (err) {
        console.error(err);
        setError(t('dashboard.loadError'));
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardsData = stats
    ? [
        { label: t('dashboard.totalElements'), value: stats.totalElements },
        { label: t('dashboard.gapElements'), value: stats.gapElements },
        {
          label: t('dashboard.elementsWithoutPlan'),
          value: stats.elementsWithoutPlan,
        },
      ]
    : [];

  return (
    <>
      <Title order={2} mb="md">
        {t('pages.dashboard.title')}
      </Title>

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

      {loading && (
        <Center mb="md">
          <Loader />
        </Center>
      )}

      {!loading && stats && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
            {cardsData.map((stat) => (
              <Card key={stat.label} shadow="sm" radius="md" p="md" withBorder>
                <Text size="sm" c="dimmed">
                  {stat.label}
                </Text>
                <Text fz={32} fw={700}>
                  {stat.value}
                </Text>
              </Card>
            ))}
          </SimpleGrid>

          <Card withBorder radius="md" shadow="xs" mb="md">
            <Group justify="space-between" mb="xs">
              <Title order={4}>{t('dashboard.perPillarTitle')}</Title>
            </Group>

            {pillarStats.length === 0 ? (
              <Text c="dimmed" size="sm">
                {t('dashboard.noPillarStats')}
              </Text>
            ) : (
              <Table verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('table.pillar')}</Table.Th>
                    <Table.Th>{t('dashboard.gapElementsColumn')}</Table.Th>
                    <Table.Th>{t('dashboard.withPlanColumn')}</Table.Th>
                    <Table.Th>{t('dashboard.withoutPlanColumn')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pillarStats.map((p) => (
                    <Table.Tr key={p.pillarId}>
                      <Table.Td>
                        <Text fw={500}>
                          {p.pillarCode} — {p.pillarName}
                        </Text>
                      </Table.Td>
                      <Table.Td>{p.gapElements}</Table.Td>
                      <Table.Td>{p.elementsWithPlan}</Table.Td>
                      <Table.Td>{p.elementsWithoutPlan}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </>
  );
}
