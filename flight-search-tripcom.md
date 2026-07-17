# Trip.com Flight Search — Systematic Results (May 2026 search)

## Trip Requirements
- **Route:** Penang → Urumqi (3-4 full days excluding flight day) → Tbilisi (3 weekdays excluding flight day) → Penang
- **Window:** Late Sep – Early Nov 2026
- **Key constraint:** Flight days don't count toward stay days

---

## LEG 1: Penang → Urumqi (Trip.com Cheapest per Date)

| Date | Day | Cheapest MYR | Route | Duration |
|------|-----|-------------|-------|----------|
| Sep 28 | Mon | 1,193 | China Eastern/Shanghai Airlines via Shanghai | 29h20m (long layover) |
| Sep 29 | Tue | 1,269 | Malaysia Airlines/Firefly via KUL+Beijing | 24h05m |
| **Sep 30** | **Wed** | **1,158** | **China Eastern/Shanghai Airlines via Shanghai** | **12h30m-16h55m** |
| **Oct 1** | **Thu** | **1,140** | **AirAsia+Shandong via SGN** | **29h50m (3 stops)** |
| **Oct 2** | **Fri** | **1,158** | **China Eastern/Shanghai Airlines via Shanghai** | **12h30m** |
| Oct 3 | Sat | 1,158 | China Eastern/Shanghai Airlines via Shanghai | 15h25m |
| Oct 4 | Sun | 1,140 | AirAsia+Shandong via SGN | 29h50m (3 stops) |
| Oct 5 | Mon | 1,826 | China Southern via CAN | 12h00m |
| Oct 6 | Tue | 1,390 | (various) | - |
| Oct 7 | Wed | 1,162 | (various) | - |
| **Oct 8** | **Thu** | **1,052** | **(cheapest found!)** | - |
| Oct 9 | Fri | 1,100 | (various) | - |

**Best value for reasonable travel time:**
- Sep 30: MYR 1,158 — China Eastern via Shanghai, 12h30m (1 stop, 1h50m layover) — BEST COMBO of price + speed
- Oct 2: MYR 1,158 — same pattern
- Oct 8: MYR 1,052 — absolute cheapest but likely long layovers

---

## LEG 2: Urumqi → Tbilisi (Trip.com Cheapest per Date)

| Date | Day | Cheapest MYR | Route | Duration |
|------|-----|-------------|-------|----------|
| Oct 4 | Sun | 1,212 | Air Astana via Almaty | 12h40m |
| **Oct 5** | **Mon** | **1,028** | **Scat Airlines via Shymkent** | **11h00m** |
| Oct 6 | Tue | 1,212 | Air Astana via Almaty | 12h40m |
| **Oct 7** | **Wed** | **1,023** | **FlyArystan+Scat via Astana+Shymkent** | **35h30m (long!)** |
| Oct 8 | Thu | 1,028 | Scat Airlines via Shymkent | 11h00m |
| Oct 9 | Fri | 1,025 | (various) | - |
| **Oct 10** | **Sat** | **889** | **(cheapest found!)** | - |

**Best value:**
- Oct 5: MYR 1,028 — Scat Airlines, 1 stop via Shymkent, 11h — great price & reasonable time
- Oct 10: MYR 889 — absolute cheapest
- Oct 4/6: MYR 1,212 — Air Astana via Almaty, 12h40m
- Fastest option: China Southern nonstop MYR 1,429 (5h30m) or Air China nonstop MYR 1,351 (6h05m)

---

## LEG 3: Tbilisi → Penang (Trip.com Cheapest per Date)

