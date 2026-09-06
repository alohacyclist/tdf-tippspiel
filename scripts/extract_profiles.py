"""Trace the elevation line out of the PCS stage-profile images.

The profile images are labelled diagrams — unusable as a watermark — but the area
under the curve is filled with one flat green. For every pixel column we take the
topmost filled pixel, which is exactly the elevation line, and emit it as a compact
polyline. The app then draws a real profile as clean SVG instead of showing the jpg.

Usage:  python3 scripts/extract_profiles.py
Writes: src/data/stageProfiles.json  {"<race-slug>/<stage>": [0..100, ...]}
"""

import json
import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "stage-profiles"
OUT = ROOT / "src" / "data" / "stageProfiles.json"

FILL = (138, 196, 49)  # PCS profile fill
TOLERANCE = 60
POINTS = 96  # resampled resolution per stage


def is_fill(p: tuple[int, int, int]) -> bool:
    return (
        abs(p[0] - FILL[0]) < TOLERANCE
        and abs(p[1] - FILL[1]) < TOLERANCE
        and abs(p[2] - FILL[2]) < TOLERANCE
    )


def trace(path: pathlib.Path) -> list[int] | None:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()

    tops: dict[int, int] = {}
    for x in range(w):
        for y in range(h):
            if is_fill(px[x, y]):
                tops[x] = y
                break
    if len(tops) < w * 0.3:
        return None  # not a profile image we understand

    # Use the longest run of consecutive filled columns: that is the plot area,
    # so a green legend box elsewhere in the image cannot skew the x-range.
    cols = sorted(tops)
    best = run = [cols[0]]
    for prev, cur in zip(cols, cols[1:]):
        if cur - prev <= 3:
            run.append(cur)
        else:
            if len(run) > len(best):
                best = run
            run = [cur]
    if len(run) > len(best):
        best = run
    x0, x1 = best[0], best[-1]
    if x1 - x0 < w * 0.3:
        return None

    inside = [tops[x] for x in tops if x0 <= x <= x1]
    lo, hi = min(inside), max(inside)  # y grows downwards
    if hi == lo:
        return None

    out: list[int] = []
    last = 0
    for i in range(POINTS):
        x = round(x0 + (x1 - x0) * i / (POINTS - 1))
        y = tops.get(x)
        if y is None:  # small gap (gridline, label) -> hold the previous value
            out.append(last)
            continue
        # 0 = lowest point of the stage, 100 = highest
        v = round((hi - y) / (hi - lo) * 100)
        out.append(v)
        last = v
    return out


def main() -> None:
    data: dict[str, list[int]] = {}
    for race_dir in sorted(p for p in SRC.iterdir() if p.is_dir()):
        for img in sorted(race_dir.glob("stage-*.jpg")):
            number = img.stem.split("-")[1]
            line = trace(img)
            if line is None:
                print(f"skip  {race_dir.name}/{img.name} (no fill found)")
                continue
            data[f"{race_dir.name}/{number}"] = line
            print(f"ok    {race_dir.name}/{number}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, separators=(",", ":")))
    print(f"\n{len(data)} profiles -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
