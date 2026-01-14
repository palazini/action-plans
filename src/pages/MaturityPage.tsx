// src/pages/MaturityPage.tsx
import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Center,
    Drawer,
    Group,
    Loader,
    Paper,
    Progress,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Title,
    ThemeIcon,
    Badge,
    Tooltip,
    ActionIcon,
    NumberInput,
    Textarea,
    Button,
    Accordion,
    Divider,
    Alert,
} from '@mantine/core';
import {
    IconTrophy,
    IconMedal,
    IconAward,
    IconCrown,
    IconDiamond,
    IconLock,
    IconCheck,
    IconChevronRight,
    IconInfoCircle,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPillarsWithLevelScores, updateLevelScore, fetchMaturityStats } from '../services/api';
import type { MaturityLevel, ElementWithLevelScores } from '../types';
import { MATURITY_LEVELS } from '../types';

// Level configuration
const LEVEL_CONFIG: Record<MaturityLevel, {
    icon: any;
    color: string;
    gradient: { from: string; to: string };
    labelKey: string;
}> = {
    FOUNDATION: {
        icon: IconTrophy,
        color: 'gray',
        gradient: { from: 'gray.4', to: 'gray.6' },
        labelKey: 'maturity.levels.FOUNDATION',
    },
    BRONZE: {
        icon: IconMedal,
        color: 'orange',
        gradient: { from: 'orange.4', to: 'orange.7' },
        labelKey: 'maturity.levels.BRONZE',
    },
    SILVER: {
        icon: IconAward,
        color: 'gray',
        gradient: { from: 'gray.3', to: 'gray.5' },
        labelKey: 'maturity.levels.SILVER',
    },
    GOLD: {
        icon: IconCrown,
        color: 'yellow',
        gradient: { from: 'yellow.4', to: 'yellow.6' },
        labelKey: 'maturity.levels.GOLD',
    },
    PLATINUM: {
        icon: IconDiamond,
        color: 'violet',
        gradient: { from: 'violet.4', to: 'violet.7' },
        labelKey: 'maturity.levels.PLATINUM',
    },
};

// Helper function to get criteria for a level (handles both DB structures)
function getCriteriaForLevel(criteria: any, level: MaturityLevel): string | null {
    if (!criteria) return null;

    // Structure 1: { maturity_levels: { FOUNDATION: "..." } }
    if (criteria.maturity_levels && criteria.maturity_levels[level]) {
        return criteria.maturity_levels[level];
    }

    // Structure 2: { FOUNDATION: "...", BRONZE: "..." } (direct)
    if (criteria[level] && typeof criteria[level] === 'string') {
        return criteria[level];
    }

    return null;
}

// Helper function to get behaviour from criteria
function getBehaviour(criteria: any): string | null {
    if (!criteria) return null;
    return criteria.behaviour || null;
}

// Level Card Component
function LevelCard({
    level,
    avgScore,
    completed,
    total,
    isLocked,
}: {
    level: MaturityLevel;
    avgScore: number;
    completed: number;
    total: number;
    isLocked: boolean;
}) {
    const config = LEVEL_CONFIG[level];
    const Icon = config.icon;

    // Define background colors
    const getBackground = () => {
        if (isLocked) return 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
        switch (level) {
            case 'FOUNDATION': return 'linear-gradient(135deg, #6b7280 0%, #374151 100%)';
            case 'BRONZE': return 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
            case 'SILVER': return 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)';
            case 'GOLD': return 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)';
            case 'PLATINUM': return 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)';
            default: return 'var(--mantine-color-gray-1)';
        }
    };

    // Using t() inside component since config is static
    const { t } = useTranslation();

    return (
        <Paper
            p="md"
            radius="lg"
            style={{
                background: getBackground(),
                border: '1px solid var(--mantine-color-gray-3)',
                transition: 'all 0.3s ease',
                boxShadow: isLocked ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
                opacity: isLocked ? 0.7 : 1,
                position: 'relative',
            }}
        >
            {/* Lock Overlay */}
            {isLocked && (
                <Box
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(255,255,255,0.9)',
                        borderRadius: '50%',
                        padding: 4,
                    }}
                >
                    <IconLock size={16} color="#6b7280" />
                </Box>
            )}

            <Stack gap="xs" align="center">
                <ThemeIcon
                    size={48}
                    radius="xl"
                    variant="white"
                    color={isLocked ? 'gray' : config.color}
                    style={{ background: isLocked ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}
                >
                    {isLocked ? (
                        <IconLock size={24} color="#9ca3af" />
                    ) : (
                        <Icon size={24} color="white" />
                    )}
                </ThemeIcon>

                <Text
                    size="sm"
                    fw={700}
                    c={isLocked ? 'gray.6' : 'white'}
                    tt="uppercase"
                >
                    {t(config.labelKey)}
                </Text>

                <Text
                    size="xl"
                    fw={800}
                    c={isLocked ? 'gray.5' : 'white'}
                >
                    {isLocked ? '—' : `${avgScore}%`}
                </Text>

                {!isLocked && (
                    <Progress
                        value={avgScore}
                        size="sm"
                        radius="xl"
                        color="white"
                        style={{ width: '100%' }}
                    />
                )}

                <Text size="xs" c={isLocked ? 'gray.5' : 'rgba(255,255,255,0.8)'}>
                    {isLocked ? t('maturity.locked', 'Complete previous level') : t('maturity.complete', { completed, total })}
                </Text>
            </Stack>
        </Paper>
    );
}



