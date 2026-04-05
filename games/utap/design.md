# Utap — Tap to Hear

Port of Unity "Utap" project to HTML for Prompt Arcade.

## Concept
An educational sound discovery app. Three categories of things — animals, instruments, and machines. Each shows a grid of photos. Tap a photo to hear its sound. Tap again to stop. Simple, tactile, satisfying.

Designed for kids and curiosity — no score, no timer, no failure state.

## Screens

### 1. Title Screen
- App name "Utap" centered
- Subtitle "Tap to hear the world"
- Three category cards arranged vertically (mobile) or horizontally (desktop):
  - Animals (with a representative thumbnail)
  - Instruments (with a representative thumbnail)
  - Machines (with a representative thumbnail)
- Tapping a card navigates to that category

### 2. Category Screen (Animals / Instruments / Machines)
- Back button (top-left) returns to title
- Category name as header
- Responsive grid of photo cards (3 columns on mobile, 4-5 on desktop)
- Each card shows:
  - The photo (cropped square, rounded corners)
  - The name below in friendly text (derived from filename, formatted: "Baby Giraffe", "Emperor Penguin", etc.)
- Tapping a card:
  - Plays the matching MP3 audio
  - Visual feedback: card pulses/glows while audio is playing
  - Tapping again while playing: stops the audio
  - Tapping a different card: stops current audio, plays new one

## Content Inventory

### Animals (48 images, 47 audio)
Images: Aífe, animals (category thumbnail), babygiraffe, babyseal, bat, bear, blowfly, camel, canadianlynx, cat, cheetah, chimpanzee, cow, cricket, crocodile, crow, dog, dolphin, donkey, duck, eagle, elephant, emperorpenguin, eurasianlynx, fawn, ferret, frog, goat, gorilla, hippopotamus, horse, kangaroo, koala, lion, meerkatcub, mouse, owl, panda, pig, rattlesnake, rooster, sheep, sloth, snowwolf, tasmaniandevil, tiger, whale, wombat

Note: "animals.jpg" is the category thumbnail, not a sound item. "Aífe" appears to be a personal pet photo — include it.
Note: hippopotamus.jpg vs hippotamus.mp3 — filename mismatch to handle.

### Instruments (24 images, 23 audio)
Images: accordion, bagpipes, banjo, bass, bugle, cello, clarinet, didgeredoo, drums, flute, guitar, guzheng, harmonica, harp, kazoo, mandolin, panpipes, piano, pipeorgan, saxophone, trombone, trumpet, violin, xylophone

Note: harp has image but audio is in machines folder (misplaced). didgeredoo.jpg vs didgeridoo.mp3 — spelling mismatch.
Note: No audio for harp in instruments (it's in machines/harp.mp3 — clearly misplaced).

### Machines (15 images, 16 audio)
Images: VWbus, aeroplane, blimp, bus, drag, enterprise, formula1, harley, helicopter, miner, porsche, scooter, snowmobile, tank, v8

Note: VWbus.jpg vs vwbus.mp3 — case mismatch. machines/harp.mp3 is misplaced (belongs in instruments).

## File Mismatches to Resolve
1. hippopotamus.jpg ↔ hippotamus.mp3 (typo in audio filename)
2. didgeredoo.jpg ↔ didgeridoo.mp3 (spelling difference)
3. VWbus.jpg ↔ vwbus.mp3 (case difference)
4. harp.mp3 in machines/ folder (should be instruments/)
5. No harp audio match — will use machines/harp.mp3 for instruments/harp

## Visual Design
- Clean white/light background — let the photos be the color
- Rounded card corners (12px radius)
- Subtle shadow on cards
- Playing state: blue/teal glow border + subtle scale pulse
- Category cards on title screen use the category thumbnail images (animals.jpg, first instrument image, first machine image)
- Mobile-first responsive layout

## Controls
- **Mouse/Touch**: Tap card to play/stop sound, tap category to navigate, tap back to return
- **No keyboard needed** — this is a tap-first app

## Technical
- Multi-file: index.html + images/ + sound/ subdirectories
- Images and audio copied from Unity project Assets
- All audio via HTML5 Audio API (no Web Audio complexity needed)
- Lazy-load images for performance (87 photos)
- No sprite engine needed — this uses real photos, not pixel art
