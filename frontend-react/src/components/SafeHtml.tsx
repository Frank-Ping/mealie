import DOMPurify from "dompurify";

// D14: the only sanctioned dangerouslySetInnerHTML path in the React app —
// mirrors the Vue app's lib/sanitize (DOMPurify) usage for the 17 v-html sites.
export default function SafeHtml({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}
