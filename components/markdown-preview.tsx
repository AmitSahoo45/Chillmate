import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

export function MarkdownPreview({ markdown }: { markdown: string }) {
  if (!markdown.trim()) {
    return (
      <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
    );
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdown}</ReactMarkdown>
    </div>
  );
}
