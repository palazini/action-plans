import { Group, UnstyledButton, Text, Image, rem } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

// Mapeamento para saber qual língua e bandeira usar para cada país selecionado
// A chave deve bater exatamente com o nome salvo no banco de dados/contexto
const COUNTRY_CONFIG: Record<string, { lang: string; flag: string; label: string }> = {
  'Brazil': { lang: 'pt', flag: 'br', label: 'PT' },
  'Brazil (Hiter)': { lang: 'pt', flag: 'br', label: 'PT' },
  'USA': { lang: 'en', flag: 'us', label: 'EN' },
  'UK': { lang: 'en', flag: 'gb', label: 'EN' },
  'France': { lang: 'fr', flag: 'fr', label: 'FR' },
  'Italy': { lang: 'it', flag: 'it', label: 'IT' },
  'China': { lang: 'zh', flag: 'cn', label: 'ZH' },
  'India': { lang: 'hi', flag: 'in', label: 'HI' },
  'Argentina': { lang: 'es', flag: 'ar', label: 'ES' },
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { selectedCountry } = useAuth();

  // Pega a configuração do país atual (fallback para Brasil se der erro ou estiver nulo)
  const currentConfig = selectedCountry ? COUNTRY_CONFIG[selectedCountry] : COUNTRY_CONFIG['Brazil'];
  
  // Se por algum motivo não achar a config, não renderiza nada para evitar erro
  if (!currentConfig) return null;

  // Verifica se o idioma local já é inglês (ex: USA/UK) para não duplicar botões (EN - EN)
  const isLocalEnglish = currentConfig.lang === 'en';

  // Função para checar se o idioma está ativo (para destacar o botão)
  // CORREÇÃO: Usar !! para garantir que o retorno seja sempre booleano ou o operador ?
  const isActive = (lang: string) => !!(i18n.language && i18n.language.startsWith(lang));

  // Estilo dinâmico dos botões (semelhante ao SegmentedControl mas mais customizável)
  const getButtonStyle = (active: boolean) => ({
    backgroundColor: active ? 'white' : 'transparent',
    borderRadius: rem(4),
    padding: `${rem(3)} ${rem(6)}`,
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: rem(5),
    cursor: 'pointer',
    border: 'none',
  });

  return (
    <Group 
      gap={4} 
      bg="gray.1" 
      p={3} 
      style={{ borderRadius: rem(6), border: `1px solid ${rem('#e9ecef')}` }}
    >
      {/* Botão do Idioma Local (Ex: IT se for Itália, FR se for França) */}
      <UnstyledButton 
        onClick={() => i18n.changeLanguage(currentConfig.lang)}
        style={getButtonStyle(isActive(currentConfig.lang))}
        aria-label={`Mudar para ${currentConfig.label}`}
      >
        <Image 
            src={`https://flagcdn.com/w40/${currentConfig.flag}.png`} 
            w={16} 
            radius={2}
            alt={currentConfig.label}
        />
        <Text size="xs" fw={700} c={isActive(currentConfig.lang) ? 'dark.9' : 'dimmed'}>
            {currentConfig.label}
        </Text>
      </UnstyledButton>

      {/* Botão de Inglês (Global) - Só mostra se o idioma local NÃO for inglês */}
      {!isLocalEnglish && (
          <UnstyledButton 
            onClick={() => i18n.changeLanguage('en')}
            style={getButtonStyle(isActive('en'))}
            aria-label="Mudar para Inglês"
          >
            <Image 
                src="https://flagcdn.com/w40/gb.png" 
                w={16} 
                radius={2}
                alt="EN"
            />
            <Text size="xs" fw={700} c={isActive('en') ? 'dark.9' : 'dimmed'}>
                EN
            </Text>
          </UnstyledButton>
      )}
    </Group>
  );
}