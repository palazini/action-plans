import {
    Paper,
    Title,
    Text,
    Container,
    Anchor,
    Group,
    Stack,
    ThemeIcon,
    rem,
    Box,
    Image,
    Menu,
    UnstyledButton,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconUserOff, IconChevronDown } from '@tabler/icons-react';

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
    const { t, i18n } = useTranslation();

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
                        color="gray"
                    >
                        <IconUserOff size={40} stroke={1.5} />
                    </ThemeIcon>
                    <Box ta="center">
                        <Title order={2} fw={800} c="dark.8" style={{ letterSpacing: -0.5 }}>
                            {t('auth.registrationDisabled', 'Registration Unavailable')}
                        </Title>
                    </Box>
                </Stack>

                <Paper
                    shadow="md"
                    p={30}
                    radius="lg"
                    style={{
                        background: 'white',
                        textAlign: 'center'
                    }}
                >
                    <Text size="md" c="dimmed" mb="lg">
                        {t('auth.registrationMessage', 'Please contact gabriel.palazini@br.spiraxsarco.com to request access. It is no longer possible to register directly through the platform.')}
                    </Text>

                    <Text size="sm" fw={600} c="blue">
                        gabriel.palazini@br.spiraxsarco.com
                    </Text>

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
