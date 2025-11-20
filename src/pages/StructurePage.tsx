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
} from '@mantine/core';
import { IconAlertCircle, IconPencil, IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
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
      const data = await fetchPillarsWithElements();
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Title order={2} mb="xs">
        {t('pages.structure.title')}
      </Title>
      <Text size="sm" c="dimmed" mb="md">
        {t('pages.structure.description')}
      </Text>

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

      {loading ? (
        <Center>
          <Loader />
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {/* Coluna de Pilares */}
          <Card withBorder radius="md" shadow="xs">
            <Group justify="space-between" mb="sm">
              <div>
                <Text fw={600}>{t('pages.structure.pillarsCardTitle')}</Text>
                <Text size="xs" c="dimmed">
                  {t('pages.structure.pillarsCardSubtitle')}
                </Text>
              </div>
              <Button
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => setCreatePillarOpen(true)}
              >
                {t('structure.newPillar')}
              </Button>
            </Group>

            {pillars.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t('pages.structure.noPillarSelected')}
              </Text>
            ) : (
              <Table highlightOnHover verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('structure.code')}</Table.Th>
                    <Table.Th>{t('structure.namePt')}</Table.Th>
                    <Table.Th>{t('structure.elementsCount')}</Table.Th>
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
                        }}
                        onClick={() => setSelectedPillarId(pillar.id)}
                      >
                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                          {pillar.code ?? '-'}
                        </Table.Td>
                        <Table.Td>
                          {pillar.name_pt || pillar.name}
                        </Table.Td>
                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                          {pillar.elements.length}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Card>

          {/* Coluna de Elementos */}
          <Card withBorder radius="md" shadow="xs">
            <Group justify="space-between" mb="sm">
              <div>
                <Text fw={600}>{t('pages.structure.elementsCardTitle')}</Text>
                <Text size="xs" c="dimmed">
                  {t('pages.structure.elementsCardSubtitle')}
                </Text>
              </div>

              <Button
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => setCreateElementOpen(true)}
                disabled={!selectedPillar}
              >
                {t('structure.newElement')}
              </Button>
            </Group>

            {!selectedPillar ? (
              <Text size="sm" c="dimmed">
                {t('pages.structure.noPillarSelected')}
              </Text>
            ) : selectedPillar.elements.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t('pages.structure.noElementsInPillar')}
              </Text>
            ) : (
              <Table highlightOnHover verticalSpacing="xs">
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
                        {el.code ?? '-'}
                      </Table.Td>
                      <Table.Td>{el.name_pt || el.name}</Table.Td>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                        {el.foundation_score}
                      </Table.Td>
                      <Table.Td align="right" style={{ width: 40 }}>
                        <ActionIcon
                          variant="subtle"
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
      />

      {/* Modal: criar elemento */}
      {selectedPillar && (
        <CreateElementModal
          opened={createElementOpen}
          onClose={() => setCreateElementOpen(false)}
          onSaved={load}
          pillar={selectedPillar}
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
    </>
  );
}

/* ------------------------ Modais auxiliares ------------------------ */

type CreatePillarModalProps = {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
};

function CreatePillarModal({
  opened,
  onClose,
  onSaved,
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
      title={t('structure.newPillar')}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Group grow gap="sm" mb="sm">
          <TextInput
            label={t('structure.code')}
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
          />
          <TextInput
            label={t('structure.namePt')}
            required
            value={namePt}
            onChange={(e) => setNamePt(e.currentTarget.value)}
          />
        </Group>

        <TextInput
          label={t('structure.nameEn')}
          value={nameEn}
          onChange={(e) => setNameEn(e.currentTarget.value)}
          mb="sm"
        />

        <Textarea
          label={t('structure.descriptionPt')}
          value={descriptionPt}
          onChange={(e) => setDescriptionPt(e.currentTarget.value)}
          minRows={2}
          mb="sm"
        />
        <Textarea
          label={t('structure.descriptionEn')}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.currentTarget.value)}
          minRows={2}
          mb="sm"
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
      </form>
    </Modal>
  );
}

type CreateElementModalProps = {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  pillar: AdminPillar;
};

function CreateElementModal({
  opened,
  onClose,
  onSaved,
  pillar,
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
      title={t('structure.newElement')}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Text size="xs" c="dimmed" mb={4}>
          {t('table.pillar')}: {pillar.code ?? '-'} —{' '}
          {pillar.name_pt || pillar.name}
        </Text>

        <Group grow gap="sm" mb="sm">
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
          mb="sm"
        />
        <TextInput
          label={t('structure.nameEn')}
          value={nameEn}
          onChange={(e) => setNameEn(e.currentTarget.value)}
          mb="sm"
        />

        <Textarea
          label={t('structure.notesPt')}
          value={notesPt}
          onChange={(e) => setNotesPt(e.currentTarget.value)}
          minRows={2}
          mb="sm"
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
      title={t('structure.editElement')}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Group grow gap="sm" mb="sm">
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
          mb="sm"
        />
        <TextInput
          label={t('structure.nameEn')}
          value={nameEn}
          onChange={(e) => setNameEn(e.currentTarget.value)}
          mb="sm"
        />

        <Textarea
          label={t('structure.notesPt')}
          value={notesPt}
          onChange={(e) => setNotesPt(e.currentTarget.value)}
          minRows={2}
          mb="sm"
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
      </form>
    </Modal>
  );
}
