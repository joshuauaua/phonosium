# Phonosium — Development Plan

---

## Project Goals

1. Build a working PureData patch system testable on a laptop with a single mic
2. Deploy to BelaIO with 4 mics, 4 speakers, and a PIR sensor
3. Install the system outdoors as a permanent or semi-permanent sound installation

---

## Phases

### Phase 1 — Patch Development (Computer Testing)
*Current phase.*

Build and validate all PD patches on a standard computer before touching hardware.

- [x] Design patch architecture (main + subpatches)
- [x] Write `pir_logic.pd` — 5-minute PIR hold timer
- [x] Write `loop_player.pd` — seamless looping audio player
- [x] Write `fx_granular.pd` — 3-voice granular synthesis
- [x] Write `fx_pitchshift.pd` — ring modulation frequency shifter
- [x] Write `fx_reverb.pd` — multi-tap delay reverb
- [x] Write `fx_distortion.pd` — hard clip waveshaper
- [x] Write `phonosium_main.pd` — master routing patch
- [ ] Source or produce a `loop.wav` ambient audio file (~1 min)
- [ ] Load patches in PD, verify DSP runs without errors
- [ ] Test PIR toggle → loop start/stop behavior
- [ ] Test all four effects with microphone input
- [ ] Tune effect parameters for pleasing results
- [ ] Test 5-minute hold timer by simulating PIR off → wait → confirm stop

---

### Phase 2 — BelaIO Setup and Hardware Test
*Single mic, single speaker, PIR sensor connected.*

Validate that the system runs on Bela before full hardware is assembled.

- [ ] Install BelaIO firmware and confirm it boots
- [ ] Connect one microphone to Audio In 1
- [ ] Connect one speaker to Audio Out 1
- [ ] Wire PIR sensor to Digital In 0 (3.3V signal, check sensor specs)
- [ ] Upload PD patches and `loop.wav` to Bela IDE
- [ ] Verify audio input and output levels in Bela IDE
- [ ] Replace `[tgl]` with `[bela.digitalIn 0]` in `phonosium_main.pd`
- [ ] Test PIR physical trigger — wave hand in front of sensor
- [ ] Confirm loop starts and the 5-minute hold works
- [ ] Confirm one effect (granular) processes mic input correctly
- [ ] Test Bela auto-start on boot (so it runs without a laptop)

---

### Phase 3 — Full Hardware Integration
*All 4 mics, 4 speakers, finalized routing.*

- [ ] Connect all 4 microphones to Audio In 1–4
- [ ] Connect all 4 speakers to Audio Out 1–4
- [ ] Update `phonosium_main.pd` to full 4-channel routing:
  - `[adc~ 1 2 3 4]` with each channel routed to its own effect
  - `[dac~ 1 2 3 4]` with each effect routed to its own speaker
- [ ] Balance input gain per microphone (outdoor mics vary in sensitivity)
- [ ] Add `[hip~ 80]` high-pass filter after each mic input (wind noise reduction)
- [ ] Test all 4 effects and speakers together
- [ ] Verify no feedback loop between speakers and microphones in space
- [ ] Stress test: run continuously for 2+ hours and monitor for CPU issues

---

### Phase 4 — Site Installation
*Physical deployment outdoors.*

- [ ] Select installation site and confirm power access
- [ ] Design weatherproof enclosure for BelaIO (sealed, vented, shaded)
- [ ] Mount microphones at planned positions (consider wind baffles)
- [ ] Mount speakers on stands or structures
- [ ] Position PIR sensor to cover visitor approach path
- [ ] Run cabling (weatherproofed; use conduit if permanently installed)
- [ ] Final system test on site before opening
- [ ] Document speaker placement and effect-to-mic assignments
- [ ] Set Bela to auto-start `phonosium_main.pd` on power-on

---

### Phase 5 — Iteration and Refinement
*Post-installation improvements.*

- [ ] Add volume control interface (hardware knob via analog in on Bela)
- [ ] Explore replacing ring mod with true pitch shifting (FFT-based or external)
- [ ] Add scatter/randomization parameter to granular patch for more organic texture
- [ ] Experiment with mic-to-speaker spatial routing (which mic feeds which speaker)
- [ ] Consider time-of-day variation (e.g., effect parameters shift at dawn/dusk)
- [ ] Consider adding a second PIR sensor for larger coverage zone
- [ ] Add logging or LED indicator for system status (Bela digital out)

---

## Technical Decisions Log

| Decision | Rationale |
|---|---|
| Vanilla PD only (no externals) | Maximum compatibility with Bela; no dependency management |
| Ring modulation instead of true pitch shift | True semitone pitch shift in vanilla PD requires complex FFT patches; ring mod is simpler and produces distinctive, interesting results for an installation context |
| Multi-tap delay reverb instead of feedback comb | Feedback loops in PD text format are harder to debug; multi-tap is stable and predictable |
| 3-voice granular with Hanning window | Odd number of voices prevents phase cancellation; Hanning window eliminates grain-boundary clicks |
| 5-minute hold timer (not immediate stop) | Visitors move around; immediate stop on PIR loss would cause frequent interruptions |
| Phasor-driven delay buffer for granular | More reliable than tabwrite~/tabread4~ approach; delay buffer handles circular write automatically |

---

## Known Limitations and Notes

- **fx_pitchshift** is a frequency shift (ring modulation), not a true semitone pitch shift. All partials shift by a constant Hz rather than by a ratio. This creates inharmonic sidebands which are unconventional but sonically interesting for an installation.
- **loop_player** relies on `readsf~` EOF bang for looping. There may be a brief (~1 block) gap at the loop point. If seamless looping is critical, pre-process the file to crossfade the loop point in audio software.
- **Testing mode shares one mic across all four effects.** This is fine for development but not representative of the final installation, where each effect will have its own distinct sonic character based on what its microphone picks up.
- **No persistent state on Bela restart.** If power is cut and restored, the system starts in silent mode (PIR = 0, loop not playing) regardless of whether motion is present. This is the correct safe default.

---

## Open Questions

- What is the content/character of `loop.wav`? (Drone, field recording, generative tone, etc.)
- What is the spatial layout of the 4 microphones and 4 speakers — should effects be spatially matched (mic 1 near speaker 1) or crossed for unexpected diffusion?
- Will there be a way to adjust parameters on-site without a laptop (hardware knobs, remote SSH)?
- Is the installation day/night? If night-only, should the system power down during the day?
- What is the expected ambient noise floor of the site, and will it interact with the reverb/granular effects?

---

## Resources

- [PureData documentation](https://puredata.info/docs)
- [BelaIO documentation](https://learn.bela.io)
- [BelaIO + PureData guide](https://learn.bela.io/using-bela/languages/pure-data/)
- [Miller Puckette — Theory and Technique of Electronic Music](http://msp.ucsd.edu/techniques.htm) (foundational PD reference)
