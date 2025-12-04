import { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  Text,
  NavLink,
  Box,
  rem,
  Avatar,
  Menu,
  UnstyledButton,
  useMantineTheme,
  Image,
  Badge,
  Tooltip,
  Button,
} from '@mantine/core';
import {
  IconDashboard,
  IconChecklist,
  IconListCheck,
  IconHierarchy2,
  IconLogout,
  IconChevronRight,
  IconSettings,
  IconWorld,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';
import logoGroup from '../assets/group-logo-16x9.png'; 

const AVAILABLE_COUNTRIES = [
    { name: 'Brazil', code: 'BR' },
    { name: 'Brazil (Hiter)', code: 'BR' },
    { name: 'USA', code: 'US' },
    { name: 'UK', code: 'GB' },
    { name: 'France', code: 'FR' },
    { name: 'Italy', code: 'IT' },
    { name: 'China', code: 'CN' },
    { name: 'India', code: 'IN' },
    { name: 'Argentina', code: 'AR' },
];

const NAV_ITEMS = [
  { labelKey: 'nav.dashboard', path: '/app', icon: IconDashboard, end: true },
  { labelKey: 'nav.actionPlans', path: '/app/plans', icon: IconListCheck },
  { labelKey: 'nav.backlog', path: '/app/backlog', icon: IconChecklist },
  { labelKey: 'nav.structure', path: '/app/structure', icon: IconHierarchy2 },
];

export function MainLayout() {
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut, selectedCountry, setSelectedCountry, userRole } = useAuth(); // Pegando userRole do contexto
  const theme = useMantineTheme();

  // Verifica se é supervisor usando a role vinda do banco
  const isGlobalSupervisor = userRole === 'global_supervisor';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSwitchCountry = (countryName: string) => {
    setSelectedCountry(countryName);
    // Ao trocar o país, navegamos para a dashboard para garantir refresh dos dados
    navigate('/app'); 
  };

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      bg="gray.0"
    >
      <AppShell.Header bg="white" style={{ borderBottom: `1px solid ${rem('#e9ecef')}` }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/app')}>
                <Image
                    src={logoGroup}
                    alt="OPEX"
                    h={32}
                    w="auto"
                    fit="contain"
                />
                <Box visibleFrom="xs">
                    <Text fw={900} size="lg" lh={1.1} c="dark.8" style={{ letterSpacing: -0.5 }}>
                        {t('app.title')}
                    </Text>
                    <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: 0.5 }}>
                        {t('app.subtitle')}
                    </Text>
                </Box>
            </Group>
          </Group>

          <Group gap="sm">
            {/* Seletor de Contexto para Supervisor */}
            {isGlobalSupervisor && (
                <Menu shadow="md" width={200} position="bottom-end">
                    <Menu.Target>
                        <Tooltip label="Alternar visão de país (Supervisor)">
                            <Button 
                                variant="light" 
                                color="violet" 
                                size="xs" 
                                leftSection={<IconWorld size={14} />}
                                rightSection={<IconChevronRight size={12} style={{ opacity: 0.5 }} />}
                            >
                                {selectedCountry}
                            </Button>
                        </Tooltip>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>Visualizar dados de:</Menu.Label>
                        {AVAILABLE_COUNTRIES.map((c) => (
                            <Menu.Item 
                                key={c.name}
                                leftSection={<Image src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} w={14} />}
                                onClick={() => handleSwitchCountry(c.name)}
                                bg={selectedCountry === c.name ? 'violet.0' : undefined}
                                style={{ fontWeight: selectedCountry === c.name ? 600 : 400 }}
                            >
                                {c.name}
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            )}

            <LanguageSwitcher />
            
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                    <Group gap="xs">
                        <Avatar color="blue" radius="xl" size="sm">
                            {user?.email?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box visibleFrom="sm">
                            <Text size="sm" fw={500} lh={1}>{user?.user_metadata?.full_name || 'User'}</Text>
                            <Group gap={4}>
                                <Text size="xs" c="dimmed">
                                    {selectedCountry}
                                </Text>
                                {isGlobalSupervisor && (
                                    <Badge size="xs" variant="filled" color="violet" circle p={3} title="Global Supervisor">
                                        G
                                    </Badge>
                                )}
                            </Group>
                        </Box>
                    </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>{t('nav.account')}</Menu.Label>
                <Menu.Item leftSection={<IconSettings size={14} />}>
                  {t('nav.settings')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                    color="red" 
                    leftSection={<IconLogout size={14} />}
                    onClick={handleLogout}
                >
                  {t('nav.logout')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="white" style={{ borderRight: `1px solid ${rem('#e9ecef')}` }}>
        <Box mb="lg">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs" style={{ letterSpacing: 0.5 }}>
                {t('nav.mainMenu')}
            </Text>
            {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.end 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path);

            return (
                <NavLink
                key={item.path}
                label={<Text fw={600} size="sm">{t(item.labelKey)}</Text>}
                leftSection={<Icon size={20} stroke={1.5} />}
                active={active}
                variant="light"
                color="blue"
                onClick={() => {
                    navigate(item.path);
                    setOpened(false);
                }}
                rightSection={active && <IconChevronRight size={14} stroke={1.5} />}
                style={{ borderRadius: theme.radius.sm, marginBottom: 4 }}
                />
            );
            })}
        </Box>

        <Box mt="auto" pt="md" style={{ borderTop: `1px solid ${rem('#e9ecef')}` }}>
             <Text size="xs" c="dimmed" ta="center">
                {t('nav.version')} 1.0.0
             </Text>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}