import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-lg max-w-none
        prose-headings:text-on-surface prose-headings:font-bold
        prose-h1:text-3xl prose-h1:mt-10 prose-h1:mb-4
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
        prose-p:text-on-surface prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80
        prose-strong:text-on-surface prose-strong:font-bold
        prose-em:italic
        prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
        prose-li:text-on-surface prose-li:mb-1
        prose-blockquote:border-l-4 prose-blockquote:border-tertiary prose-blockquote:bg-surface-container-low prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-on-surface
        prose-code:bg-surface-container-high prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:text-on-surface prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-surface-container-highest prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto
        prose-img:rounded-xl prose-img:shadow-ambient-sm
        prose-hr:border-outline-variant/30 prose-hr:my-8
        prose-table:border-collapse prose-table:w-full
        prose-th:bg-surface-container-high prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:text-on-surface prose-th:font-semibold
        prose-td:border-t prose-td:border-outline-variant/20 prose-td:px-4 prose-td:py-2 prose-td:text-on-surface-variant
        ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
