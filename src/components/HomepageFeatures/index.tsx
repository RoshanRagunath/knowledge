import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type TopicCard = {
  title: string;
  description: string;
  href: string;
  tag: string;
  accent: 'blue' | 'green' | 'orange';
};

const topics: TopicCard[] = [
  {
    title: 'Claude Code',
    description: 'Cheatsheets, slash commands and patterns for Anthropic’s coding agent.',
    href: '/docs/claude-code/cheatsheet',
    tag: 'AI tooling',
    accent: 'orange',
  },
  {
    title: 'Claude Code + Codex',
    description: 'Setting up one project so both Claude Code and Codex can work from the same context.',
    href: '/docs/claude-code/tool-agnostic-setup',
    tag: 'Setup guide',
    accent: 'blue',
  },
  {
    title: 'Embedding Codex',
    description: 'Running Claude Code and Codex side by side in the same repo without stepping on each other.',
    href: '/docs/claude-code/embed-codex-in-workspace',
    tag: 'Workflow',
    accent: 'green',
  },
];

function TopicTile({title, description, href, tag, accent}: TopicCard) {
  return (
    <Link to={href} className={`${styles.card} ${styles[`accent_${accent}`]}`}>
      <span className={styles.cardTag}>{tag}</span>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDesc}>{description}</p>
      <span className={styles.cardArrow}>Read &rarr;</span>
    </Link>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Start here</h2>
          <p className={styles.sectionLede}>
            The guides I reach for most. Updated as I learn.
          </p>
        </header>
        <div className={styles.grid}>
          {topics.map((t) => (
            <TopicTile key={t.title} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
