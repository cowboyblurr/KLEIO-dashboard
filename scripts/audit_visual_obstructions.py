from __future__ import annotations

import json
import re
from pathlib import Path

ROOTS = [Path("app"), Path("components")]
EXTENSIONS = {".tsx", ".ts", ".jsx", ".js", ".css"}
PATTERNS = {
    "sticky": re.compile(r"\bsticky\b|position\s*:\s*sticky"),
    "fixed": re.compile(r"\bfixed\b|position\s*:\s*fixed"),
    "viewport_height": re.compile(r"\b(?:min-h-screen|h-screen|max-h-screen)\b|(?:100d?vh|100svh)"),
    "large_max_height": re.compile(r"\bmax-h-\[(?:[5-9]\d|100)(?:vh|dvh|svh)\]\b|\bmax-h-(?:\[calc\(|screen)"),
    "nested_scroll": re.compile(r"\boverflow-(?:y-)?auto\b|\boverflow-scroll\b"),
    "clipped_overflow": re.compile(r"\boverflow-hidden\b"),
    "viewport_edge": re.compile(r"\b(?:top|bottom|inset|left|right)-(?:0|\[|px|screen|full)"),
    "high_z_index": re.compile(r"\bz-(?:\[[1-9]\d{2,}\]|[5-9]\d)\b"),
    "large_min_height": re.compile(r"\bmin-h-(?:\[(?:[4-9]\d{2}|\d{4,})px\]|96|\[calc\()"),
}

records: list[dict[str, object]] = []
for root in ROOTS:
    if not root.exists():
        continue
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix not in EXTENSIONS:
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            continue
        for number, line in enumerate(lines, 1):
            kinds = [name for name, pattern in PATTERNS.items() if pattern.search(line)]
            if not kinds:
                continue
            records.append({
                "path": str(path),
                "line": number,
                "kinds": kinds,
                "snippet": line.strip()[:500],
            })

by_file: dict[str, dict[str, object]] = {}
for record in records:
    path = str(record["path"])
    entry = by_file.setdefault(path, {"path": path, "counts": {}, "records": []})
    for kind in record["kinds"]:  # type: ignore[index]
        counts = entry["counts"]  # type: ignore[assignment]
        counts[kind] = counts.get(kind, 0) + 1  # type: ignore[index]
    entry["records"].append(record)  # type: ignore[index]

priority = []
for entry in by_file.values():
    counts = entry["counts"]  # type: ignore[assignment]
    score = (
        counts.get("fixed", 0) * 7
        + counts.get("sticky", 0) * 6
        + counts.get("viewport_height", 0) * 5
        + counts.get("large_max_height", 0) * 4
        + counts.get("nested_scroll", 0) * 3
        + counts.get("viewport_edge", 0) * 2
        + counts.get("high_z_index", 0) * 2
        + counts.get("large_min_height", 0)
    )
    entry["score"] = score
    if score:
        priority.append(entry)
priority.sort(key=lambda item: (-int(item["score"]), str(item["path"])))

output = {
    "summary": {
        "files_scanned": sum(1 for root in ROOTS if root.exists() for path in root.rglob("*") if path.is_file() and path.suffix in EXTENSIONS),
        "files_flagged": len(priority),
        "records": len(records),
        "pattern_totals": {name: sum(1 for record in records if name in record["kinds"]) for name in PATTERNS},
    },
    "priority_files": priority,
}

report_path = Path("docs/visual-obstruction-audit.json")
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")

markdown = [
    "# KLEIO Visual Obstruction Audit",
    "",
    "Generated from the current branch. This is an inventory, not an automatic verdict: every flagged surface requires product review.",
    "",
    f"- Files scanned: {output['summary']['files_scanned']}",
    f"- Files flagged: {output['summary']['files_flagged']}",
    f"- Flagged lines: {output['summary']['records']}",
    "",
    "## Highest-priority files",
    "",
]
for entry in priority[:80]:
    counts = ", ".join(f"{key}: {value}" for key, value in sorted(entry["counts"].items()))
    markdown.append(f"### `{entry['path']}` — score {entry['score']}")
    markdown.append("")
    markdown.append(counts or "No classified patterns")
    markdown.append("")
    for record in entry["records"][:12]:
        kinds = ", ".join(record["kinds"])
        markdown.append(f"- L{record['line']} · {kinds}: `{record['snippet']}`")
    if len(entry["records"]) > 12:
        markdown.append(f"- … {len(entry['records']) - 12} additional flagged lines")
    markdown.append("")

Path("docs/visual-obstruction-audit.md").write_text("\n".join(markdown), encoding="utf-8")
print(json.dumps(output["summary"], indent=2))
