import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'id' ? 'en' : 'id';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-sm cursor-pointer"
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{i18n.language === 'id' ? 'Bahasa Indonesia' : 'English'}</span>
    </button>
  );
}
