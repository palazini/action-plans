// src/layout/MainLayout.tsx (ou o caminho que você estiver usando)
import { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  Text,
  NavLink,
  Box,
  Image,
} from '@mantine/core';
import {
  IconDashboard,
  IconChecklist,
  IconListCheck,
  IconHierarchy2,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import logoGroup from '../assets/group-logo-16x9.png'; // ajuste o caminho/nome se precisar

const NAV_ITEMS = [
  { labelKey: 'nav.dashboard', path: '/', icon: IconDashboard },
  { labelKey: 'nav.actionPlans', path: '/plans', icon: IconListCheck },
  { labelKey: 'nav.backlog', path: '/backlog', icon: IconChecklist },
  { labelKey: 'nav.structure', path: '/structure', icon: IconHierarchy2 },
];

export function MainLayout() {
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          {/* Lado esquerdo: burger + logo + textos */}
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              hiddenFrom="sm"
              size="sm"
            />

            <Group gap="sm" wrap="nowrap">
              <Image
                src={logoGroup}
                alt={t('app.title')}
                h={32}
                w="auto"
                fit="contain"
                radius="sm"
              />

              <Box>
                <Text fw={700} lh={1.2}>
                  {t('app.title')}
                </Text>
              </Box>
            </Group>
          </Group>

          {/* Lado direito: seletor de idioma mais estiloso */}
          <Group gap="xs">
            <LanguageSwitcher />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              label={t(item.labelKey)}
              leftSection={<Icon size={18} />}
              active={active}
              onClick={() => {
                navigate(item.path);
                setOpened(false);
              }}
              mb={4}
            />
          );
        })}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
