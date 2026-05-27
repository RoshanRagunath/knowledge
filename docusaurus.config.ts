import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Roshan Ragunath',
  tagline: 'Cheatsheets and notes from building with Claude Code, n8n and Betty Blocks',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://knowledge.roshanragunath.com',
  baseUrl: '/',

  organizationName: 'RoshanRagunath',
  projectName: 'knowledge',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/RoshanRagunath/knowledge/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/RoshanRagunath/knowledge/tree/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Knowledge',
      logo: {
        alt: 'Roshan Ragunath',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://roshanragunath.com',
          label: 'About',
          position: 'right',
        },
        {
          href: 'https://github.com/RoshanRagunath/knowledge',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/docs/intro',
            },
            {
              label: 'Claude Code cheatsheet',
              to: '/docs/claude-code/cheatsheet',
            },
          ],
        },
        {
          title: 'Elsewhere',
          items: [
            {
              label: 'roshanragunath.com',
              href: 'https://roshanragunath.com',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/RoshanRagunath',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Roshan Ragunath.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
