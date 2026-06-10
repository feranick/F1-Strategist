# F1-Strategist
Tire & Setup Strategy assistant for EA SPORTS F1 25 (Formula 1 and Formula 2 classes).

<div align="center">
  <img src="images/F1-Strategist.png" alt="F1 Strategist screenshot" style="width:50%; height:auto;">
</div>

App: https://feranick.github.io/F1-Strategist

## Features
- Pit-stop and tire-compound strategy for all 24 tracks on the 2025 calendar
- Tire degradation telemetry chart with pit-window threshold
- Qualifying run plans
- Baseline setup guide (aero, suspension, brakes, diff, pressures)
- Installable PWA with offline support

## Notes
- Lap counts are official F1 Grand Prix race distances. For F2 sessions
  (which run shorter races), enter the session length in **Manual Laps**.
- To ship an update, bump `APP_VERSION` in `index.html` — this busts the
  service-worker cache automatically.
