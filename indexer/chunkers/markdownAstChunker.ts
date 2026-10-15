import crypto from "node:crypto";
import {
  DocChunkMetadata,
  DocType,
  SupportedLibrary,
} from "../../src/types/common.js";
import { semverToNum } from "../../src/utils/versionUtils.js";

export interface RawDocumentSnapshot {
  library: SupportedLibrary;
  version: string;
  major_version: number;
  doc_type: DocType;
  git_tag: string;
  base_source_url: string;
  collected_at: string;
  framework_context?: string | null;
  codemod_command?: string | null;
  markdown: string;
}

export function extractCodeTokensFromMarkdown(text: string): string {
  const tokenSet = new Set<string>();

  // 1. Extract inline code spans `...`
  const inlineMatches = text.matchAll(/`([^`\n]+)`/g);
  for (const m of inlineMatches) {
    const inner = m[1].trim();
    const parts = inner.match(/[a-zA-Z0-9@/_.-]{2,}/g);
    if (parts) {
      for (const p of parts) {
        tokenSet.add(p.toLowerCase());
      }
    }
  }

  // 2. Extract package names, config filenames, CLI flags, and directives from fenced code blocks
  const symbolMatches = text.matchAll(
    /(?:@[a-z0-9-]+\/[a-z0-9._-]+|[a-z0-9_-]+\.config\.(?:js|mjs|cjs|ts|mts)|\.eslintrc(?:\.[a-z]+)?|@import\s+["']tailwindcss["']|@tailwind\s+\w+|@[a-z0-9_-]+|--[a-z0-9-]+|\b(?:cookies|headers|draftMode|params|searchParams|defineConfig|flatConfig|useActionState|useFormStatus|forwardRef|moduleResolution)\b)/gi
  );
  for (const m of symbolMatches) {
    tokenSet.add(m[0].toLowerCase());
  }

  return Array.from(tokenSet).join(" ");
}

function detectBreakingSection(heading: string, content: string): boolean {
  const combined = `${heading}\n${content}`.toLowerCase();
  return (
    combined.includes("breaking") ||
    combined.includes("removed") ||
    combined.includes("deprecated") ||
    combined.includes("no longer supported") ||
    combined.includes("replaced by")
  );
}

/**
 * Splits a Markdown document along heading boundaries (H1/H2/H3) while keeping
 * fenced code blocks intact and recording exact 1-indexed line ranges (#Lstart-Lend).
 */
export function chunkMarkdownDocument(
  doc: RawDocumentSnapshot
): DocChunkMetadata[] {
  const lines = doc.markdown.split(/\r?\n/);
  const semverNum = semverToNum(doc.version) ?? doc.major_version * 1_000_000;

  let h1 = "";
  let h2 = "";
  let h3 = "";
  let inCodeFence = false;

  interface RawSection {
    breadcrumb: string;
    startLine: number;
    endLine: number;
    lines: string[];
  }

  const sections: RawSection[] = [];
  let current: RawSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      inCodeFence = !inCodeFence;
    }

    if (!inCodeFence) {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();

        if (current && current.lines.join("\n").trim().length > 0) {
          current.endLine = lineNum - 1;
          sections.push(current);
        }

        if (level === 1) {
          h1 = title;
          h2 = "";
          h3 = "";
        } else if (level === 2) {
          h2 = title;
          h3 = "";
        } else if (level === 3) {
          h3 = title;
        }

        const breadcrumb = [h1, h2, h3].filter(Boolean).join(" > ");
        current = {
          breadcrumb: breadcrumb || title,
          startLine: lineNum,
          endLine: lineNum,
          lines: [line],
        };
        continue;
      }
    }

    if (!current) {
      current = {
        breadcrumb: `${doc.library} ${doc.version}`,
        startLine: lineNum,
        endLine: lineNum,
        lines: [line],
      };
    } else {
      current.lines.push(line);
      current.endLine = lineNum;
    }
  }

  if (current && current.lines.join("\n").trim().length > 0) {
    sections.push(current);
  }

  // Filter out pure H1 title stubs that have no body paragraphs
  const meaningfulSections = sections.filter((s) => {
    const nonHeadingLines = s.lines.filter(
      (l) => !/^#{1,3}\s+/.test(l.trim()) && l.trim().length > 0
    );
    return nonHeadingLines.length > 0;
  });

  const chunks: DocChunkMetadata[] = [];

  for (let idx = 0; idx < meaningfulSections.length; idx++) {
    const sec = meaningfulSections[idx];
    const content = sec.lines.join("\n").trim();
    const contentSha256 = crypto
      .createHash("sha256")
      .update(content)
      .digest("hex");
    const shortHash = contentSha256.slice(0, 10);
    const chunkUid = `${doc.library}:${doc.version}:${doc.doc_type}:${idx + 1}:${shortHash}`;

    const hasAnchor = doc.base_source_url.includes("#");
    const sourceUrl = hasAnchor
      ? doc.base_source_url
      : `${doc.base_source_url}#L${sec.startLine}-L${sec.endLine}`;

    const codeTokens = extractCodeTokensFromMarkdown(
      `${sec.breadcrumb}\n${content}`
    );
    const isBreaking =
      doc.doc_type === "deprecation" ||
      detectBreakingSection(sec.breadcrumb, content);

    chunks.push({
      chunk_uid: chunkUid,
      collection_id: "js-ts",
      library: doc.library,
      version: doc.version,
      major_version: doc.major_version,
      semver_num: semverNum,
      doc_type: doc.doc_type,
      is_breaking: isBreaking,
      framework_context: doc.framework_context ?? null,
      section: sec.breadcrumb,
      source_url: sourceUrl,
      git_tag: doc.git_tag,
      content,
      code_tokens: codeTokens,
      content_sha256: contentSha256,
      collected_at: doc.collected_at,
    });
  }

  return chunks;
}
