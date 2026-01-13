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
    Select,
    Image,
    Menu,
    UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { IconUserPlus, IconArrowLeft, IconUser, IconLock, IconInfoCircle, IconBuildingFactory, IconChevronDown } from '@tabler/icons-react';

// Lista de plantas disponíveis
const AVAILABLE_PLANTS = [
    { value: 'Argentina', label: 'Argentina', flagCode: 'ar', region: 'Americas' },
    { value: 'Brazil', label: 'Brazil', flagCode: 'br', region: 'Americas' },
    { value: 'Brazil (Hiter)', label: 'Brazil (Hiter)', flagCode: 'br', region: 'Americas' },
    { value: 'China', label: 'China', flagCode: 'cn', region: 'Asia' },
    { value: 'France', label: 'France', flagCode: 'fr', region: 'Europe' },
    { value: 'Germany (Gestra)', label: 'Germany (Gestra)', flagCode: 'de', region: 'Europe' },
    { value: 'India', label: 'India', flagCode: 'in', region: 'Asia' },
    { value: 'Italy', label: 'Italy', flagCode: 'it', region: 'Europe' },
    { value: 'UK', label: 'UK', flagCode: 'gb', region: 'Europe' },
    { value: 'USA', label: 'USA', flagCode: 'us', region: 'Americas' },
];

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

export function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { t, i18n } = useTranslation();

    const form = useForm({
        initialValues: {
            fullName: '',
            password: '',
            confirmPassword: '',
            plant: '',
        },
        validate: {
            fullName: (val) => (val.length < 2 ? t('auth.nameTooShort') : null),
            password: (val) =>
                val.length <= 6 ? t('auth.passwordTooShort') : null,
            confirmPassword: (val, values) =>
                val !== values.password ? t('auth.passwordsDoNotMatch') : null,
            plant: (val) => (!val ? t('auth.selectPlant', 'Select a plant') : null),
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

        try {
            const { error } = await supabase.auth.signUp({
                email: email,
                password: values.password,
                options: {
                    data: {
                        full_name: values.fullName,
                        country: values.plant,
                        username: username,
                        role: 'user',
                    },
                },
            });

            if (error) throw error;

            notifications.show({
                title: t('notifications.success'),
                message: t('auth.successRegistration'),
                color: 'green',
            });

            // Navega direto para o app (Supabase auto-loga após registro)
            navigate('/app');
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

    // Custom render para o select de plantas
    const renderPlantOption = ({ option }: { option: { value: string; label?: string } }) => {
        const plant = AVAILABLE_PLANTS.find(p => p.value === option.value);
        if (!plant) return option.value;

        return (
            <Group gap="sm">
                <Image
                    src={`https://flagcdn.com/w20/${plant.flagCode}.png`}
                    w={20}
                    h={14}
                    radius={2}
                />
                <div>
                    <Text size="sm" fw={500}>{plant.label}</Text>
                    <Text size="xs" c="dimmed">{plant.region}</Text>
                </div>
            </Group>
        );
    };

    const currentLang = LANGUAGES.find(l => i18n.language?.startsWith(l.code)) || LANGUAGES[0];

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
            {/* Language Switcher no topo - Dropdown */}
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
                                onClick={() => i18n.changeLanguage(lang.code)}
                                bg={currentLang.code === lang.code ? 'blue.0' : undefined}
                            >
                                {lang.label}
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            </Box>

            <Container size={480} w="100%">
                <Stack align="center" mb={30}>
                    <ThemeIcon
                        size={80}
                        radius="xl"
                        variant="light"
                        color="blue"
                    >
                        <IconUserPlus size={40} stroke={1.5} />
                    </ThemeIcon>
                    <Box ta="center">
                        <Title order={2} fw={800} c="dark.8" style={{ letterSpacing: -0.5 }}>
                            {t('auth.createAccount', 'Create Account')}
                        </Title>
                        <Text c="dimmed" size="sm" mt={5} fw={500}>
                            {t('auth.joinYourPlant', 'Join your plant team')}
                        </Text>
                    </Box>
                </Stack>

                <Paper
                    shadow="md"
                    p={30}
                    radius="lg"
                    style={{
                        background: 'white',
                    }}
                >
                    <form onSubmit={form.onSubmit(handleRegister)}>
                        <Stack gap="md">
                            {/* Seleção de Planta */}
                            <Select
                                label={t('auth.selectYourPlant', 'Select your Plant')}
                                placeholder={t('auth.choosePlant', 'Choose plant...')}
                                leftSection={<IconBuildingFactory size={16} />}
                                data={AVAILABLE_PLANTS}
                                renderOption={renderPlantOption}
                                size="md"
                                required
                                searchable
                                {...form.getInputProps('plant')}
                            />

                            <TextInput
                                label={t('auth.fullName')}
                                placeholder="Ex: John Smith"
                                leftSection={<IconUser size={16} />}
                                size="md"
                                required
                                {...form.getInputProps('fullName')}
                            />

                            {username && (
                                <Alert
                                    variant="light"
                                    color="blue"
                                    title={t('auth.generatedUsername', 'Generated Username')}
                                    icon={<IconInfoCircle size={16} />}
                                >
                                    <Group justify="space-between" align="center">
                                        <Text size="lg" fw={700} c="blue.7" style={{ fontFamily: 'monospace' }}>
                                            {username}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {t('auth.loginWithThis', 'Use this to login')}
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

                            <Button
                                fullWidth
                                mt="xl"
                                size="md"
                                type="submit"
                                loading={loading}
                                color="blue"
                            >
                                {t('auth.register', 'Create Account')}
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
                                onClick={() => navigate('/')}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <IconArrowLeft size={14} />
                                {t('auth.backToLogin', 'Back to Login')}
                            </Anchor>
                        </Group>
                    </Box>
                </Paper>

                <Text ta="center" size="xs" c="dimmed" mt="xl">
                    © 2025 Continuous Improvement Framework
                </Text>
            </Container>
        </Box>
    );
}