import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ThemeIcon,
  Paper,
  Stack,
  RingProgress,
  rem,
  Button,
  Box, // Adicionado aqui
} from '@mantine/core';
import { 
  IconAlertCircle, 
  IconListCheck, 
  IconAlertTriangle, 
  IconClipboardList, 
  IconChartBar,
  IconWorld
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { fetchDashboardStats, fetchPillarStats } from '../services/api';
import type { DashboardStats, PillarStats } from '../types';

export function DashboardPage() {
  const { t } = useTranslation();
  const { selectedCountry } = useAuth();
  const navigate = useNavigate();

  const isGlobalView = selectedCountry === 'Global';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pillarStats, setPillarStats] = useState<PillarStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se não tiver país selecionado, paramos o loading imediatamente
    if (!selectedCountry) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [general, perPillar] = await Promise.all([
          fetchDashboardStats(selectedCountry!),
          fetchPillarStats(selectedCountry!),
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
  }, [selectedCountry]);

  // Função auxiliar para calcular porcentagem simples
  const getProgress = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" type="dots" />
      </Center>
    );
  }

  // Fallback caso não tenha país selecionado (evita tela branca)
  if (!selectedCountry) {
    return (
      <Center h="50vh">
        <Stack align="center">
          <IconWorld size={48} color="gray" opacity={0.5} />
          <Text c="dimmed">Nenhum país selecionado.</Text>
          <Button variant="light" onClick={() => navigate('/')}>
            Selecionar Região
          </Button>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        color="red"
        title={t('actions.error', { defaultValue: 'Erro' })}
        variant="filled"
      >
        {error}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} c="dark.8">{t('pages.dashboard.title', 'Visão Geral')}</Title>
          <Text c="dimmed" size="sm">
            {isGlobalView
              ? t('dashboard.subtitleGlobal', 'Monitoramento global de ações (todas as plantas)')
              : t('dashboard.subtitle', {
                  country: selectedCountry,
                  defaultValue: `Monitoramento de ações para ${selectedCountry}`,
                })}
          </Text>
        </div>
        {/* Aqui poderia entrar um filtro de data ou botão de refresh */}
      </Group>

      {stats && (
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {/* Card 1: Total de Elementos */}
          <Paper withBorder p="md" radius="md" shadow="xs">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('dashboard.totalElements')}
                </Text>
                <Text fw={700} size="xl" mt="xs">
                  {stats.totalElements}
                </Text>
              </div>
              <ThemeIcon variant="light" color="blue" size="xl" radius="md">
                <IconListCheck style={{ width: rem(22), height: rem(22) }} />
              </ThemeIcon>
            </Group>
            <Text c="dimmed" size="xs" mt="md">
              {t('dashboard.monitoredItems')}
            </Text>
          </Paper>

          {/* Card 2: Elementos com Gap (Atenção) */}
          <Paper withBorder p="md" radius="md" shadow="xs">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('dashboard.gapElements')}
                </Text>
                <Text fw={700} size="xl" mt="xs" c="red.7">
                  {stats.gapElements}
                </Text>
              </div>
              <ThemeIcon variant="light" color="red" size="xl" radius="md">
                <IconAlertTriangle style={{ width: rem(22), height: rem(22) }} />
              </ThemeIcon>
            </Group>
             <Text c="dimmed" size="xs" mt="md">
              {t('dashboard.immediateAttention')}
            </Text>
          </Paper>

          {/* Card 3: Sem Plano de Ação */}
          <Paper withBorder p="md" radius="md" shadow="xs">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('dashboard.elementsWithoutPlan')}
                </Text>
                <Text fw={700} size="xl" mt="xs" c="orange.7">
                  {stats.elementsWithoutPlan}
                </Text>
              </div>
               {/* Exemplo de mini gráfico de progresso visual */}
               <RingProgress
                  size={50}
                  roundCaps
                  thickness={4}
                  sections={[{ value: getProgress(stats.elementsWithoutPlan, stats.totalElements), color: 'orange' }]}
                />
            </Group>
            <Text c="dimmed" size="xs" mt="md">
              {t('dashboard.percentWithoutPlan', { percent: getProgress(stats.elementsWithoutPlan, stats.totalElements) })}
            </Text>
          </Paper>
        </SimpleGrid>
      )}

      <Card withBorder radius="md" shadow="sm" p="lg">
        <Group justify="space-between" mb="lg">
          <Group gap="xs">
            <ThemeIcon variant="light" color="grape">
              <IconChartBar style={{ width: rem(18), height: rem(18) }} />
            </ThemeIcon>
            <Title order={4}>{t('dashboard.perPillarTitle')}</Title>
          </Group>
        </Group>

        {pillarStats.length === 0 ? (
          <Center p="xl">
            <Stack align="center" gap="xs">
              <IconClipboardList size={40} color="gray" opacity={0.5} />
              <Text c="dimmed" size="sm">
                {t('dashboard.noPillarStats')}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead bg="gray.0">
              <Table.Tr>
                <Table.Th>{t('table.pillar')}</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>{t('dashboard.gapElementsColumn')}</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>{t('dashboard.withPlanColumn')}</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>{t('dashboard.withoutPlanColumn')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pillarStats.map((p) => (
                <Table.Tr key={p.pillarId}>
                  <Table.Td>
                    <Group gap="sm">
                       {/* Um pequeno indicador de cor para o pilar */}
                      <Box w={4} h={24} bg="blue.4" style={{ borderRadius: 4 }} />
                      <div>
                        <Text fw={600} size="sm">
                            {p.pillarName}
                        </Text>
                        <Text size="xs" c="dimmed">{p.pillarCode}</Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Text fw={700} c={p.gapElements > 0 ? 'red.7' : 'dimmed'}>
                        {p.gapElements}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Text fw={500} c="teal.7">
                        {p.elementsWithPlan}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Text fw={500} c={p.elementsWithoutPlan > 0 ? 'orange.7' : 'dimmed'}>
                        {p.elementsWithoutPlan}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}