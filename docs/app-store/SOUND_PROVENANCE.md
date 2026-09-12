# Sound-effect reconstruction record

Audited 2026-09-11. All seven shipped WAV files can be reproduced byte for byte
using the repository's [generator](../../scripts/generate-sfx.py), which uses
only Python's standard library and mathematical sine waves. It reads no audio
inputs, downloads nothing, and uses no sample libraries.

## Historical evidence and limits

The files were introduced together in commit
`127df72a360c0bdce56c947dad9ff3c4117762bb` on 2026-01-25, titled
`feat: add core SFX for actions and events`. Git records no later changes to the
WAV files. That commit includes the audio files and gameplay integration, but
no generator, source URL, or asset license. The owner reports that ChatGPT added
them; the original generation conversation was not recovered in this audit.

The generator added during this audit is an independent reconstruction, not a
recovered historical script. Every byte of its output, including the WAV
headers, matches every shipped file. This establishes a reproducible synthesis
source without needing any third-party recording or sample pack. It does not
identify the exact historical tool or establish exclusive copyright ownership.

## Synthesis specification

Each file contains mono, signed 16-bit little-endian PCM at 22,050 Hz. For sample
index `i` and total sample count `N`, its value is:

```text
int(32767 * 0.25 * sin(2 * pi * frequency * i / 22050) * (1 - i / N))
```

The envelope fades linearly to zero; there are no voices, recordings, or musical
samples used by the generator. Playback volume and rate are configured separately
in `src/scene.js`.

| File | Frequency | Duration | SHA-256 of audited file |
| --- | --- | --- | --- |
| place.wav | 520 Hz | 0.12 s | `568a384b487e74d98d3ffd3cb9ad3d78ac719a46623b907d95325aea000ce77c` |
| upgrade.wav | 660 Hz | 0.12 s | `8d5099d2506af9d884ce6ba657533de50534655c3071117232263862966a8f99` |
| sell.wav | 330 Hz | 0.12 s | `88875bbabcba8121fefc761d854eeab5b376974402f2c5f9aec31386de91f68e` |
| wave.wav | 220 Hz | 0.12 s | `e0635562428fce8f2feef86c563eba3972fea6c3cbe69aad73a599d03ad2368f` |
| death.wav | 880 Hz | 0.12 s | `13f57a650ff33483bd9ef546c2dd93f6e4081a42e0b86a9875d65c00cc82df0d` |
| life.wav | 140 Hz | 0.12 s | `76f7d6e1df5cbdb8dce42e5a6084293b1581bf5558024b745bfc97a00175f0aa` |
| gameover.wav | 110 Hz | 0.20 s | `8df5f509964b7073fa7fc73ff3d1ce59eaf92bfdd057c29aabb6a88dd7bbc6e9` |

## Reproduction and release handling

From the repository root, verify without writing:

```bash
python3 scripts/generate-sfx.py
```

To regenerate from the documented synthesis source:

```bash
python3 scripts/generate-sfx.py --write
```

The generator is covered by the repository's MIT license. No third-party audio
license or attribution is needed as an input to this generation process. The
previous missing-source gate is resolved by the exact reconstruction; retain
this record with the release. Final App Store content-rights declarations remain
the account holder's responsibility. Any future replacement audio must have its
source and applicable license documented before inclusion.
