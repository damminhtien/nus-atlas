## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update . --no-cluster` to keep the graph current (AST-only, no API cost).

## Token-efficient agent workflow

Use the smallest useful context. Prefer targeted queries and compact command output over dumping whole files,
full logs, or the entire graph into the conversation.

### 1. Classify and recall only when useful

- For a codebase question, identify the exact subsystem, symbols, and files needed before reading source.
- If the task depends on an earlier decision, bug, or session, use AgentMemory MCP with a narrow query and a
  bounded result: `memory_recall(query="<3-6 keywords>", format="compact", limit=5, token_budget=800)`.
- Do not recall memory for routine local edits when the repository is the source of truth.
- Save only durable, reusable decisions or lessons with `memory_save` / `memory_lesson_save`; never save secrets,
  raw transcripts, large file contents, or temporary command output.
- Use `memory_consolidate` or `memory_reflect` only at the end of a substantial task or when explicitly requested.
  If AgentMemory is unavailable, fall back to `git log`, `git blame`, and focused repository search.

### 2. Query Graphify before opening source

- When `graphify-out/graph.json` exists, start architecture and relationship questions with a bounded Graphify
  query, for example: `graphify query "what calls router?" --budget 800`.
- Use `graphify path "SymbolA" "SymbolB"` for a relationship, `graphify explain "Symbol"` for one concept,
  and `graphify affected "Symbol" --depth 2` for change impact.
- Read only the returned `file:line` locations. Open `GRAPH_REPORT.md` or raw `graph.json` only for broad review or
  when a focused query is insufficient.
- After code changes, run `graphify update . --no-cluster` for a fast AST refresh. Run `graphify cluster-only .`
  only when community structure or the human-readable report must also change.
- If the CLI is missing, use `uvx --from graphifyy graphify ...`; do not install unrelated packages named
  `graphify` or `graphtify`.

### 3. Use RTK for shell output

- Prefer RTK wrappers: `rtk ls`, `rtk tree`, `rtk find`, `rtk rg`, `rtk read`, `rtk git`, `rtk diff`, `rtk test`,
  and `rtk err`.
- Keep searches narrow: include the directory, file type, and a specific pattern; use `rtk read` with focused
  ranges instead of reading large files end-to-end.
- Use `rtk diff` instead of full `git diff`, `rtk git log -n 5` instead of full history, and `rtk test` or
  `rtk err` when only failures matter.
- Use native `rg` or native commands only when RTK is unavailable or exact unfiltered output is required.

### 4. Edit, validate, and close the loop

1. Recall relevant decisions only if needed.
2. Query Graphify for code relationships and affected symbols.
3. Use RTK for narrow search/read and inspect only the necessary lines.
4. Apply the smallest readable patch; avoid unrelated refactors.
5. Run the narrowest relevant validation through RTK, then the repository gate when the change is cross-cutting.
6. Refresh Graphify with `graphify update . --no-cluster` and inspect the compact diff.
7. Save one concise AgentMemory lesson only if the result is likely to help a future task.

Do not run full-corpus extraction, broad memory reflection, or large-output commands by default. Escalate only when
the focused workflow cannot answer the question or validate the change.
## Token-efficient study workflow

- For large local NUS sources, inspect an allowlisted course folder first; do not scan or commit the whole `/Users/macbook/Desktop/NUS` tree.
- Prefer `rg`/`rg --files` for targeted text lookup and a small `pdftotext`/`pdfimages -list` pass before rendering selected pages.
- Use Graphify for code relationships, RTK when it is installed for compact command output, and AgentMemory only for durable study/workflow context—not as a substitute for source verification.
- Keep raw PDFs, textbooks, Canvas exports, screenshots, and personal documents outside the repo. Commit normalized notes plus `sourceId`, page/slide, and a short derived observation.
- Run `node nus-gate.js`, `node gate.js`, `git diff --check`, and `graphify update . --no-cluster` after content or UI changes.
