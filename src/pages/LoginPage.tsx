import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Text,
  Container,
  Button,
  Box,
  Stack,
  ThemeIcon,
  rem,
  Image,
  Divider,
  Menu,
  UnstyledButton,
  Notification,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { IconLogin, IconLock, IconUser, IconUserPlus, IconLanguage, IconChevronDown } from '@tabler/icons-react';
import logoGroup from '../assets/group-logo-16x9.png';

// Idiomas disponíveis
const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'gb' },
  { code: 'pt', label: 'Português', flag: 'br' },
  { code: 'es', label: 'Español', flag: 'es' },
  { code: 'fr', label: 'Français', flag: 'fr' },
  { code: 'de', label: 'Deutsch', flag: 'de' },
  { code: 'it', label: 'Italiano', flag: 'it' },
  { code: 'zh', label: '中文', flag: 'cn' },
];

export function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showLanguageTip, setShowLanguageTip] = useState(true);

  // Se já está logado, redireciona
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/app');
    }
  }, [user, authLoading, navigate]);

  // Esconde o tip após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowLanguageTip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (val) => (val.length < 3 ? t('auth.usernameTooShort') : null),
      password: (val) =>
        val.length <= 6 ? t('auth.passwordTooShort') : null,
    },
  });

  const handleLogin = async (values: typeof form.values) => {
    setLoading(true);
    const email = `${values.username}@ci.aplans.com`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: values.password,
      });

      if (error) throw error;

      navigate('/app');
    } catch (error: any) {
      notifications.show({
        title: t('auth.error'),
        message: t('auth.invalidCredentials'),
        color: 'red',
        icon: <IconLock size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const currentLang = LANGUAGES.find(l => i18n.language?.startsWith(l.code)) || LANGUAGES[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowLanguageTip(false);
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
      }}
    >
      {/* Language Switcher no topo */}
      <Box
        style={{
          position: 'absolute',
          top: rem(20),
          right: rem(20),
        }}
      >
        <Menu shadow="md" width={180} position="bottom-end">
          <Menu.Target>
            <UnstyledButton
              onClick={() => setShowLanguageTip(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: rem(8),
                padding: `${rem(8)} ${rem(12)}`,
                borderRadius: rem(8),
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.2s',
              }}
            >
              <Image
                src={`https://flagcdn.com/w20/${currentLang.flag}.png`}
                w={20}
                h={14}
                radius={2}
              />
              <Text size="sm" fw={500}>{currentLang.label}</Text>
              <IconChevronDown size={14} style={{ opacity: 0.5 }} />
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>{t('auth.selectLanguage', 'Select Language')}</Menu.Label>
            {LANGUAGES.map((lang) => (
              <Menu.Item
                key={lang.code}
                leftSection={
                  <Image
                    src={`https://flagcdn.com/w20/${lang.flag}.png`}
                    w={20}
                    h={14}
                    radius={2}
                  />
                }
                onClick={() => handleLanguageChange(lang.code)}
                bg={currentLang.code === lang.code ? 'blue.0' : undefined}
              >
                {lang.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>

        {/* Popup de dica de idioma */}
        {showLanguageTip && (
          <Notification
            icon={<IconLanguage size={18} />}
            color="blue"
            onClose={() => setShowLanguageTip(false)}
            withCloseButton
            style={{
              position: 'absolute',
              top: rem(50),
              right: 0,
              width: rem(200),
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <Text size="xs">
              {t('auth.languageTipMessage', 'Click to change language')}
            </Text>
          </Notification>
        )}
      </Box>

      <Container size={440} w="100%">
        <Stack align="center" mb={30}>
          {/* Logo */}
          <Box
            p="md"
            style={{
              background: 'white',
              borderRadius: rem(12),
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <Image
              src={logoGroup}
              alt="Logo"
              h={50}
              w="auto"
              fit="contain"
            />
          </Box>

          <Box ta="center" mt="md">
            <Title order={1} fw={800} c="dark.8" style={{ letterSpacing: -1 }}>
              {t('app.title', 'OPEX Framework')}
            </Title>
            <Text c="dimmed" size="md" mt={8} fw={500}>
              {t('app.subtitle', 'Action Plans Management')}
            </Text>
          </Box>
        </Stack>

        <Paper
          shadow="md"
          p={35}
          radius="lg"
          style={{
            background: 'white',
          }}
        >
          <Stack align="center" mb="lg">
            <ThemeIcon size={56} radius="xl" variant="light" color="blue">
              <IconLogin size={28} stroke={1.5} />
            </ThemeIcon>
            <Title order={3} fw={700} c="dark.7">
              {t('auth.welcomeBack', 'Welcome back')}
            </Title>
          </Stack>

          <form onSubmit={form.onSubmit(handleLogin)}>
            <Stack gap="md">
              <TextInput
                label={t('auth.username')}
                placeholder={t('auth.usernamePlaceholder', 'your.username')}
                leftSection={<IconUser size={16} />}
                size="md"
                required
                {...form.getInputProps('username')}
              />
              <PasswordInput
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder', '******')}
                leftSection={<IconLock size={16} />}
                required
                size="md"
                {...form.getInputProps('password')}
              />

              <Button
                fullWidth
                mt="md"
                size="md"
                type="submit"
                loading={loading}
                color="blue"
                leftSection={<IconLogin size={18} />}
              >
                {t('auth.signIn', 'Sign In')}
              </Button>
            </Stack>
          </form>

          <Divider
            label={t('auth.or', 'or')}
            labelPosition="center"
            my="lg"
            color="gray.3"
          />

          <Button
            fullWidth
            variant="light"
            color="gray"
            size="md"
            leftSection={<IconUserPlus size={18} />}
            onClick={() => navigate('/register')}
          >
            {t('auth.createAccount', 'Create new account')}
          </Button>
        </Paper>

        <Text ta="center" size="xs" c="dimmed" mt="xl">
          © 2025 Continuous Improvement Framework
        </Text>
      </Container>
    </Box>
  );
}