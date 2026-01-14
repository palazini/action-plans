import {
    Card,
    Title,
    Text,
    Loader,
    Center,
    Group,
    SimpleGrid,
    RingProgress,
    Image,
    Stack,
    Alert,
    UnstyledButton,
    Tooltip,
    Progress,
    Badge,
    ThemeIcon,
    Box,
    Divider,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconTrophy,
    IconClipboardCheck,
    IconListCheck,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useGlobalCountryStats } from '../hooks/useQueries';
import { useAuth } from '../contexts/AuthContext';
import type { GlobalCountryStats, PillarSummary } from '../services/api';

// Mapeamento de bandeiras
const COUNTRY_CODES: Record<string, string> = {
    'Global': 'GL',
    'Argentina': 'AR',
    'Brazil': 'BR',
    'Brazil (Hiter)': 'BR',
    'China': 'CN',
    'Germany (Gestra)': 'DE',
    'France': 'FR',
    'India': 'IN',
    'Italy': 'IT',
    'UK': 'GB',
    'USA': 'US',
};

// Color helpers
const getScoreColor = (score: number) => {
    if (score >= 90) return 'teal';
    if (score >= 70) return 'blue';
    if (score >= 50) return 'yellow';
    return 'red';
};

const getPillarColor = (avgScore: number) => {
    if (avgScore >= 90) return '#10b981'; // teal
    if (avgScore >= 70) return '#3b82f6'; // blue
    if (avgScore >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
};

// Mini Pillar Heatmap Component
function PillarHeatmap({ pillars }: { pillars: PillarSummary[] }) {
    if (pillars.length === 0) return null;

    return (
        <Group gap={4} wrap="wrap" justify="center">
            {pillars.slice(0, 8).map((p) => (
                <Tooltip
                    key={p.pillarId}
                    label={`${p.pillarCode}: ${p.pillarName} - ${p.avgScore}% (${p.gapCount} gaps)`}
                    multiline
                    w={200}
                >
                    <Box
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            backgroundColor: getPillarColor(p.avgScore),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        <Text size="xs" fw={700} c="white">
                            {p.pillarCode.split('-')[0]}
                        </Text>
                    </Box>
                </Tooltip>
            ))}
        </Group>
    );
}

export function GlobalDashboard() {
    const { t } = useTranslation();
    const { setSelectedCountry } = useAuth();

    const { data: stats = [], isLoading: loading, error: queryError } = useGlobalCountryStats();
    const error = queryError ? t('dashboard.loadError') : null;

    const getCountryCode = (name: string) => COUNTRY_CODES[name] || 'GL';

    const getCoverageProgress = (item: GlobalCountryStats) => {
        if (item.gapElements === 0) return 100;
        const plannedGaps = item.gapElements - item.elementsWithoutPlan;
        return Math.round((plannedGaps / item.gapElements) * 100);
    };

    const getProgressColor = (pct: number) => {
        if (pct >= 100) return 'teal';
        if (pct >= 50) return 'yellow';
        return 'red';
    };

    if (loading) {
        return (
            <Center h={400}>
                <Loader size="lg" type="dots" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('actions.error')} variant="filled">
                {error}
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="center">
                <div>
                    <Title order={2} c="dark.8">
                        {t('dashboard.global.title', 'Visão Global por País')}
                    </Title>
                    <Text c="dimmed" size="sm">
                        {t('dashboard.subtitleGlobal', 'Monitoramento global de ações')}
                    </Text>
                </div>
            </Group>

            <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="lg">
                {stats.map((item) => {
                    const code = getCountryCode(item.country);
                    const coverage = getCoverageProgress(item);
                    const coverageColor = getProgressColor(coverage);
                    const completionRate = item.totalActionPlans > 0
                        ? Math.round((item.completedActionPlans / item.totalActionPlans) * 100)
                        : 0;

                    return (
                        <UnstyledButton
                            key={item.country}
                            onClick={() => setSelectedCountry(item.country)}
                            style={{ transition: 'transform 0.2s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <Card
                                withBorder
                                radius="lg"
                                shadow="sm"
                                p="md"
                                h="100%"
                                style={{
                                    background: 'linear-gradient(135deg, white 0%, #f8fafc 100%)',
                                    border: '1px solid var(--mantine-color-gray-2)',
                                }}
                            >
                                <Stack gap="md">
                                    {/* Header: Flag + Country Name */}
                                    <Group justify="space-between" align="flex-start">
                                        <Group gap="sm">
                                            <Image
                                                src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                                w={32}
                                                h="auto"
                                                radius="xs"
                                                style={{ border: '1px solid #e5e7eb' }}
                                            />
                                            <div>
                                                <Text fw={700} size="md" lh={1.2}>
                                                    {item.country}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {item.totalElements} elements
                                                </Text>
                                            </div>
                                        </Group>
                                        <Badge
                                            variant="light"
                                            color={getScoreColor(item.foundationAvgScore)}
                                            size="lg"
                                        >
                                            {item.foundationAvgScore}%
                                        </Badge>
                                    </Group>

                                    <Divider />

                                    {/* Foundation Score */}
                                    <div>
                                        <Group justify="space-between" mb={4}>
                                            <Group gap={4}>
                                                <ThemeIcon size="xs" variant="light" color="blue">
                                                    <IconTrophy size={10} />
                                                </ThemeIcon>
                                                <Text size="xs" c="dimmed">Foundation</Text>
                                            </Group>
                                            <Text size="xs" fw={600}>
                                                {item.foundationCompleteCount}/{item.totalElements}
                                            </Text>
                                        </Group>
                                        <Progress
                                            value={item.totalElements > 0 ? (item.foundationCompleteCount / item.totalElements) * 100 : 0}
                                            color={getScoreColor(item.foundationAvgScore)}
                                            size="sm"
                                            radius="xl"
                                        />
                                    </div>

                                    {/* Gaps & Plans Row */}
                                    <SimpleGrid cols={3} spacing="xs">
                                        <Tooltip label={t('dashboard.global.gaps', 'Gaps')}>
                                            <div style={{ textAlign: 'center' }}>
                                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                                    Gaps
                                                </Text>
                                                <Text fw={700} size="lg" c="red.6">
                                                    {item.gapElements}
                                                </Text>
                                            </div>
                                        </Tooltip>

                                        <Tooltip label={t('dashboard.global.withPlan', 'Com Plano')}>
                                            <div style={{ textAlign: 'center' }}>
                                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                                    Planos
                                                </Text>
                                                <Text fw={700} size="lg" c="blue.6">
                                                    {item.elementsWithPlan}
                                                </Text>
                                            </div>
                                        </Tooltip>

                                        <Tooltip label={t('dashboard.global.withoutPlan', 'Sem Plano')}>
                                            <div style={{ textAlign: 'center' }}>
                                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                                    Pend.
                                                </Text>
                                                <Text fw={700} size="lg" c="orange.6">
                                                    {item.elementsWithoutPlan}
                                                </Text>
                                            </div>
                                        </Tooltip>
                                    </SimpleGrid>

                                    {/* Action Plans Progress */}
                                    <div>
                                        <Group justify="space-between" mb={4}>
                                            <Group gap={4}>
                                                <ThemeIcon size="xs" variant="light" color="teal">
                                                    <IconClipboardCheck size={10} />
                                                </ThemeIcon>
                                                <Text size="xs" c="dimmed">Planos Concluídos</Text>
                                            </Group>
                                            <Text size="xs" fw={600}>
                                                {item.completedActionPlans}/{item.totalActionPlans}
                                            </Text>
                                        </Group>
                                        <Progress
                                            value={completionRate}
                                            color="teal"
                                            size="sm"
                                            radius="xl"
                                        />
                                    </div>

                                    {/* Plans Coverage Ring */}
                                    <Group justify="space-between" align="center">
                                        <Group gap={4}>
                                            <ThemeIcon size="xs" variant="light" color={coverageColor}>
                                                <IconListCheck size={10} />
                                            </ThemeIcon>
                                            <Text size="xs" c="dimmed">Planos Definidos</Text>
                                        </Group>
                                        <RingProgress
                                            size={48}
                                            thickness={5}
                                            roundCaps
                                            sections={[{ value: coverage, color: coverageColor }]}
                                            label={
                                                <Center>
                                                    <Text size="10px" fw={700}>
                                                        {coverage}%
                                                    </Text>
                                                </Center>
                                            }
                                        />
                                    </Group>

                                    {/* Pillar Heatmap */}
                                    {item.pillarSummary.length > 0 && (
                                        <>
                                            <Divider />
                                            <div>
                                                <Text size="xs" c="dimmed" mb={6} ta="center">
                                                    Pilares
                                                </Text>
                                                <PillarHeatmap pillars={item.pillarSummary} />
                                            </div>
                                        </>
                                    )}
                                </Stack>
                            </Card>
                        </UnstyledButton>
                    );
                })}
            </SimpleGrid>

            {stats.length === 0 && (
                <Center p="xl">
                    <Text c="dimmed">{t('table.noPlans', 'Nenhum registro encontrado.')}</Text>
                </Center>
            )}
        </Stack>
    );
}
