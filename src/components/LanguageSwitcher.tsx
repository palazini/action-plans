// src/components/LanguageSwitcher.tsx
import { Box, Group, SegmentedControl, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

function FlagBR() {
  return (
    <Box component="span" style={{ display: 'inline-flex' }}>
      <svg
        width="16"
        height="12"
        viewBox="0 0 16 12"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* fundo verde */}
        <rect width="16" height="12" fill="#009B3A" rx="1.5" />
        {/* losango amarelo */}
        <path d="M8 1L14 6L8 11L2 6L8 1Z" fill="#FFDF00" />
        {/* círculo azul simplificado */}
        <circle cx="8" cy="6" r="2.3" fill="#002776" />
      </svg>
    </Box>
  );
}

function FlagUK() {
  return (
    <Box component="span" style={{ display: 'inline-flex' }}>
      <svg
        width="16"
        height="12"
        viewBox="0 0 16 12"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* fundo azul */}
        <rect width="16" height="12" fill="#012169" rx="1.5" />

        {/* diagonais brancas */}
        <path
          d="M-1 0L2 0L17 11L17 12L14 12L-1 1Z"
          fill="#FFFFFF"
        />
        <path
          d="M17 0L14 0L-1 11L-1 12L2 12L17 1Z"
          fill="#FFFFFF"
        />

        {/* diagonais vermelhas */}
        <path
          d="M-1 0L0.5 0L17 10.5V12L15.5 12L-1 1.5Z"
          fill="#C8102E"
        />
        <path
          d="M17 0L15.5 0L-1 10.5V12L0.5 12L17 1.5Z"
          fill="#C8102E"
        />

        {/* cruz branca horizontal/vertical */}
        <rect x="6.25" width="3.5" height="12" fill="#FFFFFF" />
        <rect y="4.25" width="16" height="3.5" fill="#FFFFFF" />

        {/* cruz vermelha central */}
        <rect x="7" width="2" height="12" fill="#C8102E" />
        <rect y="5" width="16" height="2" fill="#C8102E" />
      </svg>
    </Box>
  );
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const current =
    i18n.language && i18n.language.startsWith('en') ? 'en' : 'pt';

  return (
    <Box
      px={4}
      py={2}
      style={{
        borderRadius: 999,
        border: '1px solid var(--mantine-color-gray-3)',
        backgroundColor: 'var(--mantine-color-gray-0)',
      }}
    >
      <SegmentedControl
        size="xs"
        radius="xl"
        value={current}
        onChange={(value) => i18n.changeLanguage(value)}
        data={[
          {
            value: 'pt',
            label: (
              <Group gap={4} wrap="nowrap">
                <FlagBR />
                <Text fz="xs" fw={500} component="span">
                  PT
                </Text>
              </Group>
            ),
          },
          {
            value: 'en',
            label: (
              <Group gap={4} wrap="nowrap">
                <FlagUK />
                <Text fz="xs" fw={500} component="span">
                  EN
                </Text>
              </Group>
            ),
          },
        ]}
      />
    </Box>
  );
}
