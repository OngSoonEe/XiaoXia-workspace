# Systematic Flight Optimization — All Routes Enumerated

## CONSTRAINTS
- URC stay: 3-4 full days (arrival day doesn't count)
- TBS stay: ≥3 full days, must include ≥3 working days (Mon-Fri)
- Date range: Sep 8 - Oct 31, 2026
- Minimize: total cost (primary), total travel time (secondary)

## ROUTE TOPOLOGIES

### R1: PEN → URC → TBS → PEN (open chain A)

Valid date combos (URC 3-4 days, TBS ≥3 days with ≥3 workdays):

**Depart PEN Sep 8 Tue:**
- Arrive URC Sep 8-9 (depending on flight)
- URC full days: Sep 9,10,11 (3d) or Sep 9-12 (4d)
- URC→TBS depart: Sep 12 Sat or Sep 13 Sun
- TBS full days: need ≥3 work days
  - If arrive Sep 13 Sun: work days Mon 14, Tue 15, Wed 16 = 3 ✅ depart Sep 17+ 
  - TBS→PEN: Sep 17 Thu onward
- Problem: No URC→TBS data for Sep 12/13. Need to check.

**Depart PEN Sep 15 Tue (most data available):**
- Arrive URC Sep 15-16
- URC full days: Sep 16,17,18 (3d) or Sep 16-19 (4d)
- URC→TBS depart: Sep 19 Sat or Sep 20 Sun
- If depart URC Sep 19 (Air China nonstop, dep 19:00, arr TBS 21:05):
  - TBS full days start: Sep 20 Sun
  - Work days: Mon 21, Tue 22, Wed 23 = 3 ✅
  - Can depart TBS: Sep 24 Thu
  - Total trip: Sep 15-24 (10 days)
  - COST: 1,137 (PEN→URC cheapest) + 1,348 (URC→TBS nonstop) + 2,028 (TBS→PEN cheapest) = 4,513
  - BETTER VALUE: 1,442 + 1,348 + 2,345 = 5,135 (better flights, same dates)
  
- If depart URC Sep 20 (Air Astana 1-stop, dep ~11:00, arr TBS ~17:40):
  - TBS full days: Sep 21 Mon, 22 Tue, 23 Wed = 3 work days ✅
  - Can depart TBS: Sep 24 Thu or Sep 26 Sat
  - COST (Sep 24 return): 1,137 + 1,214 + 2,028 = 4,379 ← CHEAPEST ONE-WAY!
  - COST (better flights): 1,442 + 1,214 + 2,345 = 5,001
  - COST (Sep 26 Sat return): 1,137 + 1,214 + 2,394 = 4,745
  - COST (better flights): 1,442 + 1,214 + 2,394 = 5,050

### R2: PEN → TBS → URC → PEN (open chain B)

**Depart PEN Sep 15 Tue:**
- PEN→TBS: 1,910 cheapest / 2,201 best value
- Arrive TBS Sep 15-16
- TBS stay: need ≥3 work days. If arrive Sep 16 Wed: Thu 17, Fri 18, Mon 21 = need to stay until Mon 21 at least
  - That's 6 days in TBS. Or arrive earlier...
- PEN→TBS Sep 8 Tue: arrive Sep 9, work days Wed 9, Thu 10, Fri 11 ✅ (3 work days in 3 days!)
  - Depart TBS Sep 12 Fri (or Sat 13)
  - TBS→URC: need data for Sep 12/13
  - URC stay 3-4 days
  - URC→PEN: depart ~Sep 16-18
  - Problem: missing data for TBS→URC Sep 12/13 and URC→PEN Sep 16-18

**Depart PEN Sep 16 Wed (Google Flights cheapest RT PEN↔TBS):**
- PEN→TBS RT Sep 16→24: MYR 2,873 ← interesting!
- But this is a round-trip to TBS only. We still need URC.

### R3: PEN → URC → TBS → URC → PEN (loop: base URC, side-trip TBS)

This is: PEN↔URC round-trip + URC↔TBS round-trip
- PEN↔URC RT: 2,989 (cheapest)
- URC↔TBS RT: 2,252 (Air Astana) or 2,798 (nonstop)
- Total: 2,989 + 2,252 = 5,241 (Air Astana) / 2,989 + 2,798 = 5,787 (nonstop)
- Stay constraints:
  - URC base: 3-4 full days around the TBS side-trip
  - TBS side-trip: 3+ days, 3+ work days
  - Example: PEN→URC Sep15, URC 16-19 (4d), URC→TBS Sep20, TBS 21-26 (6d, 5 work days), TBS→URC Sep26, URC→PEN Sep27
  - Total: 2,989 + 2,252 = 5,241 with 2 extra transit days
- PROBLEM: Wastes 1-2 days on return URC transit. More expensive than open chain.

### R4: PEN → TBS → URC → TBS → PEN (loop: base TBS, side-trip URC)

This is: PEN↔TBS round-trip + TBS↔URC round-trip  
- PEN↔TBS RT: 2,873 (Sep16→24 cheapest)
- URC↔TBS RT: same as above
- Total: 2,873 + 2,252 = 5,125 (Air Astana) / 2,873 + 2,798 = 5,671 (nonstop)
- But PEN↔TBS Sep16→24 = 8 days, and we need TBS side-trip within that
- Very tight. URC would need to be a quick 3-4 day hop in the middle
- Example: PEN→TBS Sep16, TBS 17-20 (4d), TBS→URC Sep21?, URC 22-24 (3d), URC→TBS Sep25, TBS→PEN Sep26?
- This doesn't fit well — the RT return date is fixed at Sep24
- NOT PRACTICAL with the 8-day RT window

## OPTIMAL SOLUTIONS RANKED

| Rank | Route | Dates | Legs | Total (cheapest) | Total (best value) |
|------|-------|-------|------|------------------|-------------------|
| 🥇 | R1 | Sep15→24 | PEN→URC + URC→TBS + TBS→PEN | MYR 4,379 | MYR 5,001 |
| 🥈 | R1 | Sep15→26 | Same + Sat return | MYR 4,745 | MYR 5,050 |
| 🥉 | R3 | Sep15→27 | PEN↔URC RT + URC↔TBS RT | MYR 5,241 | MYR 5,787 |
| 4th | R1 | Sep15→24 nonstop URC→TBS | PEN→URC + URC→TBS(nonstop) + TBS→PEN | MYR 4,513 | MYR 5,135 |

## KEY INSIGHTS
1. **R1 (PEN→URC→TBS→PEN) dominates** — cheapest topology by ~MYR 500+
2. **R2 (PEN→TBS→URC→PEN) is more expensive** — PEN→TBS costs MYR 1,910 vs PEN→URC MYR 1,137
3. **Loop routes (R3, R4) add unnecessary transit** — 4 flight legs vs 3, no cost savings
4. **Cheapest overall: MYR 4,379** — but uses worst flights (3-stop, long layovers)
5. **Best value: MYR 5,001-5,050** — reasonable 1-stop flights, nonstop option for URC→TBS

## UNEXPLORED OPTIONS
- Depart PEN Sep 8 (earlier Tuesday) — could be cheaper but needs URC→TBS data for Sep 12-13
- October departures — different pricing season
- TBS→PEN Oct dates — might be cheaper
- URC→PEN earlier dates (Sep 22, 23) — for tighter Route 2