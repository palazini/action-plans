//src/pages/StructurePage.tsx
import { useEffect, useState } from 'react';
import {
  Alert,
  ActionIcon,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  NumberInput,
  SimpleGrid,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  Stack,
  ThemeIcon,
  Badge,
  rem
} from '@mantine/core';
import {
  IconAlertCircle,
  IconPencil,
  IconPlus,
  IconLayoutKanban,
  IconComponents,
  IconArrowRight,
  IconDatabaseOff
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  createElement,
  createPillar,
  fetchPillarsWithElements,
  updateElement,
  type AdminElement,
  type AdminPillar,
} from '../services/api';

export function StructurePage() {
  const { t } = useTranslation();
  const { selectedCountry } = useAuth();

  const [pillars, setPillars] = useState<AdminPillar[]>([]);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createPillarOpen, setCreatePillarOpen] = useState(false);
  const [createElementOpen, setCreateElementOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<AdminElement | null>(
    null,
  );

  const selectedPillar = pillars.find((p) => p.id === selectedPillarId) ?? null;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (!selectedCountry) return;
      const data = await fetchPillarsWithElements(selectedCountry);
      setPillars(data);
      if (!selectedPillarId && data.length > 0) {
        setSelectedPillarId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(t('dashboard.loadError'));
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
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={() => setCreatePillarOpen(true)}
              >
                {t('structure.newPillar')}
              </Button>
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
                          <Text size="sm" fw={500}>{pillar.name_pt || pillar.name}</Text>
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

              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={() => setCreateElementOpen(true)}
                disabled={!selectedPillar}
              >
                {t('structure.newElement')}
              </Button>
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
                        <Text size="sm" fw={500}>{el.name_pt || el.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="dot" color={getScoreColor(el.foundation_score)}>
                          {el.foundation_score}%
                        </Badge>
                      </Table.Td>
                      <Table.Td align="right">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          onClick={() => setEditingElement(el)}
                          aria-label={t('structure.editElement')}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </SimpleGrid>
      )}

      {/* Modal: criar pilar */}
      <CreatePillarModal
        opened={createPillarOpen}
        onClose={() => setCreatePillarOpen(false)}
        onSaved={load}
        country={selectedCountry!}
      />

      {/* Modal: criar elemento */}
      {selectedPillar && (
        <CreateElementModal
          opened={createElementOpen}
          onClose={() => setCreateElementOpen(false)}
          onSaved={load}
          pillar={selectedPillar}
          country={selectedCountry!}
        />
      )}

      {/* Modal: editar elemento */}
      {editingElement && (
        <EditElementModal
          element={editingElement}
          onClose={() => setEditingElement(null)}
          onSaved={async () => {
            setEditingElement(null);
            await load();
          }}
        />
      )}
    </Stack>
  );
}

/* ------------------------ Modais auxiliares ------------------------ */

type CreatePillarModalProps = {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  country: string;
};

