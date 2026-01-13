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
  Box,
  Progress,
  Transition,
} from '@mantine/core';
import { MATURITY_LEVELS, type MaturityLevel } from '../types';
import {
  IconAlertCircle,
  IconListCheck,
  IconAlertTriangle,
  IconClipboardList,
  IconChartBar,
  IconWorld,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats, usePillarStats } from '../hooks/useQueries';
import { GlobalDashboard } from '../components/GlobalDashboard';
import { useState, useEffect } from 'react';

// Stat Card com design premium
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  gradient,
  progress,
  delay = 0,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: any;
  color: string;
  gradient?: { from: string; to: string };
  progress?: number;
  delay?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Animação de contagem para números
  useEffect(() => {
    if (mounted && typeof value === 'number') {
      const duration = 800;
      const steps = 30;
      const stepValue = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.round(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    } else if (typeof value === 'string') {
      setDisplayValue(value as any);
    }
  }, [mounted, value]);

  return (
    <Transition mounted={mounted} transition="slide-up" duration={400}>
      {(styles) => (
        <Paper
          p="lg"
          radius="lg"
          style={{
            ...styles,
            background: gradient
              ? `linear-gradient(135deg, var(--mantine-color-${gradient.from}-0) 0%, var(--mantine-color-${gradient.to}-0) 100%)`
              : 'white',
            border: `1px solid var(--mantine-color-${color}-2)`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
          }}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>
                {title}
              </Text>
              <Text fw={800} size="2rem" c={`${color}.7`} lh={1.2}>
                {typeof value === 'number' ? displayValue : value}
              </Text>
              {subtitle && (
                <Text c="dimmed" size="xs" mt={8}>
                  {subtitle}
                </Text>
              )}
            </div>
            <ThemeIcon
              variant="light"
              color={color}
              size={52}
              radius="lg"
              style={{
                boxShadow: `0 4px 12px var(--mantine-color-${color}-2)`
              }}
            >
              <Icon style={{ width: rem(26), height: rem(26) }} stroke={1.5} />
            </ThemeIcon>
          </Group>

          {progress !== undefined && (
            <Progress
              value={progress}
              color={color}
              size="sm"
              mt="md"
              radius="xl"
              animated
            />
          )}
        </Paper>
      )}
    </Transition>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { selectedCountry } = useAuth();
  const navigate = useNavigate();

  const isGlobalView = selectedCountry === 'Global';

  // React Query hooks
  const { data: stats, isLoading: loadingStats, error: statsError } = useDashboardStats(selectedCountry);
  const { data: pillarStats = [], isLoading: loadingPillar } = usePillarStats(selectedCountry);

  const loading = loadingStats || loadingPillar;
  const error = statsError ? t('dashboard.loadError') : null;


  // Renderização condicional para Global Dashboard
  if (isGlobalView) {
    return <GlobalDashboard />;
  }

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" type="dots" />
      </Center>
    );
  }

  // Fallback caso não tenha país selecionado
  if (!selectedCountry) {
    return (
      <Center h="50vh">
        <Stack align="center">
          <IconWorld size={48} color="gray" opacity={0.5} />
          <Text c="dimmed">{t('dashboard.noCountrySelected')}</Text>
          <Button variant="light" onClick={() => navigate('/')}>
            {t('dashboard.selectRegion')}
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
        title={t('actions.error', { defaultValue: 'Error' })}
        variant="filled"
      >
        {error}
      </Alert>
    );
  }



  return (
    <Stack gap="xl">
      {/* Header */}
      <Box>
        <Title order={2} c="dark.8" fw={800}>
          {t('pages.dashboard.title', 'Overview')}
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          {t('dashboard.subtitle', {
            country: selectedCountry,
            defaultValue: `Action monitoring for ${selectedCountry}`,
          })}
        </Text>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          <StatCard
            title={t('dashboard.totalElements')}
            value={stats.totalElements}
            subtitle={t('dashboard.monitoredItems')}
            icon={IconListCheck}
            color="blue"
            delay={0}
          />

          <StatCard
            title={t('dashboard.gapElements')}
            value={stats.gapElements}
            subtitle={t('dashboard.immediateAttention')}
            icon={IconAlertTriangle}
            color="red"
            delay={200}
          />

          <StatCard
            title={t('dashboard.elementsWithoutPlan')}
            value={stats.elementsWithoutPlan}
            subtitle={t('dashboard.needsActionPlan', 'Needs action plan')}
            icon={IconTrendingUp}
            color="orange"
            delay={300}
          />
        </SimpleGrid>
      )}
      {/* Maturity Summary */}
      {stats && stats.maturityCounts && (
        <Card radius="lg" shadow="sm" p="xl" style={{ border: '1px solid var(--mantine-color-gray-2)' }}>
          <Group justify="space-between" mb="lg">
            <Group gap="sm">
              <ThemeIcon variant="gradient" gradient={{ from: 'orange', to: 'red' }} size="lg" radius="md">
                <IconTrendingUp style={{ width: rem(18), height: rem(18) }} />
              </ThemeIcon>
              <div>
                <Title order={4} fw={700}>{t('maturity.title', 'Maturity Levels')}</Title>
                <Text size="xs" c="dimmed">{t('maturity.progressSubtitle', 'Completion progress by level')}</Text>
              </div>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 2, md: 5 }} spacing="lg">
            {MATURITY_LEVELS.map((level) => {
              const count = stats.maturityCounts[level] || 0;
              const total = stats.totalElements;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

              const colors: Record<MaturityLevel, string> = {
                FOUNDATION: 'blue',
                BRONZE: 'orange',
                SILVER: 'gray',
                GOLD: 'yellow',
                PLATINUM: 'indigo', // Changed from cyan to indigo
              };

              return (
                <Paper key={level} p="md" radius="md" bg="gray.0">
                  <Stack align="center" gap="xs">
                    <RingProgress
                      size={80}
                      thickness={8}
                      roundCaps
                      sections={[{ value: percentage, color: colors[level] }]}
                      label={
                        <Text c="dimmed" fw={700} ta="center" size="xs">
                          {percentage}%
                        </Text>
                      }
                    />
                    <Text fw={600} size="sm" tt="capitalize">{level.toLowerCase()}</Text>
                    <Text size="xs" c="dimmed">{count} / {total}</Text>
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Card>
      )}

      {/* Pillar Stats Table */}
      <Card
        radius="lg"
        shadow="sm"
        p="xl"
        style={{
          border: '1px solid var(--mantine-color-gray-2)',
        }}
      >
        <Group justify="space-between" mb="lg">
          <Group gap="sm">
            <ThemeIcon variant="gradient" gradient={{ from: 'grape', to: 'violet' }} size="lg" radius="md">
              <IconChartBar style={{ width: rem(18), height: rem(18) }} />
            </ThemeIcon>
            <div>
              <Title order={4} fw={700}>{t('dashboard.perPillarTitle')}</Title>
              <Text size="xs" c="dimmed">{t('dashboard.pillarBreakdown', 'Breakdown by pillar')}</Text>
            </div>
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
          <Table verticalSpacing="md" highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '2px solid var(--mantine-color-gray-2)' }}>
                <Table.Th>{t('table.pillar')}</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>{t('dashboard.gapElementsColumn')}</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>{t('dashboard.withPlanColumn')}</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>{t('dashboard.withoutPlanColumn')}</Table.Th>
                <Table.Th style={{ width: 120 }}>{t('dashboard.progress', 'Progress')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pillarStats.map((p) => {
                const total = p.gapElements;
                const withPlan = p.elementsWithPlan;
                const progressPercent = total > 0 ? Math.round((withPlan / total) * 100) : 100;

                return (
                  <Table.Tr key={p.pillarId}>
                    <Table.Td>
                      <Group gap="sm">
                        <Box
                          w={4}
                          h={32}
                          style={{
                            borderRadius: 4,
                            background: `linear-gradient(180deg, var(--mantine-color-blue-4), var(--mantine-color-violet-4))`,
                          }}
                        />
                        <div>
                          <Text fw={600} size="sm">
                            {p.pillarName}
                          </Text>
                          <Text size="xs" c="dimmed">{p.pillarCode}</Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Text fw={700} c={p.gapElements > 0 ? 'red.6' : 'dimmed'}>
                        {p.gapElements}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Text fw={600} c="teal.6">
                        {p.elementsWithPlan}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Text fw={600} c={p.elementsWithoutPlan > 0 ? 'orange.6' : 'dimmed'}>
                        {p.elementsWithoutPlan}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Progress
                          value={progressPercent}
                          color={progressPercent === 100 ? 'teal' : 'blue'}
                          size="sm"
                          radius="xl"
                          style={{ flex: 1 }}
                        />
                        <Text size="xs" c="dimmed" w={32}>
                          {progressPercent}%
                        </Text>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}