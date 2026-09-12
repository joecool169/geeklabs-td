#!/usr/bin/env python3
"""Reproduce the game's seven PCM tones without recordings or third-party assets.

Default: verify the shipped WAV files byte for byte. --write: regenerate them.
See docs/app-store/SOUND_PROVENANCE.md for the reconstruction evidence.
"""

import argparse
import hashlib
import io
import math
from pathlib import Path
import struct
import wave


SFX_DIR = Path(__file__).resolve().parents[1] / "public" / "sfx"
SAMPLE_RATE = 22050
TONES = {
    "place": (520, 0.12),
    "upgrade": (660, 0.12),
    "sell": (330, 0.12),
    "wave": (220, 0.12),
    "death": (880, 0.12),
    "life": (140, 0.12),
    "gameover": (110, 0.20),
}


def render_tone(frequency, duration):
    count = int(SAMPLE_RATE * duration)
    frames = b"".join(
        struct.pack(
            "<h",
            int(32767 * 0.25 * math.sin(2 * math.pi * frequency * i / SAMPLE_RATE)
                * (1 - i / count)),
        )
        for i in range(count)
    )
    output = io.BytesIO()
    with wave.open(output, "wb") as wav:
        wav.setparams((1, 2, SAMPLE_RATE, count, "NONE", "not compressed"))
        wav.writeframes(frames)
    return output.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="regenerate shipped WAV files")
    args = parser.parse_args()
    failed = False
    for name, (frequency, duration) in TONES.items():
        path = SFX_DIR / f"{name}.wav"
        generated = render_tone(frequency, duration)
        if args.write:
            path.write_bytes(generated)
        matches = path.is_file() and path.read_bytes() == generated
        failed |= not matches
        print(f"{'MATCH' if matches else 'MISMATCH'} {path.name} "
              f"sha256={hashlib.sha256(generated).hexdigest()}")
    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main())
