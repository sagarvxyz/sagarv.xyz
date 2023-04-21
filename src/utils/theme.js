// Sets theme to dark mode if system settings or session storage says so
document.onload(() => {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const prefersLightScheme = window.matchMedia(
        '(prefers-color-scheme: light)'
    );
    const sessionTheme = sessionStorage.getItem('theme');
    if (prefersDarkScheme.matches || sessionTheme == 'dark') {
        document.documentElement.classList.add('dark');
    } else if (prefersLightScheme.matches || sessionTheme == 'light') {
        document.documentElement.classList.remove('dark');
    }
    prefersDarkScheme.addEventListener('change', (e) => {
        if (e.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
});
