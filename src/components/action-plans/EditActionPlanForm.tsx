import { useState } from 'react';
import {
  Button,
  Group,
  Stack,
  TextInput,
  Textarea,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { ActionPlanWithElement } from '../../types';
import { updateActionPlan } from '../../services/api';

type Props = {
  plan: ActionPlanWithElement;
  onCancel: () => void;
  onSuccess: () => void;
};

export function EditActionPlanForm({ plan, onCancel, onSuccess }: Props) {
  // PT – inicializa com colunas PT, caindo pra legacy se necessário
  const [problemPt, setProblemPt] = useState(
    plan.problem_pt ?? plan.problem ?? '',
  );
  const [actionPt, setActionPt] = useState(
    plan.action_pt ?? plan.solution ?? '',
  );

  // EN – se ainda não tiver tradução, começa vazio
  const [problemEn, setProblemEn] = useState(plan.problem_en ?? '');
  const [actionEn, setActionEn] = useState(plan.action_en ?? '');

  const [ownerName, setOwnerName] = useState(plan.owner_name);
  const [dueDate, setDueDate] = useState<string | null>(plan.due_date);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!problemPt.trim() || !actionPt.trim() || !ownerName.trim()) {
      return;
    }

    setSaving(true);
    try {
      const parsedDueDate =
        dueDate && dueDate.trim().length > 0 ? new Date(dueDate) : null;

      await updateActionPlan({
        id: plan.id,
        problem: problemPt,
        solution: actionPt,
        ownerName,
        dueDate: parsedDueDate ?? null,
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
          label="Pilar"
          value={plan.element?.pillar?.name ?? ''}
          readOnly
        />
        <TextInput
          label="Elemento"
          value={plan.element?.name ?? ''}
          readOnly
        />
        <TextInput
          label="FOUNDATION"
          value={
            plan.element?.foundation_score != null
              ? String(plan.element.foundation_score)
              : ''
          }
          readOnly
        />

        {/* Bloco PT */}
        <Text fw={600} mt="xs">
          Português
        </Text>

        <Textarea
          label="Problema (PT)"
          minRows={3}
          value={problemPt}
          onChange={(e) => setProblemPt(e.currentTarget.value)}
          required
        />

        <Textarea
          label="Ação (PT)"
          minRows={3}
          value={actionPt}
          onChange={(e) => setActionPt(e.currentTarget.value)}
          required
        />

        {/* Bloco EN */}
        <Text fw={600} mt="xs">
          English
        </Text>

        <Textarea
          label="Problem (EN)"
          minRows={3}
          value={problemEn}
          onChange={(e) => setProblemEn(e.currentTarget.value)}
        />

        <Textarea
          label="Action (EN)"
          minRows={3}
          value={actionEn}
          onChange={(e) => setActionEn(e.currentTarget.value)}
        />

        <TextInput
          label="Responsável"
          value={ownerName}
          onChange={(e) => setOwnerName(e.currentTarget.value)}
          required
        />

        <DateInput
          label="Prazo (opcional)"
          placeholder="Selecione uma data"
          value={dueDate}
          onChange={setDueDate}
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="subtle" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Salvar alterações
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
