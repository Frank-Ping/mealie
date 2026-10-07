# Checkpoints

One row per measured checkpoint. Measurement command:
`./rewrite-evidence/measure.sh --app <app-dir> --label <label> [--skip-e2e]`
(commit before measuring; `dirty=1` rows are not valid checkpoints)

| commit sha | label | measure run_id | routes | flows | tsc | lint | unit | build | any | todo | expect | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| aaa5a8cf6 | P0-vue-baseline | 20260929T231339Z-frontend-P0-vue-baseline | 66/66 | 15/15 | 315 | 0 | 517/0 | OK 60s | 88 | 16 | 817/48 | Vue reference, row 0 |
| (this commit) | WF4-P3-full-run | n/a — tsc via npx on Windows; measure.sh pending WSL | — | — | **274** (burndown start) | — | — | expected 0 | — | — | — | 324/324 codemod-converted; TS1109×91 TS1005×60 TS1128×42 TS1135×22 TS17002×17 TS1381×12 |
