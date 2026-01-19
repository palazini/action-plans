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

export function PillarManagementPage() {
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
                title: 'Sucesso',
                message: `Pilar ${variables.isActive ? 'ativado' : 'desativado'} com sucesso`,
                color: variables.isActive ? 'green' : 'orange',
            });
            setConfirmModal({ open: false, pillar: null, newStatus: false });
        },
        onError: (err: any) => {
            notifications.show({
                title: 'Erro',
                message: err.message || 'Falha ao atualizar o pilar',
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
                title="Erro"
                variant="filled"
            >
                Falha ao carregar pilares. Tente novamente.
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
                            Gerenciamento de Pilares
                        </Title>
                        <Text c="dimmed" size="sm">
                            Ativar ou desativar pilares do framework
                        </Text>
                    </div>
                </Group>
            </Box>

            {/* Summary */}
            <Group gap="md">
                <Badge size="lg" variant="light" color="green">
                    {activePillars.length} Ativos
                </Badge>
                <Badge size="lg" variant="light" color="gray">
                    {inactivePillars.length} Inativos
                </Badge>
            </Group>

            {/* Info Alert */}
            <Alert
                icon={<IconAlertTriangle size={16} />}
                color="yellow"
                variant="light"
            >
                <Text size="sm">
                    <strong>Atenção:</strong> Pilares desativados não aparecerão nas páginas de Maturidade, Backlog e Planos de Ação.
                    Os dados existentes serão mantidos, apenas a visualização será ocultada.
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
                            <Table.Th>Código</Table.Th>
                            <Table.Th>Nome</Table.Th>
                            <Table.Th>Descrição</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th ta="center">Ação</Table.Th>
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
                                        {pillar.is_active ? 'Ativo' : 'Inativo'}
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
            <Divider my="lg" label="Configurações Globais" labelPosition="center" />

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
                            <Text fw={700}>Nível de Maturidade Ativo</Text>
                            <Text size="xs" c="dimmed">Define qual nível é usado no Dashboard, Backlog e Planos de Ação</Text>
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
                        <strong>Atenção:</strong> Alterar o nível ativo mudará quais elementos são considerados como "gaps"
                        e afetará as estatísticas do dashboard. Use apenas quando o nível anterior estiver 100% completo.
                    </Text>
                </Alert>

                <Paper p="md" radius="md" bg="gray.0">
                    <Text size="sm" fw={600} mb="sm">Selecione o nível ativo:</Text>
                    <SegmentedControl
                        value={activeLevel}
                        onChange={async (value) => {
                            setLevelChanging(true);
                            try {
                                await setActiveLevel(value as MaturityLevel);
                                notifications.show({
                                    title: 'Sucesso',
                                    message: `Nível ativo alterado para ${value}`,
                                    color: 'green',
                                });
                            } catch (err: any) {
                                notifications.show({
                                    title: 'Erro',
                                    message: err.message || 'Falha ao alterar nível',
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
                        <Text fw={600}>Confirmar Desativação</Text>
                    </Group>
                }
                centered
            >
                <Stack gap="md">
                    <Text size="sm">
                        Você está prestes a desativar o pilar <strong>{confirmModal.pillar?.code} - {confirmModal.pillar?.name}</strong>.
                    </Text>
                    <Text size="sm" c="dimmed">
                        Todos os elementos deste pilar serão ocultados nas demais páginas. Os dados existentes não serão excluídos.
                    </Text>
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="subtle"
                            onClick={() => setConfirmModal({ open: false, pillar: null, newStatus: false })}
                        >
                            Cancelar
                        </Button>
                        <Button
                            color="orange"
                            onClick={confirmDeactivation}
                            loading={mutation.isPending}
                        >
                            Desativar Pilar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
