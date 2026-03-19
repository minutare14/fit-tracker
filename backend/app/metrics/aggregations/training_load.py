import pandas as pd


def summarize_strength_volume(rows: list[dict]) -> float:
    if not rows:
        return 0.0

    frame = pd.DataFrame(rows)
    if frame.empty:
        return 0.0

    return float((frame["weight_kg"].fillna(0) * frame["reps"].fillna(0)).sum())
