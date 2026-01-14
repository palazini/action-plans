// src/components/LevelBanner.tsx
import { Box, Group, Text, ThemeIcon, Badge, Paper } from '@mantine/core';
import {
    IconBuildingBank,
    IconTrophy,
    IconMedal,
    IconCrown,
    IconDiamond,
    IconArrowRight,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { MaturityLevel } from '../types';

type BannerConfig = {
    icon: React.ElementType;
    color: string;
    gradient: string;
    nextLevel: MaturityLevel | null;
};

const BANNER_CONFIGS: Record<MaturityLevel, BannerConfig> = {
    FOUNDATION: {
        icon: IconBuildingBank,
        color: '#495057',
        gradient: 'linear-gradient(135deg, #868e96 0%, #495057 100%)',
        nextLevel: 'BRONZE',
    },
    BRONZE: {
        icon: IconMedal,
        color: '#d9480f',
        gradient: 'linear-gradient(135deg, #fd7e14 0%, #d9480f 100%)',
        nextLevel: 'SILVER',
    },
    SILVER: {
        icon: IconTrophy,
        color: '#495057',
        gradient: 'linear-gradient(135deg, #adb5bd 0%, #495057 100%)',
        nextLevel: 'GOLD',
    },
    GOLD: {
        icon: IconCrown,
        color: '#f08c00',
        gradient: 'linear-gradient(135deg, #fab005 0%, #f08c00 100%)',
        nextLevel: 'PLATINUM',
    },
    PLATINUM: {
        icon: IconDiamond,
        color: '#7048e8',
        gradient: 'linear-gradient(135deg, #845ef7 0%, #7048e8 100%)',
        nextLevel: null,
    },
};

type LevelBannerProps = {
    level: MaturityLevel;
    planCount: number;
    completedCount: number;
};

export function LevelBanner({ level, planCount, completedCount }: LevelBannerProps) {
    const { t } = useTranslation();
    const config = BANNER_CONFIGS[level];
    const Icon = config.icon;
    const progress = planCount > 0 ? Math.round((completedCount / planCount) * 100) : 0;

    // Get translations
    const title = t(`maturity.levels.${level}`);
    const subtitle = t(`components.levelBanner.subtitle.${level}`);
    const nextLevelLabel = config.nextLevel ? t(`maturity.levels.${config.nextLevel}`) : null;

    return (
        <Paper
            radius="lg"
            p="xl"
            style={{
                background: config.gradient,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background decorative element */}
            <Box
                style={{
                    position: 'absolute',
                    right: -20,
                    top: -20,
                    opacity: 0.1,
                }}
            >
                <Icon size={180} stroke={1} />
            </Box>

            <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                <Group gap="lg" align="center">
                    <ThemeIcon
                        size={60}
                        radius="xl"
                        variant="white"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                    >
                        <Icon size={32} color="white" />
                    </ThemeIcon>

                    <Box>
                        <Group gap="sm" align="center">
                            <Text size="xl" fw={800} tt="uppercase" style={{ letterSpacing: 1 }}>
                                {t('components.levelBanner.level', { defaultValue: 'Level' })} {title}
                            </Text>
                            <Badge
                                variant="white"
                                color="dark"
                                size="lg"
                                style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                            >
                                {planCount} Action Plans
                            </Badge>
                        </Group>
                        <Text size="sm" mt={4} style={{ opacity: 0.9 }}>
                            {subtitle}
                        </Text>
                    </Box>
                </Group>

                <Box ta="right">
                    <Text size="xs" style={{ opacity: 0.8 }} tt="uppercase">
                        {t('components.levelBanner.progress', { defaultValue: 'Progress' })}
                    </Text>
                    <Text size="xl" fw={800}>
                        {completedCount} / {planCount}
                    </Text>
                    <Text size="sm" style={{ opacity: 0.9 }}>
                        {t('components.levelBanner.complete', { percent: progress, defaultValue: '{{percent}}% Complete' })}
                    </Text>

                    {config.nextLevel && (
                        <Group gap={4} mt="xs" justify="flex-end">
                            <Text size="xs" style={{ opacity: 0.7 }}>
                                {t('components.levelBanner.next', { level: nextLevelLabel, defaultValue: 'Next: {{level}}' })}
                            </Text>
                            <IconArrowRight size={12} style={{ opacity: 0.7 }} />
                        </Group>
                    )}
                </Box>
            </Group>
        </Paper>
    );
}
