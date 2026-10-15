import { useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('mw_theme', next);
    setTheme(next);
  };
  return (
    <button className="btn ghost" onClick={toggle} aria-label="Toggle dark mode">
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
