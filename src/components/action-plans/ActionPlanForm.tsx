import { useState } from 'react';
import {
  Button,
  Stack,
  TextInput,
  Textarea,
  Group,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { ElementWithRelations } from '../../types';
import { createActionPlan } from '../../services/api';

type Props = {
  element: ElementWithRelations;
  onSuccess: () => void;
  onCancel: () => void;
  country: string;
};

export function ActionPlanForm({ element, onSuccess, onCancel, country }: Props) {
  // PT
  const [problemPt, setProblemPt] = useState('');
  const [actionPt, setActionPt] = useState('');
  // EN (opcional)
  const [problemEn, setProblemEn] = useState('');
  const [actionEn, setActionEn] = useState('');

  const [ownerName, setOwnerName] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
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

      await createActionPlan({
        elementId: element.id,
        problem: problemPt,
        solution: actionPt,
        ownerName,
        dueDate: parsedDueDate ?? undefined,
        problemEn: problemEn.trim() ? problemEn : undefined,
        actionEn: actionEn.trim() ? actionEn : undefined,
        country,
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
        <TextInput label="Pilar" value={element.pillar?.name ?? ''} readOnly />
        <TextInput label="Elemento" value={element.name} readOnly />
        <TextInput
          label="FOUNDATION"
          value={String(element.foundation_score)}
          readOnly
        />

        {/* Bloco PT */}
        <Text fw={600} mt="xs">
          Português
        </Text>

        <Textarea
          label="Problema (PT)"
          placeholder="Descreva qual é o problema atual..."
          minRows={3}
          value={problemPt}
          onChange={(e) => setProblemPt(e.currentTarget.value)}
          required
        />

        <Textarea
          label="Ação (PT)"
          placeholder="O que será feito para resolver o problema?"
          minRows={3}
          value={actionPt}
          onChange={(e) => setActionPt(e.currentTarget.value)}
          required
        />

        {/* Bloco EN */}
        <Text fw={600} mt="xs">
          English (optional)
        </Text>

        <Textarea
          label="Problem (EN)"
          placeholder="Describe the current problem..."
          minRows={3}
          value={problemEn}
          onChange={(e) => setProblemEn(e.currentTarget.value)}
        />

        <Textarea
          label="Action (EN)"
          placeholder="What will be done to solve the problem?"
          minRows={3}
          value={actionEn}
          onChange={(e) => setActionEn(e.currentTarget.value)}
        />

        <TextInput
          label="Responsável"
          placeholder="Nome do responsável pela ação"
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
            Salvar plano
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
