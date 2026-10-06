# Checkpoints

One row per measured checkpoint. Measurement command:
`./rewrite-evidence/measure.sh --app <app-dir> --label <label> [--skip-e2e]`
(commit before measuring; `dirty=1` rows are not valid checkpoints)

| commit sha | label | measure run_id | routes | flows | tsc | lint | unit | build | any | todo | expect | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| aaa5a8cf6 | P0-vue-baseline | 20260929T231339Z-frontend-P0-vue-baseline | 66/66 | 15/15 | 315 | 0 | 517/0 | OK 60s | 88 | 16 | 817/48 | Vue reference, row 0 |
