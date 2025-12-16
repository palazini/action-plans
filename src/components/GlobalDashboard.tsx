import { useEffect, useState } from 'react';
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
} from '@mantine/core';
import {
    IconAlertCircle,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { fetchGlobalCountryStats, type GlobalCountryStats } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Mapeamento de bandeiras (Copiado para evitar refactor agora, idealmente ficaria em constants)
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

export function GlobalDashboard() {
    const { t } = useTranslation();
    const { setSelectedCountry } = useAuth();
    const [stats, setStats] = useState<GlobalCountryStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await fetchGlobalCountryStats();
                setStats(data);
            } catch (err) {
                console.error(err);
                setError(t('dashboard.loadError'));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [t]);

    const getCountryCode = (name: string) => {
        return COUNTRY_CODES[name] || 'GL';
    };

    const getProgressStore = (item: GlobalCountryStats) => {
        // Progresso: % de Gaps que JÁ têm plano
        // Se não tem gaps, 100% de saúde
        if (item.gapElements === 0) return 100;

        // Gaps resolvidos (ou pelo menos planejados) = Gaps Totais - Gaps Sem Plano
        const plannedGaps = item.gapElements - item.elementsWithoutPlan;
        const pct = (plannedGaps / item.gapElements) * 100;
        return Math.round(pct);
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
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro" variant="filled">
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

            <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 5 }} spacing="lg">
                {stats.map((item) => {
                    const code = getCountryCode(item.country);
                    const progress = getProgressStore(item);
                    const color = getProgressColor(progress);

                    return (
                        <UnstyledButton
                            key={item.country}
                            onClick={() => setSelectedCountry(item.country)}
                            style={{ transition: 'transform 0.2s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <Card withBorder radius="md" shadow="sm" p="md" h="100%">
                                <Stack align="center" gap="md">

                                    {/* Bandeira com Anel de Progresso */}
                                    <RingProgress
                                        size={120}
                                        roundCaps
                                        thickness={8}
                                        sections={[{ value: progress, color }]}
                                        label={
                                            <Center>
                                                <Image
                                                    src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
                                                    w={64}
                                                    h={code === 'GL' ? 64 : 'auto'} // Ajuste se for global
                                                    radius="sm"
                                                    fit="contain"
                                                    style={{ border: '1px solid #dee2e6' }}
                                                />
                                            </Center>
                                        }
                                    />

                                    <div style={{ textAlign: 'center' }}>
                                        <Text fw={700} size="lg" lh={1.2}>
                                            {item.country}
                                        </Text>
                                        <Text size="xs" c="dimmed" mt={4}>
                                            {progress}% {t('dashboard.coverage', 'Coaptação')}
                                        </Text>
                                    </div>

                                    <Group gap="xl" align="center" justify="center" w="100%">
                                        <Tooltip label={t('dashboard.global.gaps', 'Gaps')}>
                                            <div style={{ textAlign: 'center' }}>
                                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{t('dashboard.global.gapsShort', 'Gaps')}</Text>
                                                <Text fw={700} size="lg" c="red.7">{item.gapElements}</Text>
                                            </div>
                                        </Tooltip>

                                        <Tooltip label={t('dashboard.global.withoutPlan', 'Sem Plano')}>
                                            <div style={{ textAlign: 'center' }}>
                                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{t('dashboard.global.pendingShort', 'Pend.')}</Text>
                                                <Text fw={700} size="lg" c="orange.7">{item.elementsWithoutPlan}</Text>
                                            </div>
                                        </Tooltip>

                                        <Tooltip label={t('dashboard.global.definedPlans', 'Planos')}>
                                            <div style={{ textAlign: 'center' }}>
                                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{t('dashboard.global.plansShort', 'Planos')}</Text>
                                                <Text fw={700} size="lg" c="blue.7">{item.elementsWithPlan}</Text>
                                            </div>
                                        </Tooltip>
                                    </Group>
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
