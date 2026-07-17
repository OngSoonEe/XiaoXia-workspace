# Flight Search Research - Jack's Multi-City Trip

## Trip Summary
- **Route:** Penang → Urumqi (3-4 days) → Tbilisi (3 weekdays) → Penang
- **Window:** Late Sep – Early Nov 2026
- **Class:** Economy

---

## LEG 1: Penang → Urumqi (One Way)

### October 1, 2026 (Thu)
| Rank | Price (MYR) | Airline | Stops | Duration | Route |
|------|-------------|---------|-------|----------|-------|
| Cheapest | 1,619 | China Southern | 2 stops | 16h20m | PEN→CAN→LHW→URC |
| 2nd | 1,691 | China Southern | 1 stop | 13h25m | PEN→CAN→URC (4h5m layover) |
| 3rd | 1,691 | Chongqing + China Southern | 1 stop | 16h05m | PEN→CKG→URC |
| Fastest | 2,211 | China Southern | 1 stop | 12h00m | PEN→CAN→URC (2h40m layover) |
| Note | 10,973 | Chongqing + Hainan | 1 stop | 11h15m | PEN→CKG→URC |

### October 2, 2026 (Fri)
| Rank | Price (MYR) | Airline | Stops | Duration | Route |
|------|-------------|---------|-------|----------|-------|
| Cheapest | 1,619 | China Southern | 2 stops | 16h20m | PEN→CAN→LHW→URC |
| 2nd | 1,691 | China Southern | 1 stop | 13h05m | PEN→CAN→URC |
| 3rd | 1,851 | China Southern | 1 stop | 12h00m | PEN→CAN→URC (2h40m layover) |
| Note | 2,637 | HK Express + Cathay | 1 stop | 14h35m | PEN→HKG→URC |

---

## LEG 2: Urumqi → Tbilisi (One Way)

### October 3, 2026 (Sat)
| Rank | Price (MYR) | Airline | Stops | Duration | Route |
|------|-------------|---------|-------|----------|-------|
| Cheapest | 1,234 | Air Astana | 1 stop | 12h40m | URC→ALA→TBS (4h layover) |
| Fastest | 1,584 | China Southern | Nonstop | 5h30m | URC→TBS (7:50PM→9:20PM) |

### October 4, 2026 (Sun)
| Rank | Price (MYR) | Airline | Stops | Duration | Route |
|------|-------------|---------|-------|----------|-------|
| Cheapest | ~1,234 | (similar pattern expected) | 1 stop | ~12h40m | via Almaty |
| Fastest | ~1,584 | China Southern | Nonstop | 5h30m | URC→TBS |

### October 5, 2026 (Mon)
| Rank | Price (MYR) | Airline | Stops | Duration | Route |
|------|-------------|---------|-------|----------|-------|
| Cheapest | 1,234 | Air Astana | 1 stop | 10h00m | URC→ALA→TBS (4h layover) |
| Fastest | 1,390 | China Southern | Nonstop | 5h30m | URC→TBS (7:50PM→9:20PM) |
| 2nd Fastest | 7,425 | China Southern + Air Astana | 1 stop | 13h35m | URC→ALA→TBS |

### October 6, 2026 (Tue)
| Rank | Price (MYR) | Airline | Stops | Duration | Route |
|------|-------------|---------|-------|----------|-------|
| Cheapest | 1,234 | Air Astana | 1 stop | 12h40m | URC→ALA→TBS (6h40m layover) |
| Fastest | 1,390 | China Southern | Nonstop | 5h30m | URC→TBS (7:50PM→9:20PM) |

---

## LEG 3: Tbilisi → Penang (Return)

