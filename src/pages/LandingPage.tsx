import {
    Container,
    SimpleGrid,
    Card,
    Text,
    UnstyledButton,
    Group,
    Title,
    Stack,
    Box,
    Image,
    rem,
    Badge,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

// Adicionei a opção Global no início da lista
const COUNTRIES = [
    { code: 'GL', name: 'Global', flagCode: 'un', lang: 'en', region: 'World' },
    { code: 'BR', name: 'Brazil', flagCode: 'br', lang: 'pt', region: 'Americas' },
    { code: 'BR-H', name: 'Brazil (Hiter)', flagCode: 'br', lang: 'pt', region: 'Americas', badge: 'Hiter' }, 
    { code: 'USA', name: 'USA', flagCode: 'us', lang: 'en', region: 'Americas' },
    { code: 'AR', name: 'Argentina', flagCode: 'ar', lang: 'es', region: 'Americas' },
    { code: 'UK', name: 'UK', flagCode: 'gb', lang: 'en', region: 'Europe' },
    { code: 'FR', name: 'France', flagCode: 'fr', lang: 'fr', region: 'Europe' },
    { code: 'IT', name: 'Italy', flagCode: 'it', lang: 'it', region: 'Europe' },
    { code: 'CN', name: 'China', flagCode: 'cn', lang: 'zh', region: 'Asia' },
    { code: 'IN', name: 'India', flagCode: 'in', lang: 'hi', region: 'Asia' },
];

export function LandingPage() {
    const navigate = useNavigate();
    const { setSelectedCountry, user, selectedCountry } = useAuth();
    const { i18n, t } = useTranslation();

    useEffect(() => {
        if (user && selectedCountry) {
            navigate('/app');
        }
    }, [user, selectedCountry, navigate]);

    const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
        setSelectedCountry(country.name);
        i18n.changeLanguage(country.lang);
        navigate('/login');
    };

    return (
        <Box bg="gray.0" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box component="header" py="md" px="xl" bg="white" style={{ borderBottom: `1px solid ${rem('#e9ecef')}` }}>
                <Group justify="space-between">
                    <Text fw={900} size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        ActionPlans.io
                    </Text>
                </Group>
            </Box>

            <Container size="lg" py={80} style={{ flex: 1 }}>
                <Stack align="center" gap="xl" mb={60}>
                    <Badge variant="light" size="lg" radius="sm">Portal Corporativo</Badge>
                    
                    <Title order={1} ta="center" style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, color: '#1a1b1e' }}>
                        {t('landing.selectRegion', 'Selecione sua Região')}
                    </Title>
                    
                    <Text c="dimmed" size="xl" ta="center" maw={600}>
                        {t('landing.chooseCountry', 'Acesse o ambiente dedicado à sua filial para gerenciar planos de ação e backlogs.')}
                    </Text>
                </Stack>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
                    {COUNTRIES.map((country) => (
                        <UnstyledButton
                            key={country.code}
                            onClick={() => handleCountrySelect(country)}
                            style={{ height: '100%' }}
                        >
                            <Card
                                shadow="sm"
                                padding="xl"
                                radius="md"
                                withBorder
                                h="100%"
                                style={{
                                    transition: 'all 0.2s ease',
                                    backgroundColor: 'white',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--mantine-color-blue-5)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#dee2e6';
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                                }}
                            >
                                <Stack align="center" justify="center" gap="md">
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ 
                                            borderRadius: '50%', 
                                            overflow: 'hidden', 
                                            width: '64px', 
                                            height: '64px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                                        }}>
                                            <Image
                                                src={`https://flagcdn.com/w160/${country.flagCode}.png`}
                                                w="100%"
                                                h="100%"
                                                style={{ objectFit: 'cover' }}
                                                alt={country.name}
                                            />
                                        </div>
                                        {/* Badge especial para diferenciar unidades do mesmo país */}
                                        {country.badge && (
                                            <Badge 
                                                size="xs" 
                                                variant="filled" 
                                                color="blue" 
                                                style={{ position: 'absolute', bottom: -5, right: -10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            >
                                                {country.badge}
                                            </Badge>
                                        )}
                                    </div>
                                    
                                    <Stack gap={2} align="center">
                                        <Text fw={700} size="lg" c="dark.8" ta="center">
                                            {country.name}
                                        </Text>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                            {country.region}
                                        </Text>
                                    </Stack>
                                </Stack>
                            </Card>
                        </UnstyledButton>
                    ))}
                </SimpleGrid>
            </Container>
            
            <Box py="lg" ta="center" c="dimmed" fz="sm">
                © 2024 Action Plans Inc. Todos os direitos reservados.
            </Box>
        </Box>
    );
}