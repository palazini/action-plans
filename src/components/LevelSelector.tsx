// src/components/LevelSelector.tsx
import { Group, UnstyledButton, Text, Box, Tooltip } from '@mantine/core';
import {
    IconBuildingBank,
    IconTrophy,
    IconMedal,
    IconCrown,
    IconDiamond,
} from '@tabler/icons-react';
import type { MaturityLevel } from '../types';

type LevelConfig = {
    level: MaturityLevel;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
    description: string;
};

const LEVEL_CONFIGS: LevelConfig[] = [
    {
        level: 'FOUNDATION',
        label: 'Foundation',
        color: '#495057',
        bgColor: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderColor: '#adb5bd',
        icon: IconBuildingBank,
        description: 'Building the base structure',
    },
    {
        level: 'BRONZE',
        label: 'Bronze',
        color: '#974706',
        bgColor: 'linear-gradient(135deg, #fff4e6 0%, #ffe8cc 100%)',
        borderColor: '#fd7e14',
        icon: IconMedal,
        description: 'Establishing core practices',
    },
    {
        level: 'SILVER',
        label: 'Silver',
        color: '#495057',
        bgColor: 'linear-gradient(135deg, #f1f3f5 0%, #dee2e6 100%)',
        borderColor: '#868e96',
        icon: IconTrophy,
        description: 'Advancing operational excellence',
    },
    {
        level: 'GOLD',
        label: 'Gold',
        color: '#946c00',
        bgColor: 'linear-gradient(135deg, #fff9db 0%, #ffec99 100%)',
        borderColor: '#fab005',
        icon: IconCrown,
        description: 'Achieving high performance',
    },
    {
        level: 'PLATINUM',
        label: 'Platinum',
        color: '#5f3dc4',
        bgColor: 'linear-gradient(135deg, #f3f0ff 0%, #e5dbff 100%)',
        borderColor: '#845ef7',
        icon: IconDiamond,
        description: 'World-class operations',
    },
];

type LevelSelectorProps = {
    selectedLevel: MaturityLevel;
    onLevelChange: (level: MaturityLevel) => void;
    planCounts?: Record<MaturityLevel, number>;
};

export function LevelSelector({
    selectedLevel,
    onLevelChange,
    planCounts = {} as Record<MaturityLevel, number>,
}: LevelSelectorProps) {
    return (
        <Group gap="sm" wrap="wrap">
            {LEVEL_CONFIGS.map((config) => {
                const isSelected = selectedLevel === config.level;
                const count = planCounts[config.level] || 0;
                const Icon = config.icon;

                return (
                    <Tooltip
                        key={config.level}
                        label={config.description}
                        position="bottom"
                        withArrow
                    >
                        <UnstyledButton
                            onClick={() => onLevelChange(config.level)}
                            style={{
                                background: isSelected ? config.bgColor : '#fff',
                                border: `2px solid ${isSelected ? config.borderColor : '#dee2e6'}`,
                                borderRadius: 12,
                                padding: '12px 20px',
                                minWidth: 120,
                                transition: 'all 0.2s ease',
                                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                boxShadow: isSelected
                                    ? `0 4px 12px ${config.borderColor}40`
                                    : '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                        >
                            <Group gap="xs" wrap="nowrap" justify="center">
                                <Icon
                                    size={20}
                                    style={{
                                        color: isSelected ? config.color : '#adb5bd',
                                    }}
                                />
                                <Box>
                                    <Text
                                        size="sm"
                                        fw={isSelected ? 700 : 500}
                                        c={isSelected ? config.color : 'dimmed'}
                                    >
                                        {config.label}
                                    </Text>
                                    {count > 0 && (
                                        <Text size="xs" c="dimmed">
                                            {count} {count === 1 ? 'plan' : 'plans'}
                                        </Text>
                                    )}
                                </Box>
                            </Group>
                        </UnstyledButton>
                    </Tooltip>
                );
            })}
        </Group>
    );
}

// Export config for use in other components
export { LEVEL_CONFIGS };
export type { LevelConfig };
