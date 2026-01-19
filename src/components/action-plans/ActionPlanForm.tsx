import { useState } from 'react';
import {
  Button,
  Stack,
  TextInput,
  Textarea,
  Group,
  Text,
  Badge,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useTranslation } from 'react-i18next';
import type { ElementWithRelations, MaturityLevel } from '../../types';
import { createActionPlan } from '../../services/api';

type Props = {
  element: ElementWithRelations;
  onSuccess: () => void;
  onCancel: () => void;
  country: string;
  targetLevel?: MaturityLevel;
};

export function ActionPlanForm({ element, onSuccess, onCancel, country, targetLevel }: Props) {
  const { t } = useTranslation();

  // LOCAL (Principal)
  const [problemLocal, setProblemLocal] = useState('');
  const [actionLocal, setActionLocal] = useState('');

  // ENGLISH (Opcional/Secundário)
  const [problemEn, setProblemEn] = useState('');
  const [actionEn, setActionEn] = useState('');

  const [ownerName, setOwnerName] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!problemLocal.trim() || !actionLocal.trim() || !ownerName.trim()) {
      return;
    }

    setSaving(true);
    try {
      await createActionPlan({
        elementId: element.id,
        // Envia o texto local para as colunas principais (problem/solution)
        problem: problemLocal,
        solution: actionLocal,
        ownerName,
        dueDate: dueDate ?? undefined,
        problemEn: problemEn.trim() ? problemEn : undefined,
        actionEn: actionEn.trim() ? actionEn : undefined,
        country,
        maturityLevel: targetLevel,
      });

      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        <TextInput label={t('form.pillar')} value={element.pillar?.name ?? ''} readOnly disabled />
        <TextInput label={t('form.element')} value={element.name} readOnly disabled />

        <Group grow>
          <TextInput
            label={t('form.foundation')}
            value={String(element.foundation_score)}
            readOnly
            disabled
          />
          {targetLevel && (
            <TextInput
              label={t('form.targetLevel', 'Maturity Target')}
              value={t(`maturity.levels.${targetLevel}`)}
              readOnly
              disabled
              rightSection={
                <Badge
                  variant="filled"
                  color={
                    targetLevel === 'FOUNDATION' ? 'gray' :
                      targetLevel === 'BRONZE' ? 'orange' :
                        targetLevel === 'SILVER' ? 'gray.6' :
                          targetLevel === 'GOLD' ? 'yellow' :
                            'violet'
                  }
                  size="xs"
                >
                  {targetLevel}
                </Badge>
              }
            />
          )}
        </Group>

        {/* Bloco IDIOMA LOCAL */}
        <Group mt="md" mb={0}>
          <Badge variant="filled" color="blue" size="sm">
            {country}
          </Badge>
          <Text size="xs" c="dimmed" fw={600}>
            {t('form.nativeLocal')}
          </Text>
        </Group>

        <Textarea
          label={t('form.problem')}
          placeholder={t('form.problem_placeholder')}
          minRows={3}
          value={problemLocal}
          onChange={(e) => setProblemLocal(e.currentTarget.value)}
          required
          data-autofocus
        />

        <Textarea
          label={t('form.action')}
          placeholder={t('form.action_placeholder')}
          minRows={3}
          value={actionLocal}
          onChange={(e) => setActionLocal(e.currentTarget.value)}
          required
        />

        {/* Bloco INGLÊS */}
        <Group mt="md" mb={0}>
          <Badge variant="outline" color="gray" size="sm">
            {t('form.english')}
          </Badge>
          <Text size="xs" c="dimmed" fw={600}>
            {t('form.globalOptional')}
          </Text>
        </Group>

        <Textarea
          label={t('form.problemEn')}
          placeholder={t('form.problemEn_placeholder')}
          minRows={2}
          value={problemEn}
          onChange={(e) => setProblemEn(e.currentTarget.value)}
        />

        <Textarea
          label={t('form.actionEn')}
          placeholder={t('form.actionEn_placeholder')}
          minRows={2}
          value={actionEn}
          onChange={(e) => setActionEn(e.currentTarget.value)}
        />

        <TextInput
          mt="md"
          label={t('form.owner')}
          placeholder={t('form.owner_placeholder')}
          value={ownerName}
          onChange={(e) => setOwnerName(e.currentTarget.value)}
          required
        />

        <DateInput
          label={t('form.dueDate')}
          placeholder={t('form.dueDate_placeholder')}
          value={dueDate}
          onChange={(val) => setDueDate(val ? new Date(val) : null)}
          clearable
        />

        <Group justify="flex-end" mt="lg">
          <Button variant="subtle" onClick={onCancel} disabled={saving} color="gray">
            {t('actions.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {t('actions.createPlan')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}