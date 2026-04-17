# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Phonosium is an outdoor sound installation built on **PureData (PD) patches** and a **BelaIO** board. Four microphones feed four independent audio effects. A PIR motion sensor triggers a looping ambient audio file that sustains while visitors are present and fades out 5 minutes after they leave.

There are two modes:
- **Testing (computer):** single mic (`adc~ 1`), toggle (`[tgl]`) simulates PIR, stereo out (`dac~ 1 2`)
- **Bela (production):** 4 mics (`adc~ 1 2 3 4`), `[bela.digitalIn 0]` for PIR, 4-channel out (`dac~ 1 2 3 4`)

## Running the Patches

Open **`_main.pd`** in PureData Vanilla (0.55+). No externals required — all patches use vanilla PD only.

1. `Media → Audio Settings` — set input to microphone, output to speakers, 44100 Hz
2. `Media → Start DSP` (`Cmd+/` on Mac)
3. Set Master volume to ~0.8
4. Click the `[tgl]` to simulate PIR motion trigger

The `loop.wav` file must be in the same directory as `_main.pd`. Format: WAV, 44100 Hz, any duration.

## GUI (sketch.js)

`sketch.js` is a **p5.js** visualizer. It connects via WebSocket to `ws://<bela.local>:5555`. If no connection is found, it runs in animated demo mode automatically. The master volume slider sends `{ masterVol: float }` to Bela; Bela sends `{ level: float, masterVol: float }` back.

## Patch Architecture

```
_main.pd  ←  open this
  ├── adc~ 1           (testing) / adc~ 1 2 3 4  (Bela)
  ├── pir_logic.pd     → sends "play"/"stop" messages to loop_player
  ├── loop_player.pd   → readsf~ loops loop.wav; EOF bang restarts automatically
  ├── fx_granular.pd   → 3-voice granular (delwrite~/vd~, phasor-driven, Hanning window)
  ├── fx_pitchshift.pd → ring modulation frequency shift (NOT semitone pitch shift)
  ├── fx_reverb.pd     → 4 delay taps at 347/743/1153/1657 ms, decreasing gain
  └── fx_distortion.pd → hard clip + hip~ 4000 (currently unused in main chain)
```

In testing mode, the single mic feeds all four effects simultaneously. On Bela, each mic feeds only its assigned effect.

### PIR Logic (`pir_logic.pd`)
- PIR = 1 → sends `play` immediately; cancels any pending stop timer
- PIR = 0 → starts 300,000 ms (5-minute) delay; if PIR = 1 before it fires, delay cancels; when delay fires → sends `stop`

## Deploying to BelaIO

Edit `_main.pd`:
1. Replace `[adc~ 1]` → `[adc~ 1 2 3 4]`; route each outlet to its own effect
2. Replace `[tgl]` → `[bela.digitalIn 0]`
3. Replace `[dac~ 1 2]` → `[dac~ 1 2 3 4]`; route each effect to its own speaker
4. Upload all `.pd` files + `loop.wav` to Bela IDE (`bela.local`)
5. Set `_main.pd` as the run file

Outdoor tuning: add `*~ 3` after `adc~` for gain, `[hip~ 80]` per channel for wind noise reduction. Keep Master below 0.85 to prevent feedback.

### Bela CPU Budget

Before expanding to 4 independent FX chains (Phase 3), measure CPU in Bela IDE
(console shows % usage). Target: < 60% with one full chain. If over budget:
- Remove fx_pitchshift from the serial chain (it contributes the least to the
  installation's sonic character and is the simplest to drop)
- Reduce fx_granular voices from 3 to 2: change offsets to 0 / 0.5,
  update *~ 0.667 normalizer to *~ 0.5

## Known Limitations

- `fx_pitchshift.pd` is ring modulation (adds constant Hz to all partials), not a true semitone pitch shift. Intentional design choice.
- `loop_player.pd` uses `readsf~` EOF bang for looping — there may be a ~1 block gap at the loop point.
- On Bela restart, the system always starts in silent state (PIR = 0) regardless of actual motion.
- `fx_distortion.pd` is complete but not wired into the main chain; it is kept for future use.

## File Discrepancy Note

The README and PLAN.md reference `phonosium_main.pd` as the master patch, but the actual file on disk is `_main.pd`. Treat `_main.pd` as the authoritative entry point.
