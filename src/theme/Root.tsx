import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// Root wraps the entire app and renders on every page. We mount the chat widget
// here so it's available site-wide. BrowserOnly keeps it out of SSR (it's
// interactive-only and not needed for SEO/first paint).
export default function Root({children}: {children: React.ReactNode}): React.JSX.Element {
  return (
    <>
      {children}
      <BrowserOnly>
        {() => {
          const ChatWidget = require('@site/src/components/ChatWidget').default;
          return <ChatWidget />;
        }}
      </BrowserOnly>
    </>
  );
}
