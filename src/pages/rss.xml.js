import rss, { pagesGlobToRssItems } from '@astrojs/rss';

export async function get() {
    return rss({
        title: 'Sagar Velagala | Blog',
        description:
            'A blog about analytics, engineering, and interesting tidbits.',
        site: 'https://sagarv.xyz/blog',
        items: await pagesGlobToRssItems(import.meta.glob('./**/*.md')),
        customData: `<language>en-us</language>`,
    });
}