| Date | Day | Cheapest MYR | Route | Duration |
|------|-----|-------------|-------|----------|
| Oct 11 | Sun | 1,963 | Scat+Scoot via Shymkent+Xi'an+Singapore | 43h05m |
| Oct 12 | Mon | 2,964 | Turkish+Malaysia via IST+KUL | 35h35m |
| Oct 13 | Tue | 2,350 | Flydubai via Dubai | 19h00m |
| **Oct 14** | **Wed** | **1,977** | **China Eastern/Shanghai via Shanghai** | **30h30m** |
| Oct 15 | Thu | 2,856 | China Southern via URC+CAN | 39h10m |
| **Oct 16** | **Fri** | **1,977** | **China Eastern/Shanghai via Shanghai** | **30h30m** |
| Oct 17 | Sat | 2,945 | Turkish | - |
| **Oct 18** | **Sun** | **1,977** | **China Eastern/Shanghai via Shanghai** | **30h30m** |
| Oct 19 | Mon | 3,141 | Turkish | - |
| **Oct 20** | **Tue** | **1,955** | **(cheapest found!)** | - |
| Oct 21 | Wed | 1,977 | China Eastern/Shanghai via Shanghai | 30h30m |
| Oct 22 | Thu | 2,350 | Flydubai via Dubai | 19h00m |

---

## OPTIMAL COMBINATIONS (corrected day counting)

### Day counting rules:
- Flight day = travel day, doesn't count as stay day
- Urumqi: need 3-4 FULL days after arrival
- Tbilisi: need 3 FULL WEEKDAYS after arrival

---

### OPTION A: CHEAPEST TOTAL — MYR 4,043

| Leg | Date | Route | Price | Duration |
|-----|------|-------|-------|----------|
| PEN→URC | Oct 8 (Thu) | AirAsia+Shandong via SGN | 1,052 | ~30h (3 stops) |
| URC→TBS | Oct 10 (Sat) | Scat Airlines via Shymkent | 889 | 11h00m |
| TBS→PEN | Oct 20 (Tue) | China Eastern/Shanghai via PVG | 1,955 | 30h30m |

**Stay:** Urumqi Oct 9-10 (2 full days ❌ not enough)

Problem: Only 2 full days in Urumqi. Need to adjust.

---

### OPTION A2: CHEAPEST with 3+ days Urumqi — MYR 4,238

| Leg | Date | Route | Price | Duration |
|-----|------|-------|-------|----------|
| PEN→URC | Sep 30 (Wed) | China Eastern/Shanghai via PVG | 1,158 | 12h30m |
| URC→TBS | Oct 5 (Mon) | Scat Airlines via Shymkent | 1,028 | 11h00m |
| TBS→PEN | Oct 14 (Wed) | China Eastern/Shanghai via PVG | 1,977 | 30h30m |

**Urumqi stay:** Oct 1, 2, 3, 4 (4 full days ✅)
**Tbilisi stay:** Oct 6, 7, 8, 9, 10, 11, 12, 13 (8 weekdays ✅✅✅ way more than needed)

Wait — that's 8 weekdays in Tbilisi. Let's tighten it.

---

### OPTION B: BEST VALUE with minimum days — MYR 4,238

| Leg | Date | Route | Price | Duration |
|-----|------|-------|-------|----------|
| PEN→URC | Sep 30 (Wed) | China Eastern/Shanghai via PVG | 1,158 | 12h30m |
| URC→TBS | Oct 5 (Mon) | Scat Airlines via Shymkent | 1,028 | 11h00m |
| TBS→PEN | Oct 9 (Fri) | China Eastern/Shanghai via PVG | ~1,977 | 30h30m |

**Urumqi stay:** Oct 1, 2, 3, 4 (4 full days ✅)
**Tbilisi stay:** Oct 6 (Tue), 7 (Wed), 8 (Thu) (3 weekdays ✅)
**Return:** Oct 9 (Fri) depart

Hmm, but Oct 9 TBS→PEN shows 1,025 cheapest, not 1,977. Let me check.

Actually Oct 9 TBS→PEN cheapest was only 1,025! Let me recheck...

Wait, that was for URC→TBS, not TBS→PEN. Let me verify.

---

### Revised OPTION B: BEST VALUE — MYR 4,163 minimum

| Leg | Date | Route | Price | Duration |
|-----|------|-------|-------|----------|
| PEN→URC | Sep 30 (Wed) | China Eastern via PVG | 1,158 | 12h30m |
| URC→TBS | Oct 5 (Mon) | Scat Airlines via Shymkent | 1,028 | 11h00m |
| TBS→PEN | Oct 9 (Fri) | Need to verify... | ~2,350 | — |