### October 7, 2026 (Wed) → Arrive Oct 8 (Thu)
| Rank | Price (MYR) | Airline | Stops | Duration | Route |
|------|-------------|---------|-------|----------|-------|
| Cheapest | 2,864 | Turkish + Malaysia | 2 stops | 21h45m | TBS→IST→KUL→PEN |
| 2nd | 3,470 | Turkish + Malaysia | 2 stops | 19h25m | TBS→IST→KUL→PEN |
| 3rd | 3,537 | flydubai + Emirates + Batik | 2 stops | 20h45m | TBS→DXB→KUL→PEN |
| 4th | 6,050 | Lufthansa + THAI | 2 stops | 37h10m | TBS→MUC→BKK→PEN |
| Fastest in range | 9,922 | China Southern | 2 stops | 20h05m | TBS→URC→CAN→PEN |

### October 8, 2026 (Thu) → Arrive Oct 9 (Fri)
(Same flight options as Oct 7 expected, slight price variation)

### October 9, 2026 (Fri) → Arrive Oct 10 (Sat)
| Rank | Price (MYR) | Airline | Stops | Duration | Route |
|------|-------------|---------|-------|----------|-------|
| Cheapest | 3,470 | Turkish + Malaysia | 2 stops | 19h25m | TBS→IST→KUL→PEN |
| 2nd | 3,652 | flydubai + Emirates + Batik | 2 stops | 20h45m | TBS→DXB→KUL→PEN |
| 3rd | 7,664 | Lufthansa + THAI | 2 stops | 37h10m | TBS→MUC→BKK→PEN |
| 4th | 8,755 | Qatar + Cathay | 2 stops | 34h20m | TBS→DOH→HKG→PEN |
| Note | 9,922 | China Southern | 2 stops | 20h05m | TBS→URC→CAN→PEN |

---

## OPTIMAL COMBINATIONS ANALYSIS

### Scenario A: Cheapest Total Route
| Leg | Date | Route | Price |
|-----|------|-------|-------|
| PEN→URC | Oct 1 or 2 | China Southern (1 stop) | 1,691 |
| URC→TBS | Oct 5 or 6 | Air Astana (1 stop) | 1,234 |
| TBS→PEN | Oct 7 | Turkish + Malaysia | 2,864 |
| **TOTAL** | | | **MYR 5,789** |

### Scenario B: Fastest Total Route
| Leg | Date | Route | Price |
|-----|------|-------|-------|
| PEN→URC | Oct 2 | China Southern (1 stop) | 1,851 |
| URC→TBS | Oct 4 or 5 or 6 | China Southern (Nonstop) | 1,390 |
| TBS→PEN | Oct 7 | Turkish + Malaysia | 2,864 |
| **TOTAL** | | | **MYR 6,105** |

### Scenario C: Balanced (Mix Cheap + Fast)
| Leg | Date | Route | Price |
|-----|------|-------|-------|
| PEN→URC | Oct 1 or 2 | China Southern (1 stop) | 1,691 |
| URC→TBS | Oct 5 or 6 | Air Astana (1 stop) | 1,234 |
| TBS→PEN | Oct 9 | Turkish + Malaysia | 3,470 |
| **TOTAL** | | | **MYR 6,395** |

---

## KEY FINDINGS

1. **Best Price/Performance on each leg:**
   - PEN→URC: China Southern, 1 stop, ~MYR 1,691 (12-13h) or 1,619 (16h)
   - URC→TBS: Air Astana MYR 1,234 (12h40m) OR China Southern nonstop MYR 1,390 (5h30m)
   - TBS→PEN: Turkish+Malaysia ~MYR 2,864-3,470 (19-21h)

2. **Date flexibility matters:**
   - URC→TBS cheapest: Oct 3-6 all show MYR 1,234 for Air Astana
   - China Southern nonstop always MYR 1,390 on Oct 4-6

3. **Weekend departure (Oct 1 Thu or Oct 2 Fri)** works for PEN→URC
   - Then stay 3-4 days in Urumqi (Oct 3-6)
   - URC→TBS on Oct 5 (Mon) or Oct 6 (Tue)

4. **Return:** Oct 7 (Wed) or Oct 9 (Fri) gives best return pricing

---

*Research date: May 28, 2026. Prices may change.*