// Element Row Component
function ElementRow({
    element,
    onSelect,
}: {
    element: ElementWithLevelScores;
    onSelect: () => void;
}) {
    // Calculate current level (highest with 100%)
    const getCurrentLevel = (): MaturityLevel => {
        for (let i = MATURITY_LEVELS.length - 1; i >= 0; i--) {
            const level = MATURITY_LEVELS[i];
            const score = element.levels[level]?.score ?? 0;
            if (score === 100) return level;
        }
        return 'FOUNDATION';
    };

    const currentLevel = getCurrentLevel();
    const currentLevelIndex = MATURITY_LEVELS.indexOf(currentLevel);

    return (
        <Table.Tr
            style={{ cursor: 'pointer' }}
            onClick={onSelect}
        >
            <Table.Td>
                <Group gap="sm">
                    <Box
                        w={4}
                        h={28}
                        style={{
                            borderRadius: 4,
                            background: `linear-gradient(180deg, var(--mantine-color-blue-4), var(--mantine-color-violet-4))`,
                        }}
                    />
                    <div>
                        <Text size="sm" fw={600}>{element.name}</Text>
                        <Text size="xs" c="dimmed">{element.code}</Text>
                    </div>
                </Group>
            </Table.Td>

            {MATURITY_LEVELS.map((level, idx) => {
                const score = element.levels[level]?.score ?? 0;
                const isComplete = score === 100;
                const isLocked = idx > currentLevelIndex + 1;
                const isCurrent = idx === currentLevelIndex + 1 || (idx === 0 && currentLevelIndex === -1);

                // Better colors for visibility
                const { t } = useTranslation();
                const getBadgeColor = () => {
                    if (!isCurrent) return 'gray';
                    switch (level) {
                        case 'FOUNDATION': return 'dark';
                        case 'BRONZE': return 'orange';
                        case 'SILVER': return 'gray';
                        case 'GOLD': return 'yellow';
                        case 'PLATINUM': return 'violet';
                        default: return 'blue';
                    }
                };

                return (
                    <Table.Td key={level} style={{ textAlign: 'center', width: 80 }}>
                        {isLocked ? (
                            <Tooltip label={t('maturity.unlockTooltip', 'Complete previous level to unlock')}>
                                <ThemeIcon size="sm" variant="light" color="gray">
                                    <IconLock size={12} />
                                </ThemeIcon>
                            </Tooltip>
                        ) : isComplete ? (
                            <ThemeIcon size="sm" variant="filled" color="teal">
                                <IconCheck size={12} />
                            </ThemeIcon>
                        ) : (
                            <Badge
                                size="sm"
                                variant={isCurrent ? 'filled' : 'outline'}
                                color={getBadgeColor()}
                                style={isCurrent ? { fontWeight: 700 } : { color: 'var(--mantine-color-gray-6)' }}
                            >
                                {score}%
                            </Badge>
                        )}
                    </Table.Td>
                );
            })}

            <Table.Td>
                <ActionIcon variant="subtle" color="blue">
                    <IconChevronRight size={16} />
                </ActionIcon>
            </Table.Td>
        </Table.Tr>
    );
}