function CreatePillarModal({
  opened,
  onClose,
  onSaved,
  country,
}: CreatePillarModalProps) {
  const { t } = useTranslation();

  const [code, setCode] = useState('');
  const [namePt, setNamePt] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionPt, setDescriptionPt] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!namePt.trim()) return;

    setSaving(true);
    try {
      await createPillar({
        code: code.trim() || undefined,
        namePt: namePt.trim(),
        nameEn: nameEn.trim() || undefined,
        descriptionPt: descriptionPt.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        country,
      });
      onClose();
      onSaved();
      setCode('');
      setNamePt('');
      setNameEn('');
      setDescriptionPt('');
      setDescriptionEn('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>{t('structure.newPillar')}</Text>}
      centered
      size="lg"
      overlayProps={{ blur: 3 }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Group grow>
            <TextInput
              label={t('structure.code')}
              placeholder="EX: SAF"
              value={code}
              onChange={(e) => setCode(e.currentTarget.value)}
            />
            <TextInput
              label={t('structure.namePt')}
              placeholder="Ex: Segurança"
              required
              value={namePt}
              onChange={(e) => setNamePt(e.currentTarget.value)}
            />
          </Group>

          <TextInput
            label={t('structure.nameEn')}
            placeholder="Ex: Safety"
            value={nameEn}
            onChange={(e) => setNameEn(e.currentTarget.value)}
          />

          <Textarea
            label={t('structure.descriptionPt')}
            value={descriptionPt}
            onChange={(e) => setDescriptionPt(e.currentTarget.value)}
            minRows={2}
          />
          <Textarea
            label={t('structure.descriptionEn')}
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.currentTarget.value)}
            minRows={2}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={saving}
            >
              {t('structure.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {t('structure.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

type CreateElementModalProps = {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  pillar: AdminPillar;
  country: string;
};

function CreateElementModal({
  opened,
  onClose,
  onSaved,
  pillar,
  country,
}: CreateElementModalProps) {
  const { t } = useTranslation();

  const [code, setCode] = useState('');
  const [namePt, setNamePt] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [foundationScore, setFoundationScore] = useState<number>(0);
  const [notesPt, setNotesPt] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!namePt.trim()) return;

    setSaving(true);
    try {
      await createElement({
        pillarId: pillar.id,
        code: code.trim() || undefined,
        namePt: namePt.trim(),
        nameEn: nameEn.trim() || undefined,
        foundationScore,
        notesPt: notesPt.trim() || undefined,
        notesEn: notesEn.trim() || undefined,
        country,
      });
      onClose();
      onSaved();
      setCode('');
      setNamePt('');
      setNameEn('');
      setFoundationScore(0);
      setNotesPt('');
      setNotesEn('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>{t('structure.newElement')}</Text>}
      centered
      size="lg"
      overlayProps={{ blur: 3 }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Alert variant="light" color="blue" title={t('structure.context')} icon={<IconLayoutKanban size={16} />}>
            {t('table.pillar')}: <Text span fw={700}>{pillar.code ?? '-'}</Text> — {pillar.name_pt || pillar.name}
          </Alert>

          <Group grow>
            <TextInput
              label={t('structure.code')}
              value={code}
              onChange={(e) => setCode(e.currentTarget.value)}
            />
            <NumberInput
              label={t('structure.foundationScore')}
              value={foundationScore}
              onChange={(val) => setFoundationScore(Number(val) || 0)}
              min={0}
              max={100}
            />
          </Group>

          <TextInput
            label={t('structure.namePt')}
            required
            value={namePt}
            onChange={(e) => setNamePt(e.currentTarget.value)}
          />
          <TextInput
            label={t('structure.nameEn')}
            value={nameEn}
            onChange={(e) => setNameEn(e.currentTarget.value)}
          />

          <Textarea
            label={t('structure.notesPt')}
            value={notesPt}
            onChange={(e) => setNotesPt(e.currentTarget.value)}
            minRows={2}
          />
          <Textarea
            label={t('structure.notesEn')}
            value={notesEn}
            onChange={(e) => setNotesEn(e.currentTarget.value)}
            minRows={2}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={saving}
            >
              {t('structure.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {t('structure.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

type EditElementModalProps = {
  element: AdminElement;
  onClose: () => void;
  onSaved: () => void;
};

function EditElementModal({
  element,
  onClose,
  onSaved,
}: EditElementModalProps) {
  const { t } = useTranslation();

  const [code, setCode] = useState(element.code ?? '');
  const [namePt, setNamePt] = useState(element.name_pt ?? element.name);
  const [nameEn, setNameEn] = useState(element.name_en ?? '');
  const [foundationScore, setFoundationScore] = useState<number>(
    element.foundation_score,
  );
  const [notesPt, setNotesPt] = useState(element.notes_pt ?? element.notes ?? '');
  const [notesEn, setNotesEn] = useState(element.notes_en ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!namePt.trim()) return;

    setSaving(true);
    try {
      await updateElement({
        id: element.id,
        code: code.trim() || undefined,
        namePt: namePt.trim(),
        nameEn: nameEn.trim() || undefined,
        foundationScore,
        notesPt: notesPt.trim() || null,
        notesEn: notesEn.trim() || null,
      });
      onClose();
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
      title={<Text fw={700}>{t('structure.editElement')}</Text>}
      centered
      size="lg"
      overlayProps={{ blur: 3 }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Group grow>
            <TextInput
              label={t('structure.code')}
              value={code}
              onChange={(e) => setCode(e.currentTarget.value)}
            />
            <NumberInput
              label={t('structure.foundationScore')}
              value={foundationScore}
              onChange={(val) => setFoundationScore(Number(val) || 0)}
              min={0}
              max={100}
            />
          </Group>

          <TextInput
            label={t('structure.namePt')}
            required
            value={namePt}
            onChange={(e) => setNamePt(e.currentTarget.value)}
          />
          <TextInput
            label={t('structure.nameEn')}
            value={nameEn}
            onChange={(e) => setNameEn(e.currentTarget.value)}
          />

          <Textarea
            label={t('structure.notesPt')}
            value={notesPt}
            onChange={(e) => setNotesPt(e.currentTarget.value)}
            minRows={2}
          />
          <Textarea
            label={t('structure.notesEn')}
            value={notesEn}
            onChange={(e) => setNotesEn(e.currentTarget.value)}
            minRows={2}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={saving}
            >
              {t('structure.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {t('structure.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}