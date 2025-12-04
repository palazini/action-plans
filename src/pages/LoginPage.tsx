import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  LoadingOverlay,
  Box,
  Stack,
  ThemeIcon,
  rem,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { IconLogin, IconArrowLeft, IconLock, IconUser } from '@tabler/icons-react';

export function LoginPage() {
  const { selectedCountry, setSelectedCountry } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [checkingUsers, setCheckingUsers] = useState(true);

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

  useEffect(() => {
    if (!selectedCountry) {
      navigate('/');
      return;
    }

    const checkUsers = async () => {
      try {
        const { data, error } = await supabase.rpc('check_country_has_users', {
          country_name: selectedCountry,
        });

        if (error) throw error;

        if (data === false) {
          navigate('/register');
        }
      } catch (error) {
        console.error('Error checking users:', error);
      } finally {
        setCheckingUsers(false);
      }
    };

    checkUsers();
  }, [selectedCountry, navigate]);

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
        message: 'Usuário ou senha incorretos. Verifique suas credenciais.',
        color: 'red',
        icon: <IconLock size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingUsers) {
    return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />;
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top right, #f8f9fa 0%, #e9ecef 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <Container size={420} w="100%">
        <Stack align="center" mb={30}>
           <ThemeIcon size={80} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                <IconLogin size={40} stroke={1.5} />
            </ThemeIcon>
            <Box ta="center">
                <Title order={2} fw={900} c="dark.8" style={{ letterSpacing: -0.5 }}>
                {t('auth.welcomeBack')}
                </Title>
                <Text c="dimmed" size="sm" mt={5} fw={500}>
                {t('auth.accessingEnvironment')} <Text span c="blue.7" fw={700}>{selectedCountry}</Text>
                </Text>
            </Box>
        </Stack>

        <Paper withBorder shadow="md" p={30} radius="md" bg="white">
          <form onSubmit={form.onSubmit(handleLogin)}>
            <Stack gap="md">
              <TextInput
                label={t('auth.username')}
                placeholder="seunome.sobrenome"
                leftSection={<IconUser size={16} />}
                size="md"
                required
                {...form.getInputProps('username')}
              />
              <PasswordInput
                label={t('auth.password')}
                placeholder="Sua senha segura"
                leftSection={<IconLock size={16} />}
                required
                size="md"
                {...form.getInputProps('password')}
              />

              <Group justify="space-between" mt="xs">
                <Checkbox label={t('auth.rememberMe')} size="xs" />
                <Anchor component="button" size="xs" c="blue" fw={500}>
                  {t('auth.forgotPassword')}
                </Anchor>
              </Group>

              <Button fullWidth mt="md" size="md" type="submit" loading={loading} color="blue">
                {t('auth.signIn')}
              </Button>
            </Stack>
          </form>

          <Box mt="xl" style={{ borderTop: `1px solid ${rem('#f1f3f5')}` }} pt="lg">
            <Group justify="center">
                <Anchor
                component="button"
                size="sm"
                c="dimmed"
                fw={500}
                onClick={() => {
                    setSelectedCountry(null);
                    navigate('/');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                <IconArrowLeft size={14} />
                {t('auth.changeCountry')}
                </Anchor>
            </Group>
          </Box>
        </Paper>
        
        <Text ta="center" size="xs" c="dimmed" mt="xl">
            Action Plans System &copy; 2024
        </Text>
      </Container>
    </Box>
  );
}