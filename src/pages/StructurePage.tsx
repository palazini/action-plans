//src/pages/StructurePage.tsx
import { useState, useEffect } from 'react';
import {
  Alert,
  ActionIcon,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  NumberInput,
  SimpleGrid,
  Table,
  Text,
  Textarea,
  Title,
  Stack,
  ThemeIcon,
  Badge,
  rem,
  Tooltip,
  Paper
} from '@mantine/core';
import {
  IconAlertCircle,
  IconPencil,
  IconLayoutKanban,
  IconComponents,
  IconArrowRight,
  IconDatabaseOff,
  IconInfoCircle,
  IconLock
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { usePillarsWithElements } from '../hooks/useQueries';
import { updateElementScore, type AdminElement } from '../services/api';


export function StructurePage() {
  const { t } = useTranslation();
  const { selectedCountry } = useAuth();

  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<AdminElement | null>(null);

  // React Query hooks
  const {
    data: pillars = [],
    isLoading: loading,
    error: queryError,
    refetch
  } = usePillarsWithElements(selectedCountry);

  const error = queryError ? t('dashboard.loadError') : null;

  const selectedPillar = pillars.find((p) => p.id === selectedPillarId) ?? null;

  // Seleciona automaticamente o primeiro pilar quando os dados carregam
  useEffect(() => {
    if (!selectedPillarId && pillars.length > 0) {
      setSelectedPillarId(pillars[0].id);
    }
  }, [pillars, selectedPillarId]);


  // Helper para cor do score
  const getScoreColor = (score: number) => {
    if (score < 50) return 'red';
    if (score < 80) return 'orange';
    return 'green';
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} c="dark.8">{t('pages.structure.title')}</Title>
          <Text c="dimmed" size="sm">
            {t('pages.structure.description')}
          </Text>
        </div>

        {/* Indicador de pilares/elementos fixos */}
        <Tooltip
          label={t('pages.structure.lockedTooltip', 'Os pilares e elementos são padronizados globalmente. Você pode editar apenas o score do seu país.')}
          multiline
          w={280}
        >
          <Badge
            leftSection={<IconLock size={12} />}
            variant="light"
            color="gray"
            size="lg"
          >
            {t('pages.structure.globalStandard', 'Padrão Global')}
          </Badge>
        </Tooltip>
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
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {/* Coluna de Pilares */}
          <Card withBorder radius="md" shadow="sm" p="lg">
            <Group justify="space-between" mb="lg">
              <Group gap="xs">
                <ThemeIcon variant="light" color="violet" size="md">
                  <IconLayoutKanban style={{ width: rem(18), height: rem(18) }} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="sm">{t('pages.structure.pillarsCardTitle')}</Text>
                  <Text size="xs" c="dimmed">{t('pages.structure.pillarsCardSubtitle')}</Text>
                </div>
              </Group>
            </Group>

            {pillars.length === 0 ? (
              <Center p="xl" bg="gray.0" style={{ borderRadius: 8 }}>
                <Stack align="center" gap="xs">
                  <IconDatabaseOff size={30} color="gray" style={{ opacity: 0.5 }} />
                  <Text size="sm" c="dimmed">
                    {t('pages.structure.noPillarSelected')}
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Table highlightOnHover verticalSpacing="sm" striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('structure.code')}</Table.Th>
                    <Table.Th>{t('structure.namePt')}</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>{t('structure.elementsCount')}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pillars.map((pillar) => {
                    const isSelected = pillar.id === selectedPillarId;
                    return (
                      <Table.Tr
                        key={pillar.id}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected
                            ? 'var(--mantine-color-blue-0)'
                            : undefined,
                          transition: 'background-color 0.2s',
                        }}
                        onClick={() => setSelectedPillarId(pillar.id)}
                      >
                        <Table.Td>
                          <Badge variant="outline" color="gray" size="sm">
                            {pillar.code ?? '-'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>{pillar.name_local || pillar.name}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Badge size="sm" circle variant={isSelected ? 'filled' : 'light'}>
                            {pillar.elements.length}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {isSelected && <IconArrowRight size={14} color="var(--mantine-color-blue-6)" />}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Card>

          {/* Coluna de Elementos */}
          <Card withBorder radius="md" shadow="sm" p="lg">
            <Group justify="space-between" mb="lg">
              <Group gap="xs">
                <ThemeIcon variant="light" color="cyan" size="md">
                  <IconComponents style={{ width: rem(18), height: rem(18) }} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="sm">{t('pages.structure.elementsCardTitle')}</Text>
                  <Text size="xs" c="dimmed">{t('pages.structure.elementsCardSubtitle')}</Text>
                </div>
              </Group>
            </Group>

            {!selectedPillar ? (
              <Center h={200} bg="gray.0" style={{ borderRadius: 8 }}>
                <Text size="sm" c="dimmed">
                  {t('pages.structure.noPillarSelected')}
                </Text>
              </Center>
            ) : selectedPillar.elements.length === 0 ? (
              <Center h={200} bg="gray.0" style={{ borderRadius: 8 }}>
                <Stack align="center" gap="xs">
                  <IconDatabaseOff size={30} color="gray" style={{ opacity: 0.5 }} />
                  <Text size="sm" c="dimmed">
                    {t('pages.structure.noElementsInPillar')}
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('structure.code')}</Table.Th>
                    <Table.Th>{t('structure.namePt')}</Table.Th>
                    <Table.Th>{t('structure.foundationScore')}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedPillar.elements.map((el) => (
                    <Table.Tr key={el.id}>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                        <Text size="xs" c="dimmed" fw={700}>{el.code ?? '-'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Text size="sm" fw={500}>{el.name_local || el.name}</Text>
                          {/* Mostra ícone de info se tiver explicação */}
                          {(el.explanation_local || el.explanation_en) && (
                            <Tooltip
                              label={el.explanation_local || el.explanation_en}
                              multiline
                              w={400}
                              withArrow
                            >
                              <IconInfoCircle
                                size={14}
                                color="var(--mantine-color-blue-5)"
                                style={{ cursor: 'help' }}
                              />
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Badge variant="dot" color={getScoreColor(el.foundation_score)}>
                            {el.foundation_score}%
                          </Badge>
                          {(el.foundation_criteria_local || el.foundation_criteria_en) && (
                            <Tooltip
                              label={el.foundation_criteria_local || el.foundation_criteria_en}
                              multiline
                              w={300}
                              withArrow
                            >
                              <IconInfoCircle
                                size={14}
                                color="var(--mantine-color-gray-5)"
                                style={{ cursor: 'help' }}
                              />
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td align="right">
                        <Tooltip label={t('structure.editScore', 'Editar Score')}>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            onClick={() => setEditingElement(el)}
                            aria-label={t('structure.editElement')}
                          >
                            <IconPencil size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </SimpleGrid>
      )}

      {/* Modal: editar score do elemento */}
      {editingElement && selectedCountry && (
        <EditScoreModal
          element={editingElement}
          country={selectedCountry}
          onClose={() => setEditingElement(null)}
          onSaved={() => {
            setEditingElement(null);
            refetch();
          }}
        />
      )}
    </Stack>
  );
}

/* ------------------------ Modal: Editar Score ------------------------ */

type EditScoreModalProps = {
  element: AdminElement;
  country: string;
  onClose: () => void;
  onSaved: () => void;
};

function EditScoreModal({
  element,
  country,
  onClose,
  onSaved,
}: EditScoreModalProps) {
  const { t } = useTranslation();

  const [foundationScore, setFoundationScore] = useState<number>(element.foundation_score);
  const [notes, setNotes] = useState(element.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    try {
      await updateElementScore({
        elementId: element.id,
        country,
        foundationScore,
        notes: notes.trim() || null,
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title={<Text fw={700}>{t('structure.editScore', 'Editar Score')}</Text>}
      centered
      size="md"
      overlayProps={{ blur: 3 }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Info do elemento (read-only) */}
          <Paper p="sm" bg="gray.0" radius="md">
            <Group gap="xs" mb="xs">
              <Badge variant="outline" color="gray" size="sm">
                {element.code ?? '-'}
              </Badge>
              <Text size="sm" fw={600}>{element.name_local || element.name}</Text>
            </Group>
            {element.explanation_en && (
              <Text size="xs" c="dimmed" fs="italic">
                {element.explanation_en}
              </Text>
            )}
          </Paper>

          <NumberInput
            label={t('structure.foundationScore')}
            description={t('structure.foundationScoreDesc', 'Score de maturidade do elemento no seu país (0-100)')}
            value={foundationScore}
            onChange={(val) => setFoundationScore(Number(val) || 0)}
            min={0}
            max={100}
            suffix="%"
          />

          <Textarea
            label={t('structure.notes', 'Observações')}
            description={t('structure.notesDesc', 'Notas específicas do seu país para este elemento')}
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            minRows={2}
          />

          <Group justify="flex-end" mt="md">
            <ActionIcon
              variant="subtle"
              onClick={onClose}
              disabled={saving}
              size="lg"
            >
              ✕
            </ActionIcon>
            <ActionIcon
              type="submit"
              loading={saving}
              variant="filled"
              color="blue"
              size="lg"
            >
              ✓
            </ActionIcon>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}