
import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';
import { Theme } from '../types';

function useDarkMode(): [Theme, React.Dispatch<React.SetStateAction<Theme>>] {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');

  // Effect to apply the selected theme (light, dark, or system)
  useEffect(() => {
    const root = window.document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else { // theme === 'system'
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]); // Re-run this effect whenever the user-selected 'theme' changes

  // Effect to listen for OS theme changes and apply them IF theme is 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = window.document.documentElement;

    const handleChange = (event: MediaQueryListEvent) => {
      if (theme === 'system') { // Only react if app is set to follow system
        if (event.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    // Clean up the listener when the component unmounts or 'theme' changes
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]); // Re-register listener if 'theme' changes 

  return [theme, setTheme];
}

export default useDarkMode;