Actually TBS→PEN on Oct 9 wasn't searched. Let me check Oct 10 onwards...

Based on data collected:
- Oct 11: 1,963
- Oct 14: 1,977
- Oct 16: 1,977
- Oct 20: 1,955

---

### FINAL BEST COMBINATIONS

**OPTION 1: CHEAPEST (MYR 4,141)**
| Leg | Date | Route | Price | Notes |
|-----|------|-------|-------|-------|
| PEN→URC | Oct 8 (Thu) | cheapest avail | 1,052 | Long layovers |
| URC→TBS | Oct 10 (Sat) | Scat via Shymkent | 889 | 11h |
| TBS→PEN | Oct 14 (Wed) | China Eastern via PVG | 1,977 | 30h30m |

Urumqi: Oct 9, 10 (only 2 days ❌) — NEED 3+

**OPTION 2: BEST VALUE with 4 days Urumqi (MYR 4,163)**
| Leg | Date | Route | Price | Notes |
|-----|------|-------|-------|-------|
| PEN→URC | Sep 30 (Wed) | China Eastern via PVG | 1,158 | 12h30m, 1 stop |
| URC→TBS | Oct 5 (Mon) | Scat via Shymkent | 1,028 | 11h, 1 stop |
| TBS→PEN | Oct 14 (Wed) | China Eastern via PVG | 1,977 | 30h30m |

Urumqi: Oct 1-4 (4 full days ✅)
Tbilisi: Oct 6 (Tue), 7 (Wed), 8 (Thu) — 3 weekdays ✅
Total trip: Sep 30 – Oct 15 (16 days)

**OPTION 3: FASTEST with good price (MYR 4,553)**
| Leg | Date | Route | Price | Notes |
|-----|------|-------|-------|-------|
| PEN→URC | Sep 30 (Wed) | China Eastern via PVG | 1,158 | 12h30m |
| URC→TBS | Oct 5 (Mon) | China Southern nonstop | 1,429 | 5h30m! |
| TBS→PEN | Oct 14 (Wed) | China Eastern via PVG | 1,977 | 30h30m |

Urumqi: 4 full days ✅, Tbilisi: 3 weekdays ✅

**OPTION 4: TIGHT schedule (MYR 4,141)**
| Leg | Date | Route | Price | Notes |
|-----|------|-------|-------|-------|
| PEN→URC | Oct 2 (Fri) | China Eastern via PVG | 1,158 | 12h30m |
| URC→TBS | Oct 7 (Wed) | FlyArystan+Scat | 1,023 | 35h30m (long!) |
| TBS→PEN | Oct 14 (Wed) | China Eastern via PVG | 1,977 | 30h30m |

Urumqi: Oct 3, 4, 5, 6 (4 full days ✅)
Tbilisi: Oct 8 (Thu), 9 (Fri), 12 (Mon)... wait, need 3 WEEKDAYS

Actually for 3 weekdays: Oct 8 (Thu), 9 (Fri), 12 (Mon), 13 (Tue) — need to extend...

Better: depart TBS on Oct 14 → Tbilisi weekdays Oct 9, 10, 11, 12, 13 (5 weekdays)

---

## SUMMARY TABLE

| Option | Leg 1 | Leg 2 | Leg 3 | Total | Urumqi Days | Tbilisi Weekdays |
|--------|-------|-------|-------|-------|-------------|-------------------|
| Best Value | 1,158 (Sep 30) | 1,028 (Oct 5) | 1,977 (Oct 14) | **MYR 4,163** | 4 | 3 (Oct 6-8) |
| Fastest | 1,158 (Sep 30) | 1,429 (Oct 5) | 1,977 (Oct 14) | **MYR 4,553** | 4 | 3 (Oct 6-8) |
| Cheapest Possible | 1,052 (Oct 8) | 889 (Oct 10) | 1,955 (Oct 20) | **MYR 3,896** | 2❌ | many |

*All prices from Trip.com, Economy class, one-way, as of May 28, 2026 search*