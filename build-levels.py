#!/usr/bin/env python3
"""Generate solvable Ajudoku levels with unique solutions."""
import json
import random


def valid_placement(r, c, cats, regions, n):
    rid = regions[r][c]
    for r2, c2 in cats:
        if c2 == c:
            return False
        if regions[r2][c2] == rid:
            return False
        if abs(r2 - r) <= 1 and abs(c2 - c) <= 1:
            return False
    return True


def solve_all(regions, n, givens=(), limit=2):
    givens = tuple(tuple(g) for g in givens)
    solutions = []

    def rec(row, cats):
        if len(solutions) >= limit:
            return
        if row == n:
            solutions.append([list(x) for x in cats])
            return
        fixed = next((g[1] for g in givens if g[0] == row), None)
        cols = [fixed] if fixed is not None else range(n)
        if fixed is None:
            cols = range(n)
        for col in cols:
            if col is None:
                continue
            if not valid_placement(row, col, cats, regions, n):
                continue
            rec(row + 1, cats + [(row, col)])

    rec(0, [])
    return solutions


def permute_solution(n, rng):
    cols = list(range(n))
    rng.shuffle(cols)
    for i in range(n):
        if not valid_placement(i, cols[i], [(j, cols[j]) for j in range(i)], None, n):
            # rebuild cats for partial - need regions later
            pass
    cats = []
    for row in range(n):
        ok = False
        rng.shuffle(cols)
        for col in cols:
            if all(abs(row - r) > 1 or abs(col - c) > 1 for r, c in cats) and col not in [c for _, c in cats]:
                cats.append((row, col))
                ok = True
                break
        if not ok:
            return None
    return cats


def build_regions_from_solution(cats, n, rng):
    regions = [[-1] * n for _ in range(n)]
    for i, (r, c) in enumerate(cats):
        regions[r][c] = i

    unassigned = [(r, c) for r in range(n) for c in range(n) if regions[r][c] == -1]
    rng.shuffle(unassigned)

    def neighbors(r, c):
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n:
                yield nr, nc

    for r, c in unassigned:
        opts = [regions[nr][nc] for nr, nc in neighbors(r, c) if regions[nr][nc] >= 0]
        if not opts:
            return None
        regions[r][c] = rng.choice(opts)

    return regions


def try_generate(n, seed, givens=()):
    rng = random.Random(seed)
    for _ in range(400):
        cols = list(range(n))
        rng.shuffle(cols)
        cats = []
        valid = True
        for row in range(n):
            found = False
            order = cols[:]
            rng.shuffle(order)
            for col in order:
                if col in [c for _, c in cats]:
                    continue
                if any(abs(row - r) <= 1 and abs(col - c) <= 1 for r, c in cats):
                    continue
                cats.append((row, col))
                found = True
                break
            if not found:
                valid = False
                break
        if not valid or len(cats) != n:
            continue

        regions = build_regions_from_solution(cats, n, rng)
        if not regions:
            continue

        sols = solve_all(regions, n, givens, limit=2)
        if len(sols) == 1:
            return regions, sols[0], cats

    return None


NAMES = [
    ("Acquaintance", "Tap a cell: empty → X → Aju. One Aju per row, column, and color."),
    ("Friends", "Ajus cannot touch — not even diagonally."),
    ("Close friends", "Use X marks to rule out impossible tiles."),
    ("Best Friends", "Each colored region hides exactly one Aju."),
    ("Inseparables", "When a row is solved, X the rest of that row."),
    ("In love", "Bigger board — same four rules."),
    ("Long distance relationship I", "Look for regions locked to one row."),
    ("Long distance relationship II", "Three hearts — wrong Ajus cost one."),
    ("Families met", "7×7 expert logic."),
    ("Marriage", "Almost there — stay precise."),
]

levels = []
sizes = [4, 4, 5, 5, 5, 6, 6, 6, 7, 7]
seed_base = 42

for idx, n in enumerate(sizes):
    givens = []
    result = None
    max_seed = 15000 if n >= 8 else 8000
    for seed in range(seed_base, seed_base + max_seed):
        result = try_generate(n, seed + idx * 1000, givens)
        if result:
            break
    if not result:
        raise SystemExit(f"Failed to generate level {idx+1} size {n}")

    regions, solution, _cats = result
    name, hint = NAMES[idx]

    # Easy levels: one free Aju
    givens_out = []
    if idx in (0, 2, 5, 9):
        givens_out = [solution[0]]

    levels.append(
        {
            "id": 2015 + idx,
            "name": name,
            "hint": hint,
            "size": n,
            "regions": regions,
            "givens": givens_out,
            "solution": solution,
        }
    )

with open("levels.js", "w", encoding="utf-8") as f:
    f.write("/** Ajudoku levels — generated with unique solutions. */\n")
    f.write("window.AJUDOKU_LEVELS = ")
    json.dump(levels, f, indent=2)
    f.write(";\n")

print("Wrote", len(levels), "levels")
