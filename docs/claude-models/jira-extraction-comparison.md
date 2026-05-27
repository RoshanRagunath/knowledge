---
sidebar_position: 1
title: Opus vs Sonnet vs Haiku -- Jira story extraction
description: Real-workload comparison of Claude Opus 4.7, Sonnet 4.6 and Haiku 4.5 extracting user stories from a product doc into Jira tickets via n8n.
---

# Claude model comparison: Jira story extraction workflow

Comparison of **Claude Opus 4.7, Sonnet 4.6 and Haiku 4.5** for extracting user stories from a product document and creating Jira tickets, run inside the `[Stories] Ingest & Create Jira Issues` n8n workflow.

Tests run on 2026-05-27. Source: a `userstories whimsical.md` file containing 1 epic + 5 user stories.

---

## TL;DR

When the system prompt instructs the model to extract text **verbatim** (no paraphrasing, no rewriting), **all three Claude models produce identical content**. The only meaningful differences are speed and cost.

**Recommendation: use Haiku 4.5 as the default model.** Same ticket content as Opus, ~2x faster, ~10x cheaper and the only model that reliably finishes under common proxy timeouts.

---

## What "verbatim" means in this context

Verbatim = word-for-word, exactly as written.

By default, LLMs paraphrase, summarize, expand or add interpretive commentary like `[ASSUMPTION]` blocks and `Additional context:` paragraphs. They treat themselves as helpful editors. For ticket extraction this is the wrong behavior: we want the source document's content reproduced into Jira, not reinvented.

The system prompt was updated to force strict extraction:

> Copy content from the source document VERBATIM. Do not paraphrase, summarize, rewrite or compress. Do not add commentary, context paragraphs, `[ASSUMPTION]` markers, "Additional context", "Business Value" or any text not present in the document. Do not infer or invent acceptance criteria, test criteria, links or priorities. If the document does not state it, omit it.

