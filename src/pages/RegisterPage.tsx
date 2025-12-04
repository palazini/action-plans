import {
    TextInput,
    PasswordInput,
    Paper,
    Title,
    Text,
    Container,
    Button,
    Box,
    Anchor,
    Group,
    Stack,
    ThemeIcon,
    rem,
    Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { IconUserPlus, IconArrowLeft, IconUser, IconLock, IconInfoCircle } from '@tabler/icons-react';

export function RegisterPage() {
    const { selectedCountry, setSelectedCountry } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (!selectedCountry) {
            navigate('/');
        }
    }, [selectedCountry, navigate]);

    const form = useForm({
        initialValues: {
            fullName: '',
            password: '',
            confirmPassword: '',
        },
        validate: {
            fullName: (val) => (val.length < 2 ? t('auth.nameTooShort') : null),
            password: (val) =>
                val.length <= 6 ? t('auth.passwordTooShort') : null,
            confirmPassword: (val, values) =>
                val !== values.password ? t('auth.passwordsDoNotMatch') : null,
        },
    });

    // Auto-generate username
    const generateUsername = (name: string) => {
        if (!name) return '';
        const parts = name.trim().toLowerCase().split(/\s+/);
        if (parts.length === 0) return '';
        if (parts.length === 1) return parts[0];
        return `${parts[0]}.${parts[parts.length - 1]}`;
    };

    const username = generateUsername(form.values.fullName);

    const handleRegister = async (values: typeof form.values) => {
        if (!username) return;

        setLoading(true);
        const email = `${username}@ci.aplans.com`;

        // LÓGICA NOVA: Define a role baseada no país selecionado
        const role = selectedCountry === 'Global' ? 'global_supervisor' : 'user';

        try {
            const { error } = await supabase.auth.signUp({
                email: email,
                password: values.password,
                options: {
                    data: {
                        full_name: values.fullName,
                        country: selectedCountry,
                        username: username,
                        role: role, // Enviando a role correta para o metadata
                    },
                },
            });

            if (error) throw error;

            notifications.show({
                title: 'Sucesso',
                message: t('auth.successRegistration'),
                color: 'green',
            });

            navigate('/login');
        } catch (error: any) {
            notifications.show({
                title: t('auth.error'),
                message: error.message,
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

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
            <Container size={460} w="100%">
                <Stack align="center" mb={30}>
                    <ThemeIcon size={80} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        <IconUserPlus size={40} stroke={1.5} />
                    </ThemeIcon>
                    <Box ta="center">
                        <Title order={2} fw={900} c="dark.8" style={{ letterSpacing: -0.5 }}>
                            {t('auth.createAccount')}
                        </Title>
                        <Text c="dimmed" size="sm" mt={5} fw={500}>
                            {t('auth.firstUser', { country: selectedCountry })}
                        </Text>
                    </Box>
                </Stack>

                <Paper
                    withBorder
                    shadow="md"
                    p={30}
                    radius="md"
                    bg="white"
                >
                    <form onSubmit={form.onSubmit(handleRegister)}>
                        <Stack gap="md">
                            <TextInput
                                label={t('auth.fullName')}
                                placeholder="Ex: Gabriel Palazini"
                                leftSection={<IconUser size={16} />}
                                size="md"
                                required
                                {...form.getInputProps('fullName')}
                            />

                            {username && (
                                <Alert 
                                    variant="light" 
                                    color="blue" 
                                    title={t('auth.generatedUsername')} 
                                    icon={<IconInfoCircle size={16} />}
                                    styles={{ label: { fontWeight: 700 } }}
                                >
                                    <Group justify="space-between" align="center">
                                        <Text size="lg" fw={700} c="blue.7" style={{ fontFamily: 'monospace' }}>
                                            {username}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {t('auth.loginWithThis')}
                                        </Text>
                                    </Group>
                                </Alert>
                            )}

                            <PasswordInput
                                label={t('auth.password')}
                                placeholder="******"
                                leftSection={<IconLock size={16} />}
                                required
                                size="md"
                                mt="xs"
                                {...form.getInputProps('password')}
                            />
                            <PasswordInput
                                label={t('auth.confirmPassword')}
                                placeholder="******"
                                leftSection={<IconLock size={16} />}
                                required
                                size="md"
                                {...form.getInputProps('confirmPassword')}
                            />

                            <Button fullWidth mt="xl" size="md" type="submit" loading={loading} color="blue">
                                {t('auth.register')}
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