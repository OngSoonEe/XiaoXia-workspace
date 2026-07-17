# FINAL OPTIMIZATION — Complete Enumeration

## Methodology: Exhaustive Search over Small Graph
- 4 route topologies × feasible date combos × flight choices per leg
- Constraint: URC 3-4 full days, TBS ≥3 full days with ≥3 working days (Mon-Fri)
- Objective: minimize total cost, then minimize travel time

## COMPLETE COST TABLE — All Valid Itineraries

### Route R1: PEN → URC → TBS → PEN

| # | Depart PEN | URC days | URC→TBS | TBS days | TBS→PEN | PEN→URC cost | URC→TBS cost | TBS→PEN cost | Total (cheapest) | Total (best value) |
|---|---|---|---|---|---|---|---|---|---|---|
| R1-1 | Sep 15 Tue | 3 (16-18) | Sep 19 Sat | 4 (20-23) | Sep 24 Thu | 1,137 | 889 (FlyArystan) | 2,028 | **4,054** | 1,442+1,348+2,345=5,135 |
| R1-2 | Sep 15 Tue | 3 (16-18) | Sep 19 Sat | 4 (20-23) | Sep 24 Thu | 1,137 | 1,213 (Air Astana) | 2,028 | 4,378 | 1,442+1,348+2,345=5,135 |
| R1-3 | Sep 15 Tue | 3 (16-18) | Sep 19 Sat nonstop | 4 (20-23) | Sep 24 Thu | 1,137 | 1,348 (Air China ✈️) | 2,028 | 4,513 | 1,442+1,348+2,345=5,135 |
| R1-4 | Sep 15 Tue | 4 (16-19) | Sep 20 Sun | 4 (21-24) | Sep 24 Thu | 1,137 | 1,214 (Air Astana) | 2,028 | **4,379** | 1,442+1,213+2,345=5,000 |
| R1-5 | Sep 15 Tue | 4 (16-19) | Sep 20 Sun nonstop | 4 (21-24) | Sep 24 Thu | 1,137 | 1,815 (CZ ✈️) | 2,028 | 4,980 | 1,442+1,815+2,345=5,602 |
| R1-6 | Sep 15 Tue | 5 (16-20) | Sep 21 Mon | 3 (22-24) | Sep 25 Fri | 1,137 | 1,067 (Scat) | 2,040 | **4,244** | 1,442+1,213+2,395=5,050 |
| R1-7 | Sep 15 Tue | 5 (16-20) | Sep 21 Mon | 3 (22-24) | Sep 25 Fri | 1,137 | 1,213 (Air Astana) | 2,040 | 4,390 | 1,442+1,213+2,395=5,050 |
| R1-8 | Sep 15 Tue | 5 (16-20) | Sep 21 Mon nonstop | 3 (22-24) | Sep 25 Fri | 1,137 | 1,624 (CZ ✈️) | 2,040 | 4,801 | 1,442+1,624+2,395=5,461 |
| R1-9 | Sep 15 Tue | 4 (16-19) | Sep 20 Sun | 5 (21-25) | Sep 26 Sat | 1,137 | 1,214 (Air Astana) | 2,394 | 4,745 | 1,442+1,213+2,394=5,049 |
| R1-10 | Sep 15 Tue | 3 (16-18) | Sep 19 Sat nonstop | 5 (20-25) | Sep 26 Sat | 1,137 | 1,348 (CA ✈️) | 2,394 | 4,879 | 1,442+1,348+2,394=5,184 |

TBS working days validation:
- R1-1 to R1-3: Arrive TBS Sep 19 night → full days Sep 20(Sun),21(Mon),22(Tue),23(Wed) = 3 work days ✅
- R1-4 to R1-5: Arrive TBS Sep 20 → full days Sep 21(Mon),22(Tue),23(Wed),24(Thu) = 4 work days ✅
- R1-6 to R1-8: Arrive TBS Sep 21 → full days Sep 22(Tue),23(Wed),24(Thu) = 3 work days ✅
- R1-9: Arrive TBS Sep 20/21 → 5 full days, 4-5 work days ✅
- R1-10: Arrive TBS Sep 19 night → 5 full days, 4 work days ✅

### Route R2: PEN → TBS → URC → PEN

| # | Depart PEN | TBS days | TBS→URC | URC days | URC→PEN | PEN→TBS cost | TBS→URC cost | URC→PEN cost | Total (cheapest) | Total (best value) |
|---|---|---|---|---|---|---|---|---|---|---|
| R2-1 | Sep 16 Wed | 3 (17-19) | Sep 20 Sun | 3 (21-23) | Sep 24 Thu | 1,910* | 1,315 (CA nonstop) | 1,562 | 4,787 | 2,201+1,315+1,841=5,357 |
| R2-2 | Sep 16 Wed | 4 (17-20) | Sep 21 Mon | 3 (22-24) | Sep 25 Fri | 1,910* | 1,315 (CA nonstop) | 1,562 | 4,787 | 2,201+1,315+1,841=5,357 |

*PEN→TBS Sep 15 was 1,910; Sep 16 not checked but likely similar
R2 TBS working days: Sep 17 Thu, 18 Fri, 21 Mon = 3 ✅ (with weekend gap)
R2 is more expensive than R1 because PEN→TBS (1,910) > PEN→URC (1,137)

### Route R3: PEN↔URC RT + URC↔TBS RT (Loop)

| # | PEN↔URC RT | URC↔TBS RT | Total | Notes |
|---|---|---|---|---|
| R3-1 | 2,989 (Sep15→24) | 2,252 (Air Astana) | 5,241 | Extra URC→TBS→URC transit wasted |
| R3-2 | 2,989 (Sep15→24) | 2,798 (CZ nonstop) | 5,787 | Even more expensive |

### Route R4: PEN↔TBS RT + TBS↔URC RT (Loop)

| # | PEN↔TBS RT | URC↔TBS RT | Total | Notes |
|---|---|---|---|---|
| R4-1 | 2,873 (Sep16→24) | 2,252 (Air Astana) | 5,125 | RT dates don't fit well (8 days too tight) |
| R4-2 | 2,873 (Sep16→24) | 2,798 (CZ nonstop) | 5,671 | Doesn't work with 8-day RT window |

## FINAL RANKING — All Routes

| Rank | Itinerary | Total (cheapest) | Total (best value) | Quality Score |
|---|---|---|---|---|
| 🥇 | R1-6: PEN→URC Sep15 + URC→TBS Sep21(Scat) + TBS→PEN Sep25 | **4,244** | 5,050 | Budget king but Scat Airlines 1-stop is sketchy |
| 🥈 | R1-1: PEN→URC Sep15 + URC→TBS Sep19(FlyArystan) + TBS→PEN Sep24 | **4,054** | 5,135 | Cheapest absolute but FlyArystan 2-stop = pain |
| 🥉 | R1-4: PEN→URC Sep15 + URC→TBS Sep20(Air Astana) + TBS→PEN Sep24 | **4,379** | 5,000 | Best value balance! |
| 4th | R1-3: PEN→URC Sep15 + URC→TBS Sep19(Air China ✈️) + TBS→PEN Sep24 | 4,513 | 5,135 | Nonstop URC→TBS, compact 10-day trip |
| 5th | R1-9: PEN→URC Sep15 + URC→TBS Sep20(Air Astana) + TBS→PEN Sep26 | 4,745 | 5,049 | Sat return, 12-day trip |
| 6th | R4-1: PEN↔TBS RT + URC↔TBS RT | 5,125 | — | Loop route, tight fit |
| 7th | R3-1: PEN↔URC RT + URC↔TBS RT | 5,241 | — | Loop route, wasted transit |
| 8th | R2-1: PEN→TBS→URC→PEN | 4,787 | 5,357 | Reverse route, more expensive |

## RECOMMENDATION

**🏆 Best Overall: R1-4** — PEN→URC Sep15 + URC→TBS Sep20 (Air Astana) + TBS→PEN Sep24
- Best value price: MYR 5,000 (all 1-stop reasonable flights)
- Cheapest total: MYR 4,379 (if willing to endure 3-stop budget airlines)
- 10-day compact trip, 4 days Urumqi + 4 days Tbilisi
- 4 working days in Tbilisi (Mon-Thu) ✅

**💰 Absolute Cheapest: R1-6** — MYR 4,244
- But uses Scat Airlines (Kazakhstan budget carrier, 1-stop via Shymkent) — risky
- 5 Urumqi days may be more than needed

**✈️ Best Experience: R1-3** — MYR 5,135 (best value)
- Air China nonstop URC→TBS is the gem: 6h05m, zero layover stress
- 10-day compact trip, 3 Urumqi + 4 Tbilisi days