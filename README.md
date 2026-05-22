# knowledge

Source for [knowledge.roshanragunath.com](https://knowledge.roshanragunath.com) — a public knowledge base of cheatsheets and tutorials from Roshan Ragunath.

## Stack

- [Docusaurus](https://docusaurus.io/) (TypeScript, classic preset)
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/)
- Auto-deploys on push to `main`

## Develop

```bash
npm install
npm run start    # http://localhost:3000
```

## Build

```bash
npm run build    # outputs to /build
npm run serve    # preview the production build locally
```

## Structure

```
docs/              durable reference content (cheatsheets, guides)
  claude-code/
  n8n/             (placeholder for future)
  betty-blocks/    (placeholder for future)
blog/              timestamped articles
src/, static/      theme + assets
```

## Contributing

Spot something wrong or have something to add? Open an issue or a PR.