// Detail Drawer Component
function MaturityDetailDrawer({
    element,
    country,
    onClose,
    onUpdate,
}: {
    element: ElementWithLevelScores | null;
    country: string;
    onClose: () => void;
    onUpdate: () => void;
}) {
    const { t } = useTranslation();
    const [editingLevel, setEditingLevel] = useState<MaturityLevel | null>(null);
    const [score, setScore] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: updateLevelScore,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pillarsWithLevelScores'] });
            queryClient.invalidateQueries({ queryKey: ['maturityStats'] });
            setEditingLevel(null);
            onUpdate();
        },
    });

    if (!element) return null;

    // Calculate current level
    const getCurrentLevelIndex = (): number => {
        for (let i = MATURITY_LEVELS.length - 1; i >= 0; i--) {
            const level = MATURITY_LEVELS[i];
            const s = element.levels[level]?.score ?? 0;
            if (s === 100) return i;
        }
        return -1;
    };

    const currentLevelIndex = getCurrentLevelIndex();

    const handleStartEdit = (level: MaturityLevel) => {
        setEditingLevel(level);
        setScore(element.levels[level]?.score ?? 0);
        setNotes(element.levels[level]?.notes ?? '');
    };

    const handleSave = () => {
        if (!editingLevel) return;

        updateMutation.mutate({
            elementId: element.id,
            country,
            level: editingLevel,
            score,
            notes: notes || null,
        });
    };

    return (
        <Drawer
            opened={!!element}
            onClose={onClose}
            position="right"
            size="lg"
            title={
                <Group gap="sm">
                    <ThemeIcon variant="light" color="blue" size="lg">
                        <IconInfoCircle size={20} />
                    </ThemeIcon>
                    <div>
                        <Text fw={700}>{element.name}</Text>
                        <Text size="xs" c="dimmed">{element.code}</Text>
                    </div>
                </Group>
            }
        >
            <Stack gap="lg">
                {/* Progress Overview */}
                <Paper p="md" radius="md" bg="gray.0">
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">{t('maturity.overallProgress', 'Overall Progress')}</Text>
                        <Badge color={LEVEL_CONFIG[MATURITY_LEVELS[Math.max(0, currentLevelIndex)]]?.color}>
                            {t(LEVEL_CONFIG[MATURITY_LEVELS[Math.max(0, currentLevelIndex)]]?.labelKey) || t('maturity.starting')}
                        </Badge>
                    </Group>
                    <Progress.Root size="xl" radius="xl">
                        {MATURITY_LEVELS.map((level) => {
                            const s = element.levels[level]?.score ?? 0;
                            return (
                                <Progress.Section
                                    key={level}
                                    value={s / 5}
                                    color={LEVEL_CONFIG[level].color}
                                >
                                    {s > 20 && <Progress.Label>{level.charAt(0)}</Progress.Label>}
                                </Progress.Section>
                            );
                        })}
                    </Progress.Root>
                </Paper>

                {/* Element Behaviour/Description */}
                {getBehaviour(element.criteria) && (
                    <Paper p="md" radius="md" bg="violet.0" style={{ border: '1px solid var(--mantine-color-violet-2)' }}>
                        <Group gap="xs" mb="xs">
                            <ThemeIcon size="sm" variant="light" color="violet" radius="xl">
                                <IconInfoCircle size={14} />
                            </ThemeIcon>
                            <Text size="sm" fw={600} c="violet.7">
                                {t('maturity.behaviour', 'Expected Behaviour')}
                            </Text>
                        </Group>
                        <Text size="sm" c="dark.6" lh={1.6}>
                            {getBehaviour(element.criteria)}
                        </Text>
                    </Paper>
                )}

                <Divider />

                {/* Level Accordion */}
                <Accordion variant="separated" radius="md">
                    {MATURITY_LEVELS.map((level, idx) => {
                        const levelScore = element.levels[level]?.score ?? 0;
                        const isComplete = levelScore === 100;
                        const isLocked = idx > currentLevelIndex + 1;
                        const isCurrent = idx === currentLevelIndex + 1 || (idx === 0 && currentLevelIndex === -1);
                        const config = LEVEL_CONFIG[level];
                        const Icon = config.icon;

                        return (
                            <Accordion.Item key={level} value={level}>
                                <Accordion.Control
                                    icon={
                                        isComplete ? (
                                            <ThemeIcon size="sm" variant="filled" color="teal" radius="xl">
                                                <IconCheck size={12} />
                                            </ThemeIcon>
                                        ) : isLocked ? (
                                            <ThemeIcon size="sm" variant="light" color="gray" radius="xl">
                                                <IconLock size={12} />
                                            </ThemeIcon>
                                        ) : (
                                            <ThemeIcon size="sm" variant="light" color={config.color} radius="xl">
                                                <Icon size={12} />
                                            </ThemeIcon>
                                        )
                                    }
                                    disabled={isLocked}
                                >
                                    <Group justify="space-between" style={{ flex: 1 }} pr="md">
                                        <Text fw={600}>{t(config.labelKey)}</Text>
                                        {!isLocked && (
                                            <Badge
                                                variant={isCurrent ? 'filled' : 'light'}
                                                color={isComplete ? 'teal' : config.color}
                                            >
                                                {levelScore}%
                                            </Badge>
                                        )}
                                    </Group>
                                </Accordion.Control>

                                <Accordion.Panel>
                                    <Stack gap="md">
                                        {/* Criteria from DB */}
                                        {(() => {
                                            const levelCriteria = getCriteriaForLevel(element.criteria, level);
                                            return levelCriteria ? (
                                                <Paper p="sm" radius="md" bg="blue.0" style={{ border: '1px solid var(--mantine-color-blue-2)' }}>
                                                    <Text size="xs" fw={600} c="blue.7" mb={4}>
                                                        {t('maturity.whatIsExpected', 'What is Expected')}
                                                    </Text>
                                                    <Text size="sm" c="dark.6" lh={1.5}>
                                                        {levelCriteria}
                                                    </Text>
                                                </Paper>
                                            ) : (
                                                <Alert variant="light" color="gray" icon={<IconInfoCircle size={16} />}>
                                                    <Text size="sm">
                                                        {t('maturity.noCriteria', 'No specific criteria defined for this level.')}
                                                    </Text>
                                                </Alert>
                                            );
                                        })()}

                                        {/* Score Edit */}
                                        {!isLocked && (
                                            <>
                                                {editingLevel === level ? (
                                                    <Stack gap="sm">
                                                        <NumberInput
                                                            label={t('maturity.score', 'Score')}
                                                            value={score}
                                                            onChange={(v) => setScore(Number(v) || 0)}
                                                            min={0}
                                                            max={100}
                                                            suffix="%"
                                                        />
                                                        <Textarea
                                                            label={t('maturity.notes', 'Notes')}
                                                            value={notes}
                                                            onChange={(e) => setNotes(e.target.value)}
                                                            placeholder={t('maturity.notesPlaceholder', 'Add notes...')}
                                                        />
                                                        <Group>
                                                            <Button
                                                                onClick={handleSave}
                                                                loading={updateMutation.isPending}
                                                            >
                                                                {t('actions.save', 'Save')}
                                                            </Button>
                                                            <Button
                                                                variant="subtle"
                                                                onClick={() => setEditingLevel(null)}
                                                            >
                                                                {t('actions.cancel', 'Cancel')}
                                                            </Button>
                                                        </Group>
                                                    </Stack>
                                                ) : (
                                                    <Group>
                                                        <Text size="sm" c="dimmed">
                                                            {t('maturity.currentScore', 'Current score')}: <strong>{levelScore}%</strong>
                                                        </Text>
                                                        <Button
                                                            size="xs"
                                                            variant="light"
                                                            onClick={() => handleStartEdit(level)}
                                                        >
                                                            {t('actions.edit', 'Edit')}
                                                        </Button>
                                                    </Group>
                                                )}
                                            </>
                                        )}
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>
            </Stack>
        </Drawer >
    );
}

// Main Page Component
export function MaturityPage() {
    const { t } = useTranslation();
    const { selectedCountry } = useAuth();
    const [selectedElement, setSelectedElement] = useState<ElementWithLevelScores | null>(null);
    const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);

    // Fetch data
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['pillarsWithLevelScores', selectedCountry],
        queryFn: () => fetchPillarsWithLevelScores(selectedCountry ?? 'Global'),
        enabled: !!selectedCountry,
    });

    const { data: stats } = useQuery({
        queryKey: ['maturityStats', selectedCountry],
        queryFn: () => fetchMaturityStats(selectedCountry ?? 'Global'),
        enabled: !!selectedCountry,
    });

    // Auto-select first pillar
    useEffect(() => {
        if (data?.pillars && data.pillars.length > 0 && !selectedPillarId) {
            setSelectedPillarId(data.pillars[0].id);
        }
    }, [data, selectedPillarId]);

    const selectedPillar = data?.pillars.find(p => p.id === selectedPillarId);

    if (isLoading) {
        return (
            <Center h={400}>
                <Loader size="lg" type="dots" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle />} color="red" title={t('actions.error')}>
                {t('maturity.loadError', 'Failed to load maturity data')}
            </Alert>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Box>
                <Title order={2} c="dark.8" fw={800}>
                    {t('pages.maturity.title', 'Maturity Framework')}
                </Title>
                <Text c="dimmed" size="sm" mt={4}>
                    {t('pages.maturity.description', 'Track and improve your operational maturity across all levels')}
                </Text>
            </Box>

            {/* Level Cards - Lock levels until previous is complete */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
                {MATURITY_LEVELS.map((level, idx) => {
                    const levelStat = stats?.levelStats.find(s => s.level === level);
                    const prevLevelStat = idx > 0 ? stats?.levelStats.find(s => s.level === MATURITY_LEVELS[idx - 1]) : null;

                    // Lock if previous level is not 100% complete (except Foundation which is never locked)
                    const isLocked = idx > 0 && (prevLevelStat?.avgScore ?? 0) < 100;

                    // Calculate strict completion percentage to match user expectation (e.g. 17/27 = 63%)
                    const total = levelStat?.total ?? 0;
                    const completed = levelStat?.completed ?? 0;
                    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                        <LevelCard
                            key={level}
                            level={level}
                            avgScore={completionPercentage}
                            completed={completed}
                            total={total}
                            isLocked={isLocked}
                        />
                    );
                })}
            </SimpleGrid>

            {/* Pillar Selector */}
            <Group gap="sm" wrap="wrap">
                {data?.pillars.map(pillar => {
                    const isActive = (pillar as any).is_active !== false; // Default true if undefined
                    return (
                        <Tooltip
                            key={pillar.id}
                            label={!isActive ? t('maturity.comingSoon', 'Coming Soon') : ''}
                            disabled={isActive}
                        >
                            <Button
                                variant={selectedPillarId === pillar.id ? 'filled' : 'light'}
                                color={isActive ? 'blue' : 'gray'}
                                size="sm"
                                onClick={() => isActive && setSelectedPillarId(pillar.id)}
                                disabled={!isActive}
                                style={{ opacity: isActive ? 1 : 0.6 }}
                            >
                                {pillar.code}: {pillar.name}
                            </Button>
                        </Tooltip>
                    );
                })}
            </Group>

            {/* Elements Table */}
            {selectedPillar && (
                <Card
                    radius="lg"
                    shadow="sm"
                    p="xl"
                    style={{ border: '1px solid var(--mantine-color-gray-2)' }}
                >
                    <Group justify="space-between" mb="lg">
                        <Group gap="sm">
                            <ThemeIcon variant="gradient" gradient={{ from: 'blue', to: 'violet' }} size="lg" radius="md">
                                <IconTrophy size={18} />
                            </ThemeIcon>
                            <div>
                                <Text fw={700}>{selectedPillar.name}</Text>
                                <Text size="xs" c="dimmed">{t('maturity.elementsCount', { count: selectedPillar.elements.length })}</Text>
                            </div>
                        </Group>
                    </Group>

                    <Table highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('table.element', 'Element')}</Table.Th>
                                {MATURITY_LEVELS.map(level => (
                                    <Table.Th key={level} style={{ textAlign: 'center', width: 80 }}>
                                        <Tooltip label={t(LEVEL_CONFIG[level].labelKey)}>
                                            <Badge size="xs" variant="light" color={LEVEL_CONFIG[level].color}>
                                                {level.charAt(0)}
                                            </Badge>
                                        </Tooltip>
                                    </Table.Th>
                                ))}
                                <Table.Th style={{ width: 40 }} />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {selectedPillar.elements.map(element => (
                                <ElementRow
                                    key={element.id}
                                    element={element}
                                    onSelect={() => setSelectedElement(element)}
                                />
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Detail Drawer */}
            <MaturityDetailDrawer
                element={selectedElement}
                country={selectedCountry ?? 'Global'}
                onClose={() => setSelectedElement(null)}
                onUpdate={() => refetch()}
            />
        </Stack>
    );
}
