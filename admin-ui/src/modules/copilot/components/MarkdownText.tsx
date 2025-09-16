import React from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import Image from 'next/image';

interface MarkdownTextProps {
  text: string;
  className?: string;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ text, className }) => (
  <div
    className={`prose dark:prose-invert max-w-none [&>*:last-child]:mb-0 ${className || 'mb-4'}`}
  >
    <Markdown
      components={{
        img: ({ node, ...props }) => (
          <Image
            alt=""
            src={props.src as any}
            {...props}
            width={200}
            height={50}
          />
        ),
      }}
      rehypePlugins={[rehypeRaw, remarkGfm, rehypeSanitize] as any}
    >
      {text}
    </Markdown>
  </div>
);

export default MarkdownText;
