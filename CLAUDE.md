# Phono — Claude Context

## Project
PureData patch running on Bela IO (Bela Mini or similar). Previewed and deployed via the Bela IDE (browser-based). Pd version: 0.51.4.

## Files
- `_main.pd` — top-level patch (Bela requires this name)
- `mic_trigger~.pd` — abstraction: one instance per mic input
- `loop.wav` — stereo background loop, loaded into arrays and played via `tabplay~`
- `samples/1.wav` … `samples/24.wav` — random trigger samples (stereo, currently ~7 s placeholders)

## How it works
1. `loop.wav` is read into arrays `loop_L` / `loop_R` at startup and played in a continuous loop via `tabplay~`. When one finishes it bangs a restart via `t b b`.
2. Four Audio Expander stereo pairs (AE In 0+1, 2+3, 4+5, 6+7 → `adc~` 3+4, 5+6, 7+8, 9+10) each have their two channels summed by `+~` before feeding a `mic_trigger~ 50` abstraction. The `50` is the pitch-detection threshold.
3. Inside `mic_trigger~`: `bonk~` detects percussive onsets → `> $1` (velocity threshold) → `select 1` → `spigot` gate → `t b b b` triggers playback. `fiddle~ 1024` runs in parallel for pitch logging only (outlet 2, printed every 2 s via `metro 2000`). `bonk~` is event-based so sustained noise never causes false triggers or stalls the gate.
4. On trigger: a random integer 1–24 is chosen, the file `samples/<n>.wav` is opened and started via `readsf~ 2`.
5. Gate: `spigot` closes when triggered (blocks re-triggering) and reopens when `readsf~` outlet 2 fires its done-bang.
6. A `metro 2000` / `f` pair prints each mic's RMS level every 2 s for debugging.
7. Sample audio exits `mic_trigger~` on outlet~ 0/1 and is routed to `dac~ 1 2` and `dac~ 3 4` (all outputs get the mix).

## Known Pd 0.51 / Bela quirks
- `prepend` external is NOT available — use a message box `open $1` instead to build `open <filename>` messages for `readsf~`.
- `readsf~ 2` has outlets: 0 (L audio), 1 (R audio), 2 (bang when done).
- Abstraction `$1` substitution works normally; creation arg `mic_trigger~ 50` sets the threshold.
- Samples must live in a `samples/` subfolder relative to the project root; `makefilename samples/%d.wav` builds the path.

## Audio routing
| Source | Destination |
|--------|-------------|
| `tabplay~ loop_L` | dac~ 1 2 in0, dac~ 3 4 in0 |
| `tabplay~ loop_R` | dac~ 1 2 in1, dac~ 3 4 in1 |
| mic_trigger~ outlet~ 0 (L) | dac~ 1 2 in0, dac~ 3 4 in0 |
| mic_trigger~ outlet~ 1 (R) | dac~ 1 2 in1, dac~ 3 4 in1 |

## Things to adjust
- **Threshold**: change the `50` arg in `_main.pd` (`mic_trigger~ 50`) per mic if sensitivity needs tuning.
- **Sample count**: `random 24` in `mic_trigger~.pd` — update if you add/remove samples.
- **Gate fallback**: if samples get much shorter than 7 s, the `readsf~` done-bang is the only gate reset — no timer fallback. Add a `delay <ms>` -> `1` -> `spigot in1` path if needed.
