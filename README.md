# Phonosium

An outdoor sound installation built on PureData and BelaIO. Four microphones continuously process ambient sound through independent audio effects. A PIR motion sensor triggers a looping ambient audio track that sustains as long as visitors are present, fading out five minutes after they leave.

---

## Concept

Phonosium listens to its environment and transforms it in real time. Each microphone feeds its own effect chain — granular synthesis, frequency shifting, reverb, and distortion — creating a layered, evolving soundscape from the sounds already present in the space. The installation is always "on" for its effects; the loop layer activates only when someone enters.

---

## Hardware (Final Installation)

| Component | Quantity | Notes |
|---|---|---|
| BelaIO | 1 | Main compute + audio interface |
| Outdoor microphones | 4 | One per effect channel |
| Outdoor speakers | 4 | One per output channel |
| PIR motion sensor | 1 | Digital input to BelaIO |
| Power supply | 1 | Weatherproofed for outdoor use |

**BelaIO pin mapping (example — adjust to your wiring):**

| Signal | BelaIO Pin |
|---|---|
| Mic 1 | Audio In 1 |
| Mic 2 | Audio In 2 |
| Mic 3 | Audio In 3 |
| Mic 4 | Audio In 4 |
| PIR sensor | Digital In 0 |
| Speaker 1 | Audio Out 1 |
| Speaker 2 | Audio Out 2 |
| Speaker 3 | Audio Out 3 |
| Speaker 4 | Audio Out 4 |

---

## Software Requirements

- [PureData Vanilla](https://puredata.info/downloads/pure-data) — tested with PD 0.55+
- No external libraries required — all patches use vanilla PD objects only
- BelaIO firmware with PD mode enabled (for final deployment)

---

## File Structure

```
Phonosium/
├── README.md               ← you are here
├── PLAN.md                 ← development roadmap and status
├── phonosium_main.pd       ← master patch — open this in PD
├── pir_logic.pd            ← PIR timer logic subpatch
├── loop_player.pd          ← looping audio file player subpatch
├── fx_granular.pd          ← granular synthesis effect (Mic 1)
├── fx_pitchshift.pd        ← ring modulation / frequency shift (Mic 2)
├── fx_reverb.pd            ← multi-tap delay reverb (Mic 3)
├── fx_distortion.pd        ← waveshaper distortion (Mic 4)
└── audio/
    └── loop.wav            ← place your ~1 minute loop audio file here
```

> **Note:** `loop.wav` is not included. See [Loop Audio](#loop-audio) below.

---

## Quick Start (Testing on Computer)

This mode uses your computer's built-in microphone and speakers — no BelaIO needed.

1. **Install PureData Vanilla** from https://puredata.info/downloads/pure-data
2. **Clone or download** this repository into a folder
3. **Open** `phonosium_main.pd` in PureData
4. **Enable audio:** `Media → Audio Settings`
   - Input: your microphone (built-in or USB)
   - Output: your speakers or headphones
   - Sample rate: 44100 Hz
5. **Start DSP:** `Media → Start DSP` (or `Ctrl+/` on Windows/Linux, `Cmd+/` on Mac)
6. **Set Master volume** in the main patch to around `0.8`
7. **Speak into your mic** — you should hear all four effects blended together
8. **Simulate PIR:** click the `[tgl]` toggle in the main patch
   - Toggle ON (1) = motion detected → plays loop
   - Toggle OFF (0) = no motion → starts 5-minute countdown, then stops loop

> In testing mode, your single mic feeds all four effects simultaneously. On Bela, each mic feeds only its assigned effect.

---

## Loop Audio

The loop player expects a file named `loop.wav` in the **same directory as `phonosium_main.pd`**.

- Format: WAV, mono or stereo, 44100 Hz
- Duration: ~1 minute (can be shorter or longer — it loops seamlessly)
- Content: ambient bed, tone, field recording, generative audio, etc.

Create or export your loop from any DAW or audio editor (Audacity, Logic, Ableton, etc.).

---

## Effect Descriptions

Each effect has adjustable parameters. Open the subpatch file directly in PD to adjust, or wire the controls to sliders in the main patch.

### fx_granular.pd — Granular Synthesis
Continuously records the microphone into a 1-second buffer and reads it back using three phase-staggered grain voices. Each grain is windowed with a Hanning envelope to eliminate clicks at grain boundaries.

| Parameter | Range | Effect |
|---|---|---|
| RATE | 1–30 Hz | Grain density — higher = more grains per second |
| SIZE | 50–900 ms | How far back in the buffer grains read |
| MIX | 0–1 | Dry/wet blend |

**Character:** Smeared, cloud-like, time-stretching texture. Low RATE + large SIZE = slow wash. High RATE + small SIZE = rhythmic flutter.

---

### fx_pitchshift.pd — Ring Modulation / Frequency Shift
Multiplies the input signal by a cosine oscillator. This creates sum and difference sidebands at `f ± carrier`, producing metallic, bell-like, or tremolo textures depending on the carrier frequency.

> Note: this is a *frequency shift* (adds constant Hz to all partials), not a true *pitch shift* (which would multiply frequency). The result is harmonically interesting but intentionally non-musical.

| Parameter | Range | Effect |
|---|---|---|
| FREQ | 1–2000 Hz | Carrier frequency |
| MIX | 0–1 | Dry/wet blend |

**Character:** 1–20 Hz = tremolo. 50–200 Hz = metallic clang. 200–2000 Hz = alien, industrial.

---

### fx_reverb.pd — Multi-Tap Delay Reverb
Four delay taps at prime-ish delay times (347ms, 743ms, 1153ms, 1657ms) with decreasing gain, creating a diffuse, natural-sounding reverb without feedback instability.

| Parameter | Range | Effect |
|---|---|---|
| MIX | 0–1 | Wet/dry blend (0 = dry, 1 = fully wet) |

**Character:** Spacious, outdoor-friendly. Works well at MIX 0.4–0.7.

---

### fx_distortion.pd — Waveshaper Distortion
Pre-gain amplification followed by hard clipping and a 4kHz low-pass filter to tame harsh high-frequency artifacts.

| Parameter | Range | Effect |
|---|---|---|
| DRIVE | 1–20 | Pre-clip gain — higher = more saturation |

**Character:** Low drive (1–3) = subtle warmth. High drive (10–20) = aggressive grit.

---

## PIR Sensor Logic

```
PIR = 1 (motion)  →  loop starts immediately
                      any pending stop timer is cancelled

PIR = 0 (no motion) → 5-minute (300,000 ms) countdown begins
                       if PIR = 1 again before it ends → countdown cancels
                       if countdown completes → loop stops
```

The 5-minute hold ensures the installation keeps playing while visitors explore the space, even if they step briefly out of the sensor's view.

---

## Deploying to BelaIO

When moving from computer testing to Bela, edit `phonosium_main.pd`:

### 1. Audio Input — 4 Channels
Change:
```
[adc~ 1]
```
To:
```
[adc~ 1 2 3 4]
```
Then route each outlet to its assigned effect instead of branching all four from one signal:
- Outlet 0 (ch1) → `[fx_granular]`
- Outlet 1 (ch2) → `[fx_pitchshift]`
- Outlet 2 (ch3) → `[fx_reverb]`
- Outlet 3 (ch4) → `[fx_distortion]`

### 2. PIR Sensor Input
Change:
```
[tgl]
```
To:
```
[bela.digitalIn 0]
```
Replace `0` with the actual digital pin number the PIR signal wire is connected to.

### 3. Audio Output — 4 Channels
Change:
```
[dac~ 1 2]
```
To:
```
[dac~ 1 2 3 4]
```
And route each effect to its dedicated speaker output instead of summing to stereo.

### 4. Upload to Bela
- Connect Bela via USB
- Open the Bela IDE in your browser (`bela.local`)
- Create a new PD project
- Upload all `.pd` files and `loop.wav`
- Set `phonosium_main.pd` as the run file
- Click Run

---

## Tuning for Outdoor Use

- **Gain staging:** outdoor mics in open air will have lower input levels — increase input gain in Bela IDE or add `*~ 3` after `adc~` before the effects
- **Wind noise:** add a `hip~ 80` (high-pass at 80 Hz) after each mic input to reduce low-frequency wind rumble
- **Speaker protection:** keep Master volume below 0.85 and avoid feedback from speakers reaching mics
- **Weatherproofing:** all electronics should be in a sealed, ventilated enclosure; BelaIO runs warm

---

## License

Open source. Modify freely for non-commercial art and research purposes.
