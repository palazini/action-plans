import { useState } from 'react';
import {
  Button,
  Group,
  Stack,
  TextInput,
  Textarea,
  Text,
  Badge,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useTranslation } from 'react-i18next';
import type { ActionPlanWithElement } from '../../types';
import { updateActionPlan } from '../../services/api';

type Props = {
  plan: ActionPlanWithElement;
  onCancel: () => void;
  onSuccess: () => void;
};

export function EditActionPlanForm({ plan, onCancel, onSuccess }: Props) {
  const { t } = useTranslation();

  // LOCAL (Principal)
  const [problemLocal, setProblemLocal] = useState(
    plan.problem ?? plan.problem_pt ?? '',
  );
  const [actionLocal, setActionLocal] = useState(
    plan.solution ?? plan.action_pt ?? '',
  );

  // ENGLISH (Opcional/Secundário)
  const [problemEn, setProblemEn] = useState(plan.problem_en ?? '');
  const [actionEn, setActionEn] = useState(plan.action_en ?? '');

  const [ownerName, setOwnerName] = useState(plan.owner_name);
  
  const [dueDate, setDueDate] = useState<Date | null>(
    plan.due_date ? new Date(plan.due_date) : null
  );
  
  const [saving, setSaving] = useState(false);

  // CORREÇÃO 1: Cast para 'any' para acessar 'country' que pode não estar na tipagem ainda
  const countryDisplay = (plan as any).country || 'Local';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!problemLocal.trim() || !actionLocal.trim() || !ownerName.trim()) {
      return;
    }

    setSaving(true);
    try {
      await updateActionPlan({
        id: plan.id,
        problem: problemLocal,
        solution: actionLocal,
        ownerName,
        dueDate: dueDate ?? null,
        problemEn,
        actionEn,
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
        <TextInput
          label={t('form.pillar')}
          value={plan.element?.pillar?.name ?? ''}
          readOnly
          disabled
        />
        <TextInput
          label={t('form.element')}
          value={plan.element?.name ?? ''}
          readOnly
          disabled
        />
        <TextInput
          label={t('form.foundation')}
          value={
            plan.element?.foundation_score != null
              ? String(plan.element.foundation_score)
              : ''
          }
          readOnly
          disabled
        />

        {/* Bloco IDIOMA LOCAL */}
        <Group mt="md" mb={0}>
            <Badge variant="filled" color="blue" size="sm">
                {countryDisplay}
            </Badge>
            <Text size="xs" c="dimmed" fw={600}>
                (Nativo / Local)
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
                English
            </Badge>
            <Text size="xs" c="dimmed" fw={600}>
                (Global / Optional)
            </Text>
        </Group>

        <Textarea
          label="Problem (English)"
          placeholder="Describe the current problem..."
          minRows={3}
          value={problemEn}
          onChange={(e) => setProblemEn(e.currentTarget.value)}
        />

        <Textarea
          label="Action (English)"
          placeholder="What will be done to solve the problem?"
          minRows={3}
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

        {/* CORREÇÃO 2: Wrapper no onChange para garantir compatibilidade de tipos */}
        <DateInput
          label={t('form.dueDate')}
          placeholder={t('form.dueDate_placeholder')}
          value={dueDate}
          onChange={(val: any) => {
             // Aceita string ou Date e converte para o state correto
             if (typeof val === 'string') {
                 setDueDate(val ? new Date(val) : null);
             } else {
                 setDueDate(val);
             }
          }}
          clearable
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="subtle" onClick={onCancel} disabled={saving} color="gray">
            {t('actions.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {t('actions.saveChanges')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}