// src/layout/MainLayout.tsx
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
  IconBuildingFactory,
  IconDownload,
  IconFileSpreadsheet,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';
import logoGroup from '../assets/group-logo-16x9.png';

// 👇 novos imports para export global
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { fetchActionPlans } from '../services/api';

// Lista completa disponível para troca de contexto
// ORGANIZADO EM ORDEM ALFABÉTICA
const AVAILABLE_COUNTRIES = [
  { name: 'Global', code: 'GL', displayName: 'Global' },
  { name: 'Argentina', code: 'AR' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Brazil (Hiter)', code: 'BR' },
  { name: 'China', code: 'CN' },
  { name: 'Germany (Gestra)', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'India', code: 'IN' },
  { name: 'Italy', code: 'IT' },
  { name: 'UK', code: 'GB' },
  { name: 'USA', code: 'US' },
];

const NAV_ITEMS = [
  { labelKey: 'nav.dashboard', path: '/app', icon: IconDashboard, end: true },
  { labelKey: 'nav.actionPlans', path: '/app/plans', icon: IconListCheck },
  { labelKey: 'nav.backlog', path: '/app/backlog', icon: IconChecklist },
  { labelKey: 'nav.structure', path: '/app/structure', icon: IconHierarchy2 },
];

export function MainLayout() {
  const [opened, setOpened] = useState(false);
  const [exportingGlobal, setExportingGlobal] = useState(false); // 🔹 estado do export global

  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut, selectedCountry, setSelectedCountry, userRole } = useAuth();
  const theme = useMantineTheme();

  const isGlobalSupervisor = userRole === 'global_supervisor';
  const canExportGlobal = selectedCountry === 'Global';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSwitchCountry = (countryName: string) => {
    setSelectedCountry(countryName);
    navigate('/app');
  };

  // Helper para ícone do menu
  const getCountryIcon = (code: string) => {
    if (code === 'GL') return <IconWorld size={14} />; // ícone do globo para Global
    return (
      <Image
        src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`}
        w={14}
      />
    );
  };

  // 🔹 Exporta TODOS os planos de TODOS os países (exceto Global) em EN
  const handleExportGlobalPlans = async () => {
    if (exportingGlobal) return;
    setExportingGlobal(true);

    try {
      const workbook = new ExcelJS.Workbook();

      const columns = [
        { header: 'Country', key: 'country', width: 18 },
        { header: 'Pillar', key: 'pillar', width: 12 },
        { header: 'Element', key: 'element', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Problem (EN)', key: 'problem', width: 50 },
        { header: 'Action (EN)', key: 'action', width: 50 },
        { header: 'Owner', key: 'owner', width: 25 },
        { header: 'Due Date', key: 'dueDate', width: 15 },
      ];

      const setupWorksheet = (sheetName: string, data: any[]) => {
        const sheet = workbook.addWorksheet(sheetName);
        sheet.columns = columns;
        sheet.addRows(data);

        sheet.eachRow((row, rowNumber) => {
          row.alignment = {
            vertical: 'top',
            wrapText: true,
            horizontal: 'left',
          };

          if (rowNumber === 1) {
            row.height = 25;
            row.eachCell((cell) => {
              cell.font = {
                bold: true,
                color: { argb: 'FFFFFFFF' },
                size: 12,
              };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF228BE6' }, // azul
              };
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
              };
            });
          } else {
            row.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
              };
              if (rowNumber % 2 === 0) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF8F9FA' }, // cinza claro
                };
              }
            });
          }
        });
      };

      // Países que realmente existem na base (ignoramos "Global")
      const exportCountries = AVAILABLE_COUNTRIES.filter(
        (c) => c.name !== 'Global',
      );

      for (const country of exportCountries) {
        const countryName = country.name;
        const plans = await fetchActionPlans(countryName);

        const sheetData = plans.map((p) => ({
          country: countryName,
          pillar: p.element?.pillar?.code ?? p.element?.pillar?.name ?? '',
          element: p.element?.name ?? '',
          status: p.status,
          problem:
            p.problem_en ??
            p.problem_pt ??
            p.problem ??
            '',
          action:
            p.action_en ??
            p.action_pt ??
            p.solution ??
            '',
          owner: p.owner_name,
          dueDate: p.due_date ?? '',
        }));

        setupWorksheet(countryName, sheetData);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const today = new Date().toISOString().split('T')[0];
      saveAs(blob, `Action_Plans_GLOBAL_EN_${today}.xlsx`);
    } catch (err) {
      console.error('Error exporting global plans:', err);
    } finally {
      setExportingGlobal(false);
    }
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

            {/* 🔹 BOTÃO EXPORT GLOBAL (só para Global Supervisor) */}
            {canExportGlobal && (
              <Tooltip label={t('nav.exportGlobal', 'Exportar todos os planos (EN)')}>
                <Button
                  variant="light"
                  size="xs"
                  onClick={handleExportGlobalPlans}
                  leftSection={<IconDownload size={14} />}
                  rightSection={<IconFileSpreadsheet size={14} />}
                  loading={exportingGlobal}
                >
                  {t('nav.exportGlobalShort', 'Exportar Global')}
                </Button>
              </Tooltip>
            )}

            {/* SELETOR DE PAÍS (Agora visível para todos) */}
            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <Tooltip label="Alterar visualização de unidade">
                  <Button
                    variant="light"
                    color={selectedCountry === 'Global' ? 'violet' : 'blue'}
                    size="xs"
                    leftSection={selectedCountry === 'Global' ? <IconWorld size={14} /> : <IconBuildingFactory size={14} />}
                    rightSection={<IconChevronRight size={12} style={{ opacity: 0.5 }} />}
                  >
                    {selectedCountry ?? 'Selecionar'}
                  </Button>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Menu.Label>{t('nav.viewDataFrom')}</Menu.Label>
                {AVAILABLE_COUNTRIES.map((c) => (
                  <Menu.Item
                    key={c.name}
                    leftSection={getCountryIcon(c.code)}
                    onClick={() => handleSwitchCountry(c.name)}
                    bg={selectedCountry === c.name ? (c.name === 'Global' ? 'violet.1' : 'blue.1') : undefined}
                    color={selectedCountry === c.name ? 'black' : undefined}
                    style={{ fontWeight: selectedCountry === c.name ? 600 : 400 }}
                  >
                    {c.displayName ?? c.name}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>

            <LanguageSwitcher />

            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar color="blue" radius="xl" size="sm">
                      {user?.email?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box visibleFrom="sm">
                      <Text size="sm" fw={500} lh={1}>
                        {user?.user_metadata?.full_name || 'User'}
                      </Text>
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
