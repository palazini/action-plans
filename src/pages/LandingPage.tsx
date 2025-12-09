import {
    Container,
    SimpleGrid,
    Card,
    Text,
    UnstyledButton,
    Title,
    Stack,
    Box,
    Image,
    Badge
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';


const COUNTRIES = [
    { code: 'BR', name: 'Brazil', flagCode: 'br', lang: 'pt', region: 'Americas' },
    { code: 'BR-H', name: 'Brazil (Hiter)', flagCode: 'br', lang: 'pt', region: 'Americas', badge: 'Hiter' },
    { code: 'USA', name: 'USA', flagCode: 'us', lang: 'en', region: 'Americas' },
    { code: 'AR', name: 'Argentina', flagCode: 'ar', lang: 'es', region: 'Americas' },
    // Europa
    { code: 'DE', name: 'Germany (Gestra)', flagCode: 'de', lang: 'en', region: 'Europe', badge: 'Gestra' },
    { code: 'UK', name: 'UK', flagCode: 'gb', lang: 'en', region: 'Europe' },
    { code: 'FR', name: 'France', flagCode: 'fr', lang: 'fr', region: 'Europe' },
    { code: 'IT', name: 'Italy', flagCode: 'it', lang: 'it', region: 'Europe' },
    // Asia
    { code: 'CN', name: 'China', flagCode: 'cn', lang: 'zh', region: 'Asia' },
    { code: 'IN', name: 'India', flagCode: 'in', lang: 'hi', region: 'Asia' },
];

export function LandingPage() {
    const navigate = useNavigate();
    const { setSelectedCountry, user, selectedCountry } = useAuth();
    const { i18n, t } = useTranslation();

    useEffect(() => {
        // Se o usuário já está logado e tem um país selecionado, vai para o app
        if (user && selectedCountry) {
            navigate('/app');
        }
    }, [user, selectedCountry, navigate]);

    const handleCountrySelect = (countryName: string, lang: string) => {
        setSelectedCountry(countryName);
        i18n.changeLanguage(lang);
        navigate('/login');
    };

    return (
        <Box bg="gray.0" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            <Container size="xl" py="xl" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Stack align="center" gap="xl" mb={50}>
                    <Title order={1} ta="center" style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, color: '#1a1b1e' }}>
                        {t('landing.selectRegion', 'Selecione sua Região')}
                    </Title>
                    <Text c="dimmed" size="lg" ta="center" maw={600}>
                        {t('landing.chooseCountry', 'Acesse o ambiente dedicado à sua filial ou visualize o painel Global.')}
                    </Text>
                </Stack>



                {/* --- GRID DE PAÍSES --- */}
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="lg">
                    {COUNTRIES.map((country) => (
                        <UnstyledButton
                            key={country.code}
                            onClick={() => handleCountrySelect(country.name, country.lang)}
                            style={{ height: '100%' }}
                        >
                            <Card
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                withBorder
                                h="100%"
                                style={{
                                    transition: 'all 0.2s ease',
                                    backgroundColor: 'white',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--mantine-color-blue-5)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#dee2e6';
                                    e.currentTarget.style.transform = 'none';
                                }}
                            >
                                <Stack align="center" justify="center" gap="sm">
                                    <div style={{ position: 'relative' }}>
                                        <div style={{
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            width: '48px',
                                            height: '48px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }}>
                                            <Image
                                                src={`https://flagcdn.com/w80/${country.flagCode}.png`}
                                                w="100%"
                                                h="100%"
                                                style={{ objectFit: 'cover' }}
                                                alt={country.name}
                                            />
                                        </div>
                                        {country.badge && (
                                            <Badge
                                                size="xs"
                                                variant="filled"
                                                color="blue"
                                                style={{ position: 'absolute', bottom: -5, right: -12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            >
                                                {country.badge}
                                            </Badge>
                                        )}
                                    </div>

                                    <Stack gap={0} align="center">
                                        <Text fw={600} size="sm" c="dark.8" ta="center" lh={1.2}>
                                            {country.name}
                                        </Text>
                                        <Text size="10px" c="dimmed" tt="uppercase" fw={700}>
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
                © 2025 Action Plans - Continuous Improvement
            </Box>
        </Box>
    );
}
