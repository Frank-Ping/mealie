# WF6 S0 result / S0 结果

Gate: **PASS — isolation, frozen snapshots and accounting only / 仅隔离、冻结快照与计量准备通过**.

Run ID: wf6-rerun-20261014-01. Actual user START is in [REDACTED]; provider line 104,
byte offset 886375, session 01a137ea-f571-70f0-8cf3-7b8560c420bf,
turn 01a137f3-c2d3-7db0-9623-6d33961b39eb. The pre-request attributed event is
line 94. Initialization remains preparation, separately accounted. Old run and
desktop troubleshooting are not inherited as new-run usage.
实际 START 请求、会话、turn 与前置累计事件已定位；初始化、旧 run 与桌面排障单列。

## Completed / 实际完成

- Source 4b9ca06b6581f7152e164ea0fd9d4da366975a79; evaluator
  758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d. Independent stores, source branch
  rewrite/wf6-route-coexistence, no remotes or alternates. Every imported commit,
  tree and blob ID was recomputed and compared with the historical origin store;
  every frozen file/symlink matched its Git blob. Original repositories unchanged.
  固定来源、独立存储及所有对象/文件已核实；旧仓库保持不变。
- Old missing-parent failures were reproduced and retained. New stores explicitly
  declare pinned shallow roots; git show and git fsck --full --strict pass.
  原父对象缺失报错已复现保留；新仓库声明 shallow 边界后 show/fsck 通过。
- Original AGENTS.md prefix preserved; full common contract and approved rerun/CLI
  overrides recorded. Independent data/auth/browser/output paths and port probes.
  原开发约定保留，共同契约与新 run 决定记录；运行目录与端口核查独立。
- New collector and command recorder; 24 accounting fault-injection tests pass
  with no failure/error/skip. Both actual CLI finalize interfaces are verified.
  新 collector/命令记录器完成；24 项计量故障注入检查通过，实际 CLI 接口已验证。

## Limits / 限制

This validates exact frozen snapshots, not full ancestor history or upstream
authenticity. Parent objects remain unavailable; no historical repository was
repaired or reset. The old source checkout HEAD differs from its old S0 snapshot;
that HEAD was not used. Source provenance and integrity logs are in input-provenance.
验证的是固定快照，非完整祖先历史或 upstream 身份；旧 HEAD 未作为新 run 输入。

No application dependencies, builds, baseline, database seed, credentials, browser
context or services were initialized. Linux Node/uv are unavailable on the Ubuntu PATH; Windows npm is found but
fails with an unsupported-WSL/install-directory message; dependency preparation belongs to S1 and is separately timed.
Sandbox socket creation was denied; port bindability remains unverified and no port is reserved. S2–S6 budget is unstarted.
未安装依赖或执行应用验收；Ubuntu PATH 未找到 Linux Node/uv；Windows npm 虽存在但执行失败，后续依赖准备单列。
sandbox 拒绝创建 socket，端口可绑定性未验证且未预留；S2–S6 预算未开始。

Raw streams remain in sibling evidence. Bootstrap commands before the recorder
have original provider tool events and available merged output; missing separate
stream/timing fields are null, not reconstructed. Shareable transcript excludes
hidden reasoning and system/developer messages. Original output is not translated
in place. Financial cost, application coverage and human review time: not provided.
原始日志保持原文；记录器前的工具输出保留可取得的原始内容，缺字段不补造。
无隐藏推理/系统指令导出；费用、应用 coverage 与人工 review 时间未提供。

The collector is deliberately bound to this verified CLI session. New-session or
fork data need explicit rebinding; unexplained resets, gaps, foreign identity and
repeated START remain partial. Preparation's first cumulative boundary is absent;
known response sums are disclosed separately rather than an exact claim.
collector 绑定核实的 CLI 会话；新会话需显式绑定，缺口与歧义保持 partial。

## Evidence and next step / 证据与下一步

See ../../EVIDENCE_INDEX.md, input-provenance.json, collector-acceptance.json,
source-state.json, file-manifest.json, attempts.jsonl and logs/. Actual preparation
commit and clean states are in source-state.json; the frozen starting SHA is not
presented as the final acceptance snapshot.
实际提交与源码状态见 source-state；起始 SHA 不冒充验收快照。

Stop after S0. Await a separate S1 request / S0 后停止，等待单独授权 S1。
Pre-reply usage is provisional with final_reply_included=false. Finalize externally
after this reply, or settle at the next authorized step.
回复前计量 provisional，最后回复待终端或下一授权步骤结算。

<!-- WF6-USAGE -->
## Provider usage / Provider 用量

Status: exact_reported; final_reply_included=True

input_tokens=3083201 | cached_input_tokens=3014528 | cache_write_input_tokens=0 | output_tokens=37993 | reasoning_output_tokens=8014 | total_tokens=3121194

Authoritative source: token-usage.json and ../../usage/usage-ledger.json. Values replace earlier exports, never add to them.