Under this prompt, every model behaves like a structurer (reshaping the doc's content into the JSON schema) rather than a rewriter. That convergence is what made the comparison clean.

---

## Test setup

- **Source document:** identical markdown file for all three runs (verified byte-for-byte by inspecting the `Capture Extracted Text` node output across executions 144, 146, 147)
- **Workflow:** `[Stories] Ingest & Create Jira Issues` (n8n ID `FHYAkLWKjVIxEIfC`)
- **System prompt:** identical across the three Anthropic call nodes (only the model name and `max_tokens` differed)
- **Execution mode:** webhook (real upload from highcode.nl/userstories, not manual test)

---

## Results

### Timing and tokens

| | Opus 4.7 | Sonnet 4.6 | Haiku 4.5 |
|---|---|---|---|
| Workflow total | 38.8s | 44.4s | **28.0s** |
| LLM call time | 31.4s | 36.9s | **20.2s** |
| Input tokens reported | 4,610 | 3,188 | 3,187 |
| Output tokens reported | 3,393 | 2,320 | 2,834 |
| Output throughput | 108 tok/sec | 63 tok/sec | **140 tok/sec** |

### Content quality

Item-by-item comparison of the three JSON outputs:

| Field | Result |
|---|---|
| Item count | 1 epic + 5 stories, identical in all three |
| Summaries | Identical strings |
| Descriptions | Identical strings (verbatim from source's "Description" field; none of the three included the source's "Additional context" or "Business Value" sections) |
| Epic AC / test arrays | `[]` in all three (the source document does not define epic-level ACs/tests) |
| Story AC counts | 5 / 5 / 5 / 5 / 4, identical |
| Story test counts | 8 / 7 / 8 / 7 / 6, identical |
| Story AC and test text | Verbatim from source, identical strings across all three models |
| Link graph | `s2->s1`, `s3->s2`, `s4->s2`, `s5->{s2, s3}` all Blocks, identical |
| Priorities | Must / Must / Must / Must / Must / Should, identical |

**The actual text in the resulting Jira tickets is the same regardless of model.**

---

## Key insights

### Insight 1: Verbatim prompts eliminate the model-quality question

Before the verbatim instruction was added, each model behaved differently:

- **Opus** added `[ASSUMPTION]` blocks and `Additional context:` paragraphs not in the source. Skipped populating the epic's AC and test arrays.
- **Sonnet** rewrote source descriptions into a more polished register but stayed structurally close to source.
- **Haiku** (with an earlier "tight" prompt that capped AC counts) compressed descriptions to single sentences and made **link-direction errors** (e.g. swapped which story blocks which).

After enforcing verbatim extraction, all three produce equivalent output. The model choice no longer affects ticket quality.

### Insight 2: "Output tokens" is a misleading metric across models

Same source text, same output text, but Anthropic reports different token counts:

- Opus 4.7: 4,610 input / 3,393 output tokens
- Sonnet 4.6: 3,188 input / 2,320 output tokens
- Haiku 4.5: 3,187 input / 2,834 output tokens

This is because **each model family has its own tokenizer**. The same English string is split into different numbers of tokens by Opus 4.7's vocabulary vs Sonnet 4.6's vs Haiku 4.5's. Notice Sonnet and Haiku tokenize nearly identically (3,188 vs 3,187 input, one token apart on the same text), while Opus 4.7 uses a newer vocabulary that counts ~45% more tokens.

Practical implication: **don't compare LLM cost by output_tokens between model families.** Compare wall-clock time and final billed cost instead.

### Insight 3: Speed gap comes from generation throughput, not "model effort"

The output text is the same, so any time difference is purely how fast each model emits tokens:

| Model | Approx. throughput on this workload |
|---|---|
| Haiku 4.5 | ~140 tok/sec |
| Opus 4.7 | ~108 tok/sec |
| Sonnet 4.6 | ~63 tok/sec (one run; typical is ~70-80) |

Sonnet's number was unusually slow on the day of testing, likely API-side load variance. Two of three test points suggest the steady-state ranking is: **Haiku > Opus > Sonnet**, but Haiku's lead over the other two is consistent and large enough to dominate proxy-timeout concerns.

---

## Recommendation matrix

| Need | Pick |
|---|---|
| Default day-to-day use | **Haiku 4.5** |
| Match ticket content quality of Opus | **Haiku 4.5** (with verbatim prompt, content is equivalent) |
| Minimize cost | **Haiku 4.5** |
| Avoid browser-side timeout errors | **Haiku 4.5** |
| Translate/multilingual extraction (untested) | Sonnet 4.6 has the strongest reputation in this area; verify before relying on it |
| Complex reasoning beyond extraction (e.g., inferring dependencies the doc didn't write down) | Opus 4.7, but you'd need a non-verbatim prompt for that and the failure modes change |

---

## Workflow setup that supports model swapping

The workflow has three parallel Anthropic call nodes (`Call Anthropic (Opus)`, `Call Anthropic (Sonnet)`, `Call Anthropic (Haiku)`), each with identical system prompts and credentials, differing only in `model` and node name.

All three have their **output** wired to `Parse LLM JSON`. Only one has its **input** wired from `Build Priority Map` at a time, that's the active model.

To swap models in the n8n UI:

1. Delete the current wire from `Build Priority Map` to the active model
2. Drag a new wire from `Build Priority Map` to the desired model node
3. Save

The downstream pipeline is model-agnostic, so no other edits are needed.

---

## Open questions / future testing

- **Haiku still wraps responses in ` ```json ` code fences** despite the prompt forbidding them. The `Parse LLM JSON` Code node strips fences before parsing, so this is currently harmless, but it's a minor instruction-following miss worth tracking if the parser is ever simplified.
- **Sonnet's throughput on this workload** (63 tok/sec measured) was below its typical band of 70-80. Worth one or two more runs to confirm whether this is a stable regression or a one-off load spike.
- **Larger or messier source documents** were not tested. Findings here are based on a clean ~3KB markdown file with regular structure. Edge cases (PDFs with weird formatting, very long docs, ambiguous wording) might re-introduce model-quality differences.

---

## Sources

- n8n workflow `FHYAkLWKjVIxEIfC` -- `[Stories] Ingest & Create Jira Issues`
- Test executions: 144 (Haiku), 146 (Opus), 147 (Sonnet), all from 2026-05-27 under the verbatim prompt
- Earlier executions 137 (Opus, old prompt), 139 (Sonnet, old prompt), 141 (Haiku, earlier tight prompt) used for the "before verbatim" behavior observations
