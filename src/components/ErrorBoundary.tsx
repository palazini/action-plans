// src/components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
    Container,
    Title,
    Text,
    Button,
    Stack,
    Center,
    ThemeIcon,
    Paper,
} from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary global para capturar erros JavaScript em componentes filhos.
 * Mostra uma tela amigável ao invés de deixar a aplicação quebrar.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Atualiza o state para que a próxima renderização mostre a UI de fallback
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Você pode registrar o erro em um serviço de monitoramento aqui
        // Ex: Sentry, LogRocket, etc.
        console.error('ErrorBoundary caught an error:', error);
        console.error('Error info:', errorInfo);

        this.setState({ errorInfo });
    }

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <Center h="100vh" bg="gray.0">
                    <Container size="sm">
                        <Paper p="xl" radius="md" shadow="sm" withBorder>
                            <Stack align="center" gap="lg">
                                <ThemeIcon size={80} radius="xl" color="red" variant="light">
                                    <IconAlertTriangle size={48} />
                                </ThemeIcon>

                                <Title order={2} ta="center" c="dark.7">
                                    Oops, something went wrong
                                </Title>

                                <Text ta="center" c="dimmed" size="md">
                                    An unexpected error occurred.
                                    <br />
                                    Please try reloading the page.
                                </Text>

                                {import.meta.env.DEV && this.state.error && (
                                    <Paper
                                        p="sm"
                                        radius="sm"
                                        bg="red.0"
                                        style={{ width: '100%', overflow: 'auto' }}
                                    >
                                        <Text size="xs" c="red.8" ff="monospace">
                                            {this.state.error.toString()}
                                        </Text>
                                        {this.state.errorInfo && (
                                            <Text size="xs" c="red.6" ff="monospace" mt="xs">
                                                {this.state.errorInfo.componentStack?.slice(0, 500)}
                                            </Text>
                                        )}
                                    </Paper>
                                )}

                                <Stack gap="sm" w="100%">
                                    <Button
                                        leftSection={<IconRefresh size={18} />}
                                        onClick={this.handleReload}
                                        fullWidth
                                        size="md"
                                    >
                                        Reload Page
                                    </Button>

                                    <Button
                                        variant="light"
                                        onClick={this.handleGoHome}
                                        fullWidth
                                        size="md"
                                    >
                                        Go to Home
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Container>
                </Center>
            );
        }

        return this.props.children;
    }
}
