# Fresh WF6 Vue baseline / 新 Vue 基线

Gate: PASS. 原生目录完整重测通过，首轮失败保留。

Vue `4b9ca06b6581f7152e164ea0fd9d4da366975a79`; evaluator `758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d`; build `51e1fc21edd74fdb002a57a5e11b8085932a0898945685edb45177aece86d733`.

Unit 517/517; lint 521 files clean; type diagnostics 318 separately FAIL.

| Category / 类别 | Mounted first attempt / 首轮 | Native runtime / 重测 |
|---|---|---|
| routes | 0/66 pass; 66 fail; 0 skip | 66/66 pass; 0 fail; 0 skip |
| flows | 1/15 pass; 14 fail; 0 skip | 15/15 pass; 0 fail; 0 skip |
| guard | 1/1 pass; 0 fail; 0 skip | 1/1 pass; 0 fail; 0 skip |

Coverage: statements 15.1%, branches 12.89%, functions 7.9%, lines 15.09%.

[Full bilingual result and raw evidence](../../../../wf6-evidence/steps/S1/result.md). Original logs, auth, databases and browser traces stay outside Git.
完整双语结果与失败历史见兄弟证据目录；无 React 成果，未启动 S2。
