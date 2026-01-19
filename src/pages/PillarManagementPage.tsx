// src/pages/PillarManagementPage.tsx
import { useState } from 'react';
import {
    Card,
    Center,
    Group,
    Loader,
    Stack,
    Table,
    Text,
    Title,
    Badge,
    ThemeIcon,
    Box,
    Alert,
    Switch,
    Modal,
    Button,
    SegmentedControl,
    Divider,
    Paper,
} from '@mantine/core';
import {
    IconColumns,
    IconAlertCircle,
    IconAlertTriangle,
    IconTrophy,
    IconMedal,
    IconAward,
    IconCrown,
    IconDiamond,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllPillars, updatePillarStatus, type PillarAdmin } from '../services/api';
import { notifications } from '@mantine/notifications';
import { useAppSettings } from '../contexts/AppSettingsContext';
import type { MaturityLevel } from '../types';
import { MATURITY_LEVELS } from '../types';
import { useTranslation, Trans } from 'react-i18next';

export function PillarManagementPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { activeLevel, setActiveLevel, isLoading: settingsLoading } = useAppSettings();
    const [levelChanging, setLevelChanging] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; pillar: PillarAdmin | null; newStatus: boolean }>({
        open: false,
        pillar: null,
        newStatus: false,
    });

    const { data: pillars = [], isLoading, error } = useQuery({
        queryKey: ['admin-pillars'],
        queryFn: fetchAllPillars,
    });

    const mutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            updatePillarStatus(id, isActive),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-pillars'] });
            // Also invalidate queries that depend on pillars
            queryClient.invalidateQueries({ queryKey: ['pillars'] });
            queryClient.invalidateQueries({ queryKey: ['maturity'] });
            queryClient.invalidateQueries({ queryKey: ['backlog'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            notifications.show({
                title: t('pages.pillarManagement.successTitle'),
                message: t('pages.pillarManagement.successMessage', {
                    status: variables.isActive ? t('pages.pillarManagement.activated') : t('pages.pillarManagement.deactivated')
                }),
                color: variables.isActive ? 'green' : 'orange',
            });
            setConfirmModal({ open: false, pillar: null, newStatus: false });
        },
        onError: (err: any) => {
            notifications.show({
                title: t('pages.pillarManagement.errorTitle'),
                message: err.message || t('pages.pillarManagement.errorMessage'),
                color: 'red',
            });
        },
    });

    const handleToggle = (pillar: PillarAdmin, newStatus: boolean) => {
        // If deactivating, show confirmation modal
        if (!newStatus) {
            setConfirmModal({ open: true, pillar, newStatus });
        } else {
            // Activating doesn't need confirmation
            mutation.mutate({ id: pillar.id, isActive: true });
        }
    };

    const confirmDeactivation = () => {
        if (confirmModal.pillar) {
            mutation.mutate({ id: confirmModal.pillar.id, isActive: confirmModal.newStatus });
        }
    };

    if (isLoading) {
        return (
            <Center h={400}>
                <Loader size="lg" type="dots" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                title={t('pages.pillarManagement.errorTitle')}
                variant="filled"
            >
                {t('pages.pillarManagement.loadError')}
            </Alert>
        );
    }

    const activePillars = pillars.filter(p => p.is_active);
    const inactivePillars = pillars.filter(p => !p.is_active);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Box>
                <Group gap="sm">
                    <ThemeIcon
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'grape' }}
                        size="xl"
                        radius="md"
                    >
                        <IconColumns size={24} />
                    </ThemeIcon>
                    <div>
                        <Title order={2} c="dark.8" fw={800}>
                            {t('pages.pillarManagement.title')}
                        </Title>
                        <Text c="dimmed" size="sm">
                            {t('pages.pillarManagement.subtitle')}
                        </Text>
                    </div>
                </Group>
            </Box>

            {/* Summary */}
            <Group gap="md">
                <Badge size="lg" variant="light" color="green">
                    {activePillars.length} {t('pages.pillarManagement.active')}
                </Badge>
                <Badge size="lg" variant="light" color="gray">
                    {inactivePillars.length} {t('pages.pillarManagement.inactive')}
                </Badge>
            </Group>

            {/* Info Alert */}
            <Alert
                icon={<IconAlertTriangle size={16} />}
                color="yellow"
                variant="light"
            >
                <Text size="sm">
                    <strong>{t('pages.pillarManagement.attention')}:</strong> {t('pages.pillarManagement.warningMessage')}
                </Text>
            </Alert>

            {/* Pillars Table */}
            <Card
                radius="lg"
                shadow="sm"
                p="xl"
                style={{ border: '1px solid var(--mantine-color-gray-2)' }}
            >
                <Table verticalSpacing="md" highlightOnHover>
                    <Table.Thead bg="gray.0">
                        <Table.Tr>
                            <Table.Th>{t('pages.pillarManagement.code')}</Table.Th>
                            <Table.Th>{t('pages.pillarManagement.name')}</Table.Th>
                            <Table.Th>{t('pages.pillarManagement.description')}</Table.Th>
                            <Table.Th>{t('pages.pillarManagement.status')}</Table.Th>
                            <Table.Th ta="center">{t('pages.pillarManagement.action')}</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {pillars.map((pillar) => (
                            <Table.Tr
                                key={pillar.id}
                                style={{ opacity: pillar.is_active ? 1 : 0.6 }}
                            >
                                <Table.Td>
                                    <Badge
                                        size="lg"
                                        variant={pillar.is_active ? 'filled' : 'outline'}
                                        color={pillar.is_active ? 'blue' : 'gray'}
                                    >
                                        {pillar.code}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" fw={600}>
                                        {pillar.name}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="dimmed" lineClamp={2}>
                                        {pillar.description || '—'}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge
                                        variant="light"
                                        color={pillar.is_active ? 'green' : 'gray'}
                                    >
                                        {pillar.is_active ? t('pages.pillarManagement.activeStatus') : t('pages.pillarManagement.inactiveStatus')}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Center>
                                        <Switch
                                            checked={pillar.is_active}
                                            onChange={(e) => handleToggle(pillar, e.currentTarget.checked)}
                                            disabled={mutation.isPending}
                                            color="green"
                                            size="md"
                                        />
                                    </Center>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Divider */}
            <Divider my="lg" label={t('pages.pillarManagement.globalSettings')} labelPosition="center" />

            {/* Maturity Level Control */}
            <Card
                radius="lg"
                shadow="sm"
                p="xl"
                style={{ border: '1px solid var(--mantine-color-gray-2)' }}
            >
                <Group justify="space-between" mb="lg">
                    <Group gap="sm">
                        <ThemeIcon variant="gradient" gradient={{ from: 'orange', to: 'yellow' }} size="lg" radius="md">
                            <IconTrophy size={18} />
                        </ThemeIcon>
                        <div>
                            <Text fw={700}>{t('pages.pillarManagement.activeMaturityLevel')}</Text>
                            <Text size="xs" c="dimmed">{t('pages.pillarManagement.activeMaturityLevelDesc')}</Text>
                        </div>
                    </Group>
                    <Badge size="lg" variant="filled" color="orange">
                        {activeLevel}
                    </Badge>
                </Group>

                <Alert
                    icon={<IconAlertTriangle size={16} />}
                    color="orange"
                    variant="light"
                    mb="lg"
                >
                    <Text size="sm">
                        <strong>{t('pages.pillarManagement.attention')}:</strong> {t('pages.pillarManagement.levelWarning')}
                    </Text>
                </Alert>

                <Paper p="md" radius="md" bg="gray.0">
                    <Text size="sm" fw={600} mb="sm">{t('pages.pillarManagement.selectActiveLevel')}</Text>
                    <SegmentedControl
                        value={activeLevel}
                        onChange={async (value) => {
                            setLevelChanging(true);
                            try {
                                await setActiveLevel(value as MaturityLevel);
                                notifications.show({
                                    title: t('pages.pillarManagement.successTitle'),
                                    message: t('pages.pillarManagement.levelChangeSuccess', { level: value }),
                                    color: 'green',
                                });
                            } catch (err: any) {
                                notifications.show({
                                    title: t('pages.pillarManagement.errorTitle'),
                                    message: err.message || t('pages.pillarManagement.levelChangeError'),
                                    color: 'red',
                                });
                            } finally {
                                setLevelChanging(false);
                            }
                        }}
                        disabled={levelChanging || settingsLoading}
                        fullWidth
                        data={MATURITY_LEVELS.map(level => {
                            const icons: Record<MaturityLevel, React.ReactNode> = {
                                FOUNDATION: <IconTrophy size={14} />,
                                BRONZE: <IconMedal size={14} />,
                                SILVER: <IconAward size={14} />,
                                GOLD: <IconCrown size={14} />,
                                PLATINUM: <IconDiamond size={14} />,
                            };
                            return {
                                value: level,
                                label: (
                                    <Center style={{ gap: 6 }}>
                                        {icons[level]}
                                        <span>{level}</span>
                                    </Center>
                                ),
                            };
                        })}
                    />
                </Paper>
            </Card>

            {/* Confirmation Modal */}
            <Modal
                opened={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, pillar: null, newStatus: false })}
                title={
                    <Group gap="sm">
                        <ThemeIcon color="orange" variant="light">
                            <IconAlertTriangle size={18} />
                        </ThemeIcon>
                        <Text fw={600}>{t('pages.pillarManagement.confirmDeactivation')}</Text>
                    </Group>
                }
                centered
            >
                <Stack gap="md">
                    <Text size="sm">
                        <Trans
                            i18nKey="pages.pillarManagement.deactivationMessage"
                            values={{ code: confirmModal.pillar?.code, name: confirmModal.pillar?.name }}
                            components={{ strong: <strong /> }}
                        />
                    </Text>
                    <Text size="sm" c="dimmed">
                        {t('pages.pillarManagement.deactivationSubMessage')}
                    </Text>
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="subtle"
                            onClick={() => setConfirmModal({ open: false, pillar: null, newStatus: false })}
                        >
                            {t('pages.pillarManagement.cancel')}
                        </Button>
                        <Button
                            color="orange"
                            onClick={confirmDeactivation}
                            loading={mutation.isPending}
                        >
                            {t('pages.pillarManagement.deactivate')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
