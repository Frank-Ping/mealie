# Public projection and omission record

The original internal evidence package is preserved separately. The public evidence files are projections prepared after the failed historical experiment. No original code, result log or counter boundary has been edited to improve the outcome.

- **Removed provider account state:** credit/balance, plan/entitlement, reset and rate-limit metadata. Numeric token counters, phase/time boundaries and arithmetic remain. Tokens are not billed fees.
- **Removed platform/connector metadata:** connector/plugin attribution, internal message passthrough, retained-source revisions, UI metadata and unrelated annotations. Visible user/assistant text and tool records remain under an explicit allowlist.
- **Excluded hidden content:** raw system/developer instructions, internal reasoning and platform turn-context/session records. No complete unfiltered session export is published.
- **Normalized private paths:** workstation home, OneDrive workspace, WSL mount/temporary copy, bundled runtime and private session-log paths use documented placeholders. Relative repository paths and historical workflow labels remain when useful.
- **Excluded redundant containers:** portable bare Git, commit-object dumps, patch duplicates, endpoint ZIP, snapshot TARs, caches and dependencies. Actual historical commits are exposed directly by the publication repository.
- **Omitted duplicate logs:** selected final runs and informative earlier failed attempts are included; repeated `previous-latest` copies and unrelated preparation logs are omitted. Absence of a duplicate is not recorded as a missing historical execution.
- **Retained original-language prompts:** wording is Chinese as sent during the experiment, with path redactions. English translations are retrospective and were not prompts supplied during execution.
- **Retained historical findings:** unsupported sample outcomes, provisional exports, failed attempts and post-stop defects remain. Completed counter exports supersede provisional values; both versions are explicitly distinguished rather than added.

The manifest records both the original source SHA256 and the public SHA256. Path redaction, structured projection, Markdown-link adaptation and public-index adaptation necessarily change hashes. Public files must not be described as unmodified originals.

Original Git commits also retain their recorded authors, commit messages and some historical workstation-path references. The actual commit identities cannot be preserved if that commit content is rewritten. This evidence subset reduces private metadata exposure without claiming to retroactively sanitize the original commit history.

The preparation scan found no common live credential patterns in the selected public content. It is a pattern check, not a guarantee about every possible credential form. Test/example auth names and metadata-field names appearing in historical code are not treated as actual private account values.
