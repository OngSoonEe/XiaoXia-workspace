# Multi-Destination Flight Optimization Model

## Problem Definition
- **Home node:** PEN (Penang)
- **Must-visit nodes:** URC (Urumqi), TBS (Tbilisi)
- **Date range:** Sep 15 – Oct 31, 2026
- **Stay constraints:**
  - URC: 3-4 full days (excluding flight arrival day)
  - TBS: 3 full days minimum, MUST include ≥3 working days (Mon-Fri)
- **Objective:** Minimize total flight cost + minimize total travel time (pareto)

## Graph Structure
All possible directed edges (flight legs) between {PEN, URC, TBS}:
- PEN→URC, PEN→TBS (outbound from home)
- URC→TBS, URC→PEN (from Urumqi)
- TBS→URC, TBS→PEN (from Tbilisi)

## Possible Route Topologies (all Hamiltonian paths visiting all 3 cities)

### Open-chain routes (A→B→C→D, no backtracking):
- Route 1: PEN → URC → TBS → PEN
- Route 2: PEN → TBS → URC → PEN

### Loop routes (with one backtracking leg — only if cheaper):
- Route 3: PEN → URC ↔ TBS (round-trip side-trip) → PEN
- Route 4: PEN → TBS ↔ URC (round-trip side-trip) → PEN

These are the ONLY possible topologies. Any valid itinerary is an instance of one of these 4.

## Decision Variables
For each route, we need to pick:
1. **Departure date** from PEN (within Sep 15 - Oct 31)
2. **URC stay duration** (3 or 4 full days)
3. **TBS stay duration** (≥3 full days, must cover ≥3 working days)
4. **Inter-city flight choice** (cheapest vs fastest vs nonstop)

## Data Needed (Systematic Grid)
For each edge × each viable date, we need: {price, duration, stops}

### Edge 1: PEN→URC (one-way prices by date)
| Date | Day | Cheapest OW | Best OW | Source |
|---|---|---|---|---|
| Sep 15 | Tue | 1,137 | 1,442 (Shanghai Airlines) | Trip.com |
| Sep 8 | Tue | 1,060 | TBD | Trip.com recommended |

### Edge 2: PEN→TBS (one-way prices by date)
| Date | Day | Cheapest OW | Best OW | Source |
|---|---|---|---|---|
| Sep 15 | Tue | 1,910 | 2,138 (Batik+AirArabia) | Trip.com |

### Edge 3: URC→TBS (one-way prices by date)
| Date | Day | Cheapest OW | Nonstop OW | Source |
|---|---|---|---|---|
| Sep 19 | Sat | 889 (FlyArystan 2-stop) | 1,348 (Air China) / 1,624 (China Southern) | Trip.com |
| Sep 20 | Sun | 1,214 (Air Astana 1-stop) | 1,815 (China Southern) | Trip.com/Google |

### Edge 4: TBS→URC (one-way prices by date)
| Date | Day | Cheapest OW | Nonstop OW | Source |
|---|---|---|---|---|
| Oct 15 | Thu | 1,219 (Air China nonstop!) | 1,219 | Trip.com |

### Edge 5: URC→PEN (one-way prices by date)
| Date | Day | Cheapest OW | Best OW | Source |
|---|---|---|---|---|
| Oct 25 | Sun | 1,327 (China Eastern) | 2,270 (China Southern via CAN) | Trip.com |

### Edge 6: TBS→PEN (one-way prices by date)
| Date | Day | Cheapest OW | Best OW | Source |
|---|---|---|---|---|
| Sep 24 | Thu | 2,028 (AirArabia+AirAsia 3-stop) | 2,345 (Flydubai via DXB) | Trip.com |
| Sep 26 | Sat | 2,394 (Flydubai via DXB) | 2,394 | Trip.com |

### Round-trip prices (for loop routes)
| Edge | Dates | RT Price | Source |
|---|---|---|---|
| PEN↔URC | Sep15→Sep27 | 3,328 (CQ+CS) | Google Flights |
| PEN↔URC | Sep15→Sep24 | 2,989 (cheapest) | Google Flights date grid |
| PEN↔TBS | Sep15→Sep26 | 3,258 (Batik+flydubai) | Google Flights |
| URC↔TBS | Sep20→Sep26 | 2,252 (Air Astana) / 2,798 (CS nonstop) | Google Flights |

## Constraint Validation
For TBS ≥3 working days:
- Arrive TBS on or before Thu → can fit 3 working days (Fri+Mon+Tue minimum)
- Best: arrive Sun/Mon to maximize working days in short stay
- AVOID arriving Fri/Sat (would need to stay until following Wed+ to get 3 working days)

## Analysis Strategy
1. For each route topology, enumerate date combinations
2. For each combination, calculate total cost and total travel time
3. Filter by stay constraints
4. Rank by cost (primary) and travel time (secondary)
5. Present top 3 options across ALL topologies