import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleSearchVersionedDocs } from "../src/tools/searchVersionedDocs.js";

process.env.VERSION_COMPAT_OFFLINE = "1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_PATH = path.join(__dirname, "golden-dataset.jsonl");

interface GoldenCase {
  id: string;
  category: "exact_symbol" | "natural_language" | "version_boundary";
  library: string;
  version: string;
  query: string;
  expected_section_keywords: string[];
  expected_content_keywords: string[];
  forbidden_major: number;
}

interface ReturnedChunk {
  chunk_uid: string;
  library: string;
  version: string;
  section: string;
  content: string;
  source_url: string;
}

function isChunkRelevant(chunk: ReturnedChunk, testCase: GoldenCase): boolean {
  const secLower = chunk.section.toLowerCase();
  const contentLower = chunk.content.toLowerCase();

  const secMatches = testCase.expected_section_keywords.every((kw) =>
    secLower.includes(kw.toLowerCase())
  );
  const contentMatches = testCase.expected_content_keywords.every((kw) =>
    contentLower.includes(kw.toLowerCase())
  );
  return secMatches && contentMatches;
}

async function runEvaluation(): Promise<void> {
  const lines = fs
    .readFileSync(DATASET_PATH, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const cases = lines.map((l) => JSON.parse(l) as GoldenCase);

  let hitsAt1 = 0;
  let hitsAt3 = 0;
  let hitsAt5 = 0;
  let reciprocalRankSum = 0;
  let versionLeakageCount = 0;

  for (const tc of cases) {
    const res = await handleSearchVersionedDocs({
      library: tc.library,
      version: tc.version,
      query: tc.query,
      top_k: 5,
    });

    const results = (res.results as ReturnedChunk[] | undefined) ?? [];

    // Check version leakage
    for (const r of results) {
      const major = parseInt(r.version.split(".")[0], 10);
      if (major === tc.forbidden_major) {
        versionLeakageCount++;
      }
    }

    // Find first relevant rank (1-indexed)
    let firstRank = 0;
    for (let i = 0; i < results.length; i++) {
      if (isChunkRelevant(results[i], tc)) {
        firstRank = i + 1;
        break;
      }
    }

    if (firstRank === 1) hitsAt1++;
    if (firstRank >= 1 && firstRank <= 3) hitsAt3++;
    if (firstRank >= 1 && firstRank <= 5) hitsAt5++;
    if (firstRank >= 1) {
      reciprocalRankSum += 1 / firstRank;
    } else {
      console.error(`[eval:MISS] Case ${tc.id} failed to retrieve expected chunk.`);
    }
  }

  // Also test guardrail cases (ambiguous version & unsupported library)
  const guardrailUnsupported = await handleSearchVersionedDocs({
    library: "vue",
    version: "3.4.0",
    query: "setup",
  });
  const guardrailAmbiguous = await handleSearchVersionedDocs({
    library: "nextjs",
    version: "latest",
    query: "cookies",
  });
  const guardrailMissingVer = await handleSearchVersionedDocs({
    library: "tailwindcss",
    query: "@theme",
  });

  const guardrailsPassed =
    guardrailUnsupported.status === "unsupported_library" &&
    guardrailAmbiguous.status === "ambiguous_version" &&
    guardrailMissingVer.status === "ambiguous_version";

  const total = cases.length;
  const recallAt1 = hitsAt1 / total;
  const recallAt3 = hitsAt3 / total;
  const recallAt5 = hitsAt5 / total;
  const mrrAt10 = reciprocalRankSum / total;
  const leakageRate = versionLeakageCount / total;

  const summary = {
    total_queries: total,
    metrics: {
      "Recall@1": Number(recallAt1.toFixed(4)),
      "Recall@3": Number(recallAt3.toFixed(4)),
      "Recall@5": Number(recallAt5.toFixed(4)),
      "MRR@10": Number(mrrAt10.toFixed(4)),
      version_leakage_rate: Number(leakageRate.toFixed(4)),
      guardrails_passed: guardrailsPassed,
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  if (recallAt5 < 0.9 || mrrAt10 < 0.78 || leakageRate > 0 || !guardrailsPassed) {
    console.error("[eval] Quality thresholds not met!");
    process.exit(1);
  }
}

runEvaluation();
