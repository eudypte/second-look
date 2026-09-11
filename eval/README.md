# Evaluation data

These files provide fixed, readable evaluation inputs for Second Look.
They cover suspicious-message classification and deterministic link checks without mixing the scoring code into the data-preparation step.

## Files

| File | Records | Purpose |
| --- | ---: | --- |
| `scam-texts.jsonl` | 200 | English scam messages from the IMC 2025 smishing dataset |
| `legitimate-texts.jsonl` | 150 | Random legitimate messages from the UCI SMS Spam Collection |
| `tranco-links.jsonl` | 100 | Random lower-ranked Tranco domains used as legitimate link cases |
| `brand-links.jsonl` | 50 | Hand-curated official shipping, shopping, banking, telecom, government, account, and health links |
| `scam-review.json` | 1 review manifest | Approved source rows plus every rejected scam candidate and its reason |
| `private/phishing-links.jsonl` | 150 | A fixed sample from the September 11, 2026 OpenPhish community feed |
| `private/real-legit.jsonl` | about 50 when supplied | Redacted, consented business texts such as bank alerts, delivery updates, login codes, and appointment reminders |

The entire `private/` directory is ignored by Git.
OpenPhish URLs cannot be redistributed under the feed terms, and the real business texts may contain personal data even after redaction.
The preparation script creates `private/phishing-links.jsonl` locally but never creates or changes `private/real-legit.jsonl`.

## Record format

Every committed data file uses JSON Lines, with exactly one JSON object per line.
Text records have `text`, `label`, and `source` fields.
Link records have `url`, `label`, and `source` fields.
`sourceId` is included when the source supplies an identifier, and `sourceRow` records the original line for sources that do not supply IDs.
Extra fields such as `type`, `brand`, and `rank` preserve useful source metadata.

The owner-supplied `private/real-legit.jsonl` should use this shape:

```json
{"text":"Your redacted message","label":"legit","source":"private-real-legit","sourceId":"optional-local-id","category":"bank-alert"}
```

Names, account numbers, confirmation codes, addresses, phone numbers, and any unique identifiers should be replaced with clear placeholders before a record is added.
Suggested categories are `bank-alert`, `delivery`, `login-code`, `appointment`, and `other-business`.

## Sources, licenses, and attribution

### IMC 2025 smishing messages

`scam-texts.jsonl` comes from [Fishing for Smishing: Understanding SMS Phishing Infrastructure and Strategies by Mining Public User Reports](https://github.com/reportsmishing/Smishing-Dataset-IMC25) by Sharad Agarwal, Antonis Papasavva, Guillermo Suarez-Tangil, and Marie Vasek.
The dataset and repository materials are licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
The paper is available at [DOI 10.1145/3730567.3764431](https://doi.org/10.1145/3730567.3764431).
Preparation uses repository revision `a6175560b57387199871e51fbef6bc523d2516b4` and verifies the source file hash.
Messages retain the source dataset's redaction placeholders such as `<URL>` and `<PHONE_NUMBER>`.

### UCI legitimate messages

`legitimate-texts.jsonl` comes from Tiago Almeida and José María Gómez Hidalgo, [SMS Spam Collection](https://archive.ics.uci.edu/dataset/228/sms+spam+collection), UCI Machine Learning Repository, 2011, [DOI 10.24432/C5CC84](https://doi.org/10.24432/C5CC84).
The collection is licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
Only rows labelled `ham` by the source are eligible.
The preparation script verifies the downloaded archive hash.

### Tranco legitimate domains

`tranco-links.jsonl` uses [Tranco](https://tranco-list.eu/), a research-oriented ranking created by Victor Le Pochat, Tom Van Goethem, Samaneh Tajalizadehkhoob, Maciej Korczyński, and Wouter Joosen.
It uses permanent list `Y8YQG`, generated on September 10, 2026 from source rankings covering August 12 through September 10, 2026.
Tranco asks users to attribute its component sources: Cisco Umbrella, Majestic under CC BY 3.0, Farsight, the Chrome User Experience Report under CC BY-SA 4.0, and Cloudflare Radar under CC BY-NC 4.0.
The permanent list page documents the exact construction and attribution at [tranco-list.eu/list/Y8YQG](https://tranco-list.eu/list/Y8YQG).

### OpenPhish links

`private/phishing-links.jsonl` comes from the [OpenPhish Community Feed](https://openphish.com/phishing_feeds.html) snapshot published September 11, 2026 at 12:00 UTC.
The [OpenPhish terms](https://openphish.com/terms.html) limit the feed to personal use and prohibit making the URLs available to third parties, so no raw OpenPhish URL is committed.
The preparation script downloads the official feed snapshot, verifies its hash, and writes the sampled URLs only to the ignored private directory.

### Hand-curated links and private texts

`brand-links.jsonl` is a hand-written list of public pages on official brand and government domains.
It is not copied from a third-party dataset.
The private real-message set will be collected with consent, redacted, and kept local.

## Sampling and review

Run the zero-dependency generator from the repository root:

```sh
node eval/prepare.mjs
```

The script uses only Node.js built-in modules and the built-in `fetch` implementation.
It downloads four pinned inputs, verifies each SHA-256 hash, and rewrites every generated JSONL file except the owner-maintained `private/real-legit.jsonl`.

The scam sample uses seed `second-look-imc-2025-v1`.
It keeps English messages in six requested categories and never admits the source's `spam` category.
The quotas are 34 delivery, 34 government, 33 banking, 33 telecom, 33 wrong-number, and 33 hey-mum-or-dad messages.
Within each category, rows are shuffled, exact normalized duplicates are removed, and messages mentioning common US brands are considered before the remaining shuffled rows.

Every selected scam message was read manually.
When a sampled row was not actually a scam, the row and reason were added to `scam-review.json`, and the next eligible row in the same seeded order was reviewed as its replacement.
Sixty rows were dropped in total.
They included routine delivery, payment, authentication, subscription, and family messages; marketing and political outreach; anti-smishing warnings; a victim's fraud complaint; and fragments with no scam content.
The review manifest gives the exact reason for every dropped source row and locks the 200 approved source rows, so generation fails if the sample and the recorded decisions ever diverge.

The UCI sample shuffles all `ham` rows with seed `second-look-uci-ham-v1` and takes 150.
The Tranco sample keeps ranks 100,001 through 1,000,000, shuffles them with seed `second-look-tranco-Y8YQG-v1`, and takes 100.
The OpenPhish sample deduplicates the 300-URL snapshot, shuffles it with seed `second-look-openphish-2026-09-11-v1`, and takes 150.

## Metrics

Message catch rate is the share of scam texts rated amber or red.
Message false-alarm rate is the share of legitimate texts rated amber or red.
Report the same two metrics with red as the only positive result.
Report the false-alarm rate for UCI personal messages and the private real business texts separately, because the business texts are the harder legitimate cases.

Link catch rate is the share of phishing URLs flagged by at least one deterministic signal.
Report it overall, by signal, and without blocklists, where the last version uses only domain-age, brand-lookalike, and hosting rules.
Only aggregate OpenPhish results may be published.
