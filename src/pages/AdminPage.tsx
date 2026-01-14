// src/pages/AdminPage.tsx
import { useState, useMemo } from 'react';
import {
    Card,
    Center,
    Group,
    Loader,
    Stack,
    Table,
    Text,
    Title,
    Badge,
    TextInput,
    ThemeIcon,
    Box,
    Alert,
    SimpleGrid,
    Paper,
    Accordion,
    Image,
} from '@mantine/core';
import {
    IconUsers,
    IconSearch,
    IconAlertCircle,
    IconShieldLock,
    IconUserOff,
    IconCheck,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllUsers, type UserProfile } from '../services/api';
import { AVAILABLE_COUNTRIES } from '../data/countries';

// Countries that can have users (exclude Global)
const USER_COUNTRIES = AVAILABLE_COUNTRIES.filter(c => c.name !== 'Global');

export function AdminPage() {
    const [search, setSearch] = useState('');

    const { data: users = [], isLoading, error } = useQuery({
        queryKey: ['admin-users'],
        queryFn: fetchAllUsers,
    });

    // Group users by country
    const usersByCountry = useMemo(() => {
        const map = new Map<string, UserProfile[]>();

        // Initialize all countries with empty arrays
        for (const country of USER_COUNTRIES) {
            map.set(country.name, []);
        }

        // Add users to their countries
        for (const user of users) {
            const country = user.country || 'Unknown';
            if (!map.has(country)) {
                map.set(country, []);
            }
            map.get(country)!.push(user);
        }

        return map;
    }, [users]);

    // Countries with and without users
    const countriesWithUsers = useMemo(() => {
        return USER_COUNTRIES.filter(c => (usersByCountry.get(c.name)?.length ?? 0) > 0);
    }, [usersByCountry]);

    const countriesWithoutUsers = useMemo(() => {
        return USER_COUNTRIES.filter(c => (usersByCountry.get(c.name)?.length ?? 0) === 0);
    }, [usersByCountry]);

    // Filter users by search
    const filteredUsersByCountry = useMemo(() => {
        if (!search) return usersByCountry;

        const filtered = new Map<string, UserProfile[]>();
        for (const [country, countryUsers] of usersByCountry) {
            const matchingUsers = countryUsers.filter(
                u =>
                    u.name?.toLowerCase().includes(search.toLowerCase()) ||
                    u.role?.toLowerCase().includes(search.toLowerCase())
            );
            if (matchingUsers.length > 0) {
                filtered.set(country, matchingUsers);
            }
        }
        return filtered;
    }, [usersByCountry, search]);

    // Get flag code for country
    const getFlagCode = (countryName: string) => {
        const country = AVAILABLE_COUNTRIES.find(c => c.name === countryName);
        if (!country) return null;
        const code = country.code.split('_')[0].toLowerCase();
        return code === 'gl' ? null : code;
    };

    if (isLoading) {
        return (
            <Center h={400}>
                <Loader size="lg" type="dots" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                title="Error"
                variant="filled"
            >
                Failed to load users. Please try again.
            </Alert>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Box>
                <Group gap="sm">
                    <ThemeIcon
                        variant="gradient"
                        gradient={{ from: 'red', to: 'orange' }}
                        size="xl"
                        radius="md"
                    >
                        <IconShieldLock size={24} />
                    </ThemeIcon>
                    <div>
                        <Title order={2} c="dark.8" fw={800}>
                            User Management
                        </Title>
                        <Text c="dimmed" size="sm">
                            Admin-only view of all registered users by country
                        </Text>
                    </div>
                </Group>
            </Box>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                <Paper p="md" radius="md" withBorder>
                    <Group gap="xs">
                        <ThemeIcon color="blue" variant="light" size="lg">
                            <IconUsers size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{users.length}</Text>
                            <Text size="xs" c="dimmed">Total Users</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group gap="xs">
                        <ThemeIcon color="green" variant="light" size="lg">
                            <IconCheck size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{countriesWithUsers.length}</Text>
                            <Text size="xs" c="dimmed">Countries with Users</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group gap="xs">
                        <ThemeIcon color="red" variant="light" size="lg">
                            <IconUserOff size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{countriesWithoutUsers.length}</Text>
                            <Text size="xs" c="dimmed">Countries without Users</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Countries without users - Alert */}
            {countriesWithoutUsers.length > 0 && (
                <Alert
                    icon={<IconUserOff size={16} />}
                    color="orange"
                    title="Countries without registered users"
                    variant="light"
                >
                    <Group gap="xs" mt="xs">
                        {countriesWithoutUsers.map(country => {
                            const flagCode = getFlagCode(country.name);
                            return (
                                <Badge
                                    key={country.name}
                                    size="lg"
                                    variant="outline"
                                    color="orange"
                                    leftSection={
                                        flagCode && (
                                            <Image
                                                src={`https://flagcdn.com/w20/${flagCode}.png`}
                                                w={16}
                                                h={12}
                                                radius={2}
                                            />
                                        )
                                    }
                                >
                                    {country.name}
                                </Badge>
                            );
                        })}
                    </Group>
                </Alert>
            )}

            {/* Search */}
            <TextInput
                placeholder="Search by name or role..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                w={300}
            />

            {/* Users by Country - Accordion */}
            <Card
                radius="lg"
                shadow="sm"
                p="xl"
                style={{ border: '1px solid var(--mantine-color-gray-2)' }}
            >
                <Accordion variant="separated" radius="md">
                    {Array.from(filteredUsersByCountry.entries())
                        .filter(([_, countryUsers]) => countryUsers.length > 0)
                        .sort((a, b) => b[1].length - a[1].length) // Sort by user count desc
                        .map(([country, countryUsers]) => {
                            const flagCode = getFlagCode(country);
                            return (
                                <Accordion.Item key={country} value={country}>
                                    <Accordion.Control>
                                        <Group gap="sm">
                                            {flagCode && (
                                                <Image
                                                    src={`https://flagcdn.com/w20/${flagCode}.png`}
                                                    w={24}
                                                    h={16}
                                                    radius={2}
                                                />
                                            )}
                                            <Text fw={600}>{country}</Text>
                                            <Badge size="sm" variant="light" color="blue">
                                                {countryUsers.length} {countryUsers.length === 1 ? 'user' : 'users'}
                                            </Badge>
                                        </Group>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Table verticalSpacing="sm" highlightOnHover>
                                            <Table.Thead bg="gray.0">
                                                <Table.Tr>
                                                    <Table.Th>Name</Table.Th>
                                                    <Table.Th>Role</Table.Th>
                                                    <Table.Th>Registered</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {countryUsers.map((user: UserProfile) => (
                                                    <Table.Tr key={user.id}>
                                                        <Table.Td>
                                                            <Text size="sm" fw={500}>
                                                                {user.name || '—'}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Badge
                                                                size="sm"
                                                                variant="light"
                                                                color={
                                                                    user.role === 'global_supervisor'
                                                                        ? 'violet'
                                                                        : user.role === 'admin'
                                                                            ? 'red'
                                                                            : 'gray'
                                                                }
                                                            >
                                                                {user.role || 'user'}
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text size="xs" c="dimmed">
                                                                {user.created_at
                                                                    ? new Date(user.created_at).toLocaleDateString()
                                                                    : '—'}
                                                            </Text>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            );
                        })}
                </Accordion>

                {filteredUsersByCountry.size === 0 && (
                    <Center p="xl">
                        <Text c="dimmed">No users found matching your search.</Text>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}
