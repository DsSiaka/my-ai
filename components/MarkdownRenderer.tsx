import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Conditional imports for math support
let remarkMath: any = null;
let rehypeKatex: any = null;
try {
  remarkMath = require('remark-math');
} catch (e) {
  console.warn('remark-math not available, math rendering will be disabled');
}

try {
  rehypeKatex = require('rehype-katex');
} catch (e) {
  console.warn('rehype-katex not available, math rendering will be disabled');
}

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Only use math plugins if they're available
  const remarkPlugins = remarkMath ? [remarkMath] : [];
  const rehypePlugins = rehypeKatex ? [rehypeKatex] : [];

  return (
    <div className="prose prose-sm md:prose-base prose-slate max-w-none dark:prose-invert break-words overflow-y-auto h-full p-6">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`${className} bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded px-1 py-0.5`} {...props}>
                {children}
              </code>
            );
          },
          // Custom rendering for math elements
          p: ({ node, children, ...props }) => (
            <p className="mb-2 last:mb-0" {...props}>
              {children}
            </p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
