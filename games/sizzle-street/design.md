# Sizzle Street — Cooking Idle Game

## Concept
Run a tiny street food kitchen. Cook dishes by clicking, earn coins, buy upgrades to automate cooking and boost earnings, unlock new recipes as you progress. The game loop: **cook > earn > upgrade > unlock > repeat**.

Inspired by community suggestion: "incremental game where you cook simple dishes to earn money then buy upgrades that increase how much each dish earns or automate cooking and slowly unlock a few better recipes"

## Core Mechanics

### Cooking
- Click the **COOK** button (or tap on mobile) to prepare the current dish
- Each cook produces one serving, which earns coins based on the dish's value
- A brief cooking animation plays (steam, sizzle particles)
- Dishes have a cook time — clicking during cooldown queues the next cook

### Recipes (Progression)
Unlock recipes by reaching coin thresholds. Each recipe earns more but costs more to upgrade.

| # | Recipe | Base Value | Unlock Cost | Visual |
|---|--------|-----------|-------------|--------|
| 1 | Fried Egg | 1 coin | Free (starter) | Yellow egg on plate |
| 2 | Grilled Cheese | 5 coins | 50 coins | Golden sandwich |
| 3 | Stir Fry | 15 coins | 300 coins | Wok with veggies |
| 4 | Ramen Bowl | 50 coins | 1,500 coins | Steaming noodle bowl |
| 5 | Sushi Platter | 150 coins | 8,000 coins | Colorful sushi plate |
| 6 | Steak Dinner | 500 coins | 50,000 coins | Steak with sides |
| 7 | Chef's Special | 2,000 coins | 500,000 coins | Ornate plated dish |

Once unlocked, a recipe appears in the kitchen and auto-cooks if automated. Players can click any unlocked recipe to manually cook it.

### Upgrades (Shop)
Each upgrade has increasing cost per level (cost * 1.15^level):

| Upgrade | Effect | Base Cost |
|---------|--------|-----------|
| Sharp Knife | +1 coin per cook (all dishes) | 10 |
| Better Stove | -10% cook time | 25 |
| Sous Chef | Auto-cook dish #1 every 3s | 100 |
| Line Cook | Auto-cook dish #2 every 3s | 500 |
| Kitchen Timer | Auto-cook dish #3 every 3s | 2,000 |
| Prep Station | Auto-cook dish #4 every 3s | 10,000 |
| Sushi Master | Auto-cook dish #5 every 3s | 60,000 |
| Grill Master | Auto-cook dish #6 every 3s | 400,000 |
| Head Chef | Auto-cook dish #7 every 3s | 3,000,000 |
| Tip Jar | +10% all earnings | 200 |
| Food Truck | +25% all earnings | 5,000 |
| TV Appearance | +50% all earnings | 100,000 |

### Prestige System
At 1,000,000 total coins earned, unlock "Grand Opening" prestige:
- Reset all progress
- Gain a permanent multiplier (1 + 0.1 * prestige_count)
- Kitchen background changes (street cart -> food truck -> restaurant -> 5-star)

## Visual Entities

### Kitchen Background
- **Street Cart** (full width, bottom third of screen): wooden cart with awning, warm wood tones. Browns (#8B6914, #6B4E12), red awning (#CC3333, #992222)
- Canvas: 320x180

### Dishes (shown on the counter when cooking)
All dishes rendered at 32x32:

1. **Fried Egg**: Sunny-side-up egg on a white plate. White (#F0F0F0), yolk yellow (#FFD700, #FFA500), plate rim (#D0D0D0)
2. **Grilled Cheese**: Golden-brown triangle sandwich with melted cheese edge. Bread (#D4A030, #B8860B), cheese (#FFD700)
3. **Stir Fry**: Round wok shape with colorful veggie bits. Wok grey (#555555), veggies: green (#44AA44), red (#DD4444), orange (#FF8C00)
4. **Ramen Bowl**: Round bowl with noodle swirls and chopsticks. Bowl (#E8E0D0), broth (#D4A030), noodles (#FFFFAA), chopsticks (#8B4513)
5. **Sushi Platter**: Rectangular plate with 3 colorful sushi pieces. Plate (#2A2A2A), rice (#FFFFFF), salmon (#FA8072), tuna (#CC4444), avocado (#6B8E23)
6. **Steak Dinner**: Plate with steak, green garnish, side. Steak (#8B4513, #6B3410), garnish (#228B22), plate (#F0F0F0)
7. **Chef's Special**: Ornate plated dish with sauce drizzle. Plate (#F5F5DC) with gold rim (#DAA520), main item (#8B4513), sauce (#CC2222)

### UI Icons (24x24 each)
- **Coin**: Gold circle with embossed $ symbol. Gold (#FFD700, #DAA520, #B8860B)
- **Clock**: Simple round clock face. Frame (#888888), face (#F0F0F0), hands (#333333)
- **Star**: 5-pointed star for prestige. Gold (#FFD700) with bright center (#FFFFAA)
- **Flame**: Small cooking flame. Orange (#FF6600), yellow (#FFCC00), red tip (#FF2200)

### Particle Effects (code-drawn, no sprites)
- **Steam**: White/grey circles floating up from dishes when cooking
- **Coin Sparkle**: Gold particles burst when earning coins
- **Sizzle**: Orange/yellow specks around the cooking area
- **Level-up Glow**: Brief golden pulse when unlocking a new recipe

## Layout

```
+------------------------------------------+
|  COINS: 1,234  |  /sec: 45  |  /click: 8 |  <- Top stats bar
+------------------------------------------+
|                                          |
|     [Egg] [Cheese] [Wok] [Ramen] ...    |  <- Recipe slots (horizontal scroll on mobile)
|                                          |
|         +------------------+             |
|         |   Current Dish   |             |  <- Main cooking area with animation
|         |   (click here)   |             |
|         +------------------+             |
|           [ COOK! button ]               |
|                                          |
+------------------------------------------+
|  UPGRADES                                |  <- Scrollable shop panel
|  [Sharp Knife    Lv.3   Cost: 15]       |
|  [Better Stove   Lv.1   Cost: 25]       |
|  [Sous Chef      Lv.0   Cost: 100]      |
|  ...                                     |
+------------------------------------------+
```

Desktop: shop panel on right side (300px), kitchen fills the rest
Mobile: kitchen on top (60vh), shop below (scrollable)

## Controls
- **Mouse/Touch**: Click COOK button or tap recipe icons to cook
- **Keyboard**: Spacebar to cook current dish, 1-7 to select recipe
- **Mobile**: Full touch support, responsive layout, no hover-dependent UI

## Audio (Web Audio API)
- Cook: short sizzle sound (white noise burst)
- Coin earned: gentle chime (high sine tone)
- Upgrade purchased: cash register ding
- Recipe unlocked: ascending 3-note fanfare
- Prestige: grand chord

## Save System
- Auto-save to localStorage every 30 seconds
- Save on page unload
- Anti-tamper checksum (same pattern as capybara-clicker)
- Offline earnings calculated on load (capped at 8 hours)

## Score Integration
- Submit total coins earned to leaderboard (game key: "sizzle-street")
- Prompt for initials on prestige or manual submit
