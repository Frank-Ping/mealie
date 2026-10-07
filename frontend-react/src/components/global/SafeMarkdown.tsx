import { useMemo } from "react";
import SafeHtml from "@/components/SafeHtml";
import { marked } from "marked";
import { sanitizeMarkdownHtml } from "@/lib/sanitize/markdown";

interface Props {
  source?: string;
}

export default function SafeMarkdown({ source = "" }: Props) {
  const props = /* props via generated interface + destructured signature */

  const { $appInfo } = useNuxtApp();

  const value = useMemo(() =>  {
    const rawHtml = marked.parse(source || "", { async: false, breaks: true }, []); // WF4-REVIEW: dependency array
    return sanitizeMarkdownHtml(rawHtml, $appInfo?.allowedIframeHosts ?? []);
  });

  return (
    <>
  <SafeHtml html={value} />
    </>
  );
}
