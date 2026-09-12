# Evaluation data

These files provide fixed, readable evaluation inputs for Second Look.
They cover suspicious-message classification and deterministic link checks without mixing the scoring code into the data-preparation step.

## Files

| File | Records | Purpose |
| --- | ---: | --- |
| `scam-texts.jsonl` | 200 | English scam messages from the IMC 2025 smishing dataset |
| `legitimate-texts.jsonl` | 150 | Random legitimate messages from the UCI SMS Spam Collection |
| `business-texts.jsonl` | 60 | Real US business and transactional texts quoted from the pages where each organisation published them |
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

## Business texts: the hard false-alarm set

`business-texts.jsonl` holds 60 real US business and transactional text messages, quoted from the pages where the sending organisation published them.
It exists because `legitimate-texts.jsonl` is 2012 personal chat, which is the easy case.
The messages people actually receive every week carry the same surface features a scam checker keys on: urgency, a shortened link, a dollar amount, a phone number, a reply keyword, an account or tracking number.
Twenty-two of the 60 contain a link or a bare domain and twelve name a dollar amount, so this is the set that decides whether Second Look cries wolf on a bank fraud alert, a prescription refill reminder, a login code, or a Medicaid renewal notice.

Report the false-alarm rate for this file separately from the UCI personal messages.

### Record format

```json
{"text":"...","label":"legit","category":"banking","publisher":"River City Bank","sourceUrl":"https://...","source":"business-texts-published-examples","provenance":"published-example","note":"optional"}
```

`category` is one of `delivery`, `banking`, `login-code`, `pharmacy`, `appointment`, `utility`, `travel`, and `government`.
`publisher` is the organisation that both sends and published the message.
`sourceUrl` is the page, PDF, or file the message was quoted from; every record has one.
`note` records anything that needs saying about a specific message, such as whose placeholder appears in it.

### Where every message came from

| Publisher | Records | Category | Source |
| --- | ---: | --- | --- |
| USPS | 6 | delivery | [Text Tracking FAQs](https://www.usps.com/text-tracking/welcome.htm) |
| River City Bank | 3 | banking | [Text Fraud Alert System](https://rivercitybank.com/text-fraud-alert-system/) |
| Freedom Bank (Montana) | 3 | banking | [Text alerts from Freedom Bank](https://www.freedombankmt.com/text-alerts-from-freedom-bank/) |
| Farmers and Merchants Bank | 2 | banking | [Card Text Alerts](https://www.fmbms.com/Card-Text-Alerts) |
| 7 17 Credit Union | 2 | banking | [Account Alerts](https://www.717cu.com/personal/services/account-alerts) |
| Commerce Bank | 1 | banking | [Text for Check Fraud](https://www.commercebank.com/security-center/text-for-check-fraud) |
| Centra Credit Union | 1 | banking | [Debit Card Fraud Alerts](https://www.centra.org/debit-card-fraud-alerts/) |
| Certified Federal Credit Union | 1 | banking | [Text Message Alert](https://www.certifiedfed.com/text-message-alert/) |
| Tulsa Federal Credit Union | 1 | banking | [Debit card alerts flyer (PDF)](https://www.dfcutulsa.com/DFCU-Tulsa-Debit-Card-Alerts-Flyer.pdf) |
| Login.gov (GSA) | 5 | login-code | [Published message templates in its own source repository](https://github.com/18F/identity-idp/blob/4089353d3724decd2f5e958762a5ca95538b8b15/config/locales/telephony/en.yml) |
| U.S. Department of Veterans Affairs | 4 | pharmacy, appointment | [Milwaukee VA pharmacy refill texts](https://www.va.gov/milwaukee-health-care/stories/milwaukee-va-pharmacy-begins-text-messaging-reminders-to-refill-medications/), [Charles George VAMC refill texts](https://www.va.gov/asheville-health-care/stories/new-medication-refill-feature/), [VEText earlier-appointment offers](https://www.va.gov/sheridan-health-care/stories/earlier-appointments-now-offered-thru-text-tool/) |
| People's Electric Cooperative | 5 | utility | [Outage texting flyer (PDF)](https://www.peopleselectric.coop/wp-content/uploads/outage-texting.pdf) |
| Fairfax Connector | 2 | travel | [BusTracker by Text](https://www.fairfaxcounty.gov/connector/bustracker/text) |
| Centro | 1 | travel | [Track by Text](https://www.centro.org/how-to-ride/transit-tools/track-by-text) |
| Orange County Transportation Authority | 1 | travel | [Text4Next](https://octa.net/Text4Next/) |
| University Health, San Antonio | 1 | appointment | [MyChart text messaging](https://www.universityhealth.com/patient-visitor-resources/patients/patient-portal/mychart/text-messaging) |
| Washington State DSHS | 8 | government | [Text Messages from DSHS](https://www.dshs.wa.gov/text) |
| Washington State Health Care Authority | 8 | government | [Apple Health text messages](https://www.hca.wa.gov/about-hca/programs-and-initiatives/apple-health-medicaid/apple-health-text-messages) |
| Pennsylvania Department of Human Services | 4 | government | [Examples of legitimate DHS texts](https://www.pa.gov/agencies/dhs/newsroom/shapiro-administration-warns-of-potential-snap-scam-reminds-public-of-safe-way-to-apply-for-assistance-) |
| Iowa Department of Health and Human Services | 1 | government | [Medical Assistance Text Messaging Program](https://hhs.iowa.gov/medical-assistance-text-messaging) |

No publisher contributes more than 8 of the 60 records.

Seven messages were transcribed from a phone screenshot the publisher put on its own page rather than from page text: the two Fairfax Connector messages, the Centro message, the University Health confirmation, and the three VA pharmacy messages.
Those records say so in their `note`.

### Rules the set was built under

Every message is quoted exactly as the organisation printed it.
No message was written, paraphrased, completed, or reworded, and nothing was carried over from a third party's blog post or an SMS vendor's template gallery.
Where a search turned up a quotable message on a security-awareness page, it was used only if that page was published by the sender itself; a customer-posted Xfinity code message on Xfinity's own forum was rejected on that basis, and so were several bank alerts that turned out to be the scam example on the page rather than the real one.

Placeholders that appear in the text, such as USPS's `01123456789123456789`, Commerce Bank's `Check#XXXXXXXXXXX`, Freedom Bank's `888-XXX-XXXX`, VA's capitalised `CLINIC at LOCATION on DATE`, and DSHS's `Xxxxx` and `$x.xx`, are the publisher's own; none were introduced here.
Phone numbers were left in place because every one of them is the publisher's public customer-service or fraud-department line, printed by the publisher in the same example.

Two records involved a documented transformation, and only two:

- **Orange County Transportation Authority.** OCTA prints each line of the reply followed by a parenthetical explanation of that line. The explanations were dropped; the message lines are unchanged.
- **Login.gov.** Login.gov is the sign-in service behind IRS, SSA, VA and other federal accounts, and it publishes the text of every message it sends in its own public source repository as an internationalisation template. The five records here are rendered from those templates using the service's own values: app name `Login.gov`, the ten-minute code expiry Login.gov documents, its `secure.login.gov` sign-in domain, and a placeholder six-digit code. Each record's `note` says so, and the source URL is pinned to the commit the templates were read at.

### Why no dataset was used

No public dataset of real, legitimate, US business text messages was found that could be redistributed here.
What was checked and rejected:

- [UCI SMS Spam Collection](https://archive.ics.uci.edu/dataset/228/sms+spam+collection): CC BY 4.0 and already used in `legitimate-texts.jsonl`, but its `ham` rows are 2012 personal chat from UK and Singapore contributors, which is the easy case this file exists to replace.
- [Mishra and Soni SMS phishing](https://data.mendeley.com/datasets/f45bkkt8pr/1) (5,971 rows, 2022, CC BY 4.0): downloaded and inspected. Its 4,844 `ham` rows are the same personal-chat corpus, with rupee amounts, British slang, and Nigerian postal references. Not US business texts.
- [alusci/sms-otp-spam-dataset](https://huggingface.co/datasets/alusci/sms-otp-spam-dataset) (10,000 rows, MIT, 2025): US-style one-time-code messages, but the dataset card states the whole set is synthetic. Rejected as model-generated.
- [AbayomiAlli/SMS-Spam-Dataset](https://github.com/AbayomiAlli/SMS-Spam-Dataset) (5,240 rows): collected from twenty university users in Nigeria, and the repository states no license. Rejected on both counts.
- [NUS SMS Corpus](https://arxiv.org/abs/1112.2468): about 10,000 legitimate messages, but Singaporean and overwhelmingly personal.
- Hugging Face search for transactional, business, OTP, and smishing SMS returned only the UCI derivatives, synthetic sets, and non-US corpora (Korean, Bengali, Azerbaijani, and African smishing collections).
- Kaggle's bank-transaction SMS sets are non-US and carry no usable license statement.

### Limitations

Published examples are idealised.
An organisation writing its own help page prints the clean, canonical version of a message: correct capitalisation, no truncation, no carrier-inserted prefix, no mid-sentence line break, and often a rounded or masked account number.
Real received texts are messier, so a false-alarm rate measured here is a floor, not a guarantee.

Government agencies are over-represented at 21 of 60 records, spread across four agencies.
They publish the exact wording of their texts far more often than companies do, which is also why they supply most of the link-bearing records.
Banking is the next largest block at 14, and five of those institutions print the same card-processor wording under different names; that repetition is deliberate, so the set tests one very common message shape across several brands rather than one.

Three categories are still missing, and not for lack of looking:

- **Parcel carriers other than USPS.** UPS, FedEx and Amazon all document their short codes, opt-in keywords and SMS terms without ever printing a sample message. FedEx's SMS terms PDF refers to "the chart above" that the published file does not contain; Amazon's shipment-updates terms describe the service only; ups.com refuses automated requests outright.
- **Tolls and parking.** Toll authorities have responded to the toll-scam wave by publishing what they will never do rather than what they do send. E-ZPass New York, SunPass, NC Quick Pass, Illinois Tollway, Ohio Turnpike, the PA Turnpike and the Central Texas Regional Mobility Authority all name their short code and warn about scams; none prints a real alert.
- **Marketing.** Retail, restaurant and membership SMS programs publish terms and conditions without a sample message. Everything returned by searching for one was an SMS vendor's template gallery, which is invented copy, not a message any company actually sent.

Airline alerts are also absent for the same reason, so the `travel` records are bus and transit arrivals rather than gate changes and delays.

Because of those gaps, the file has no record that is purely promotional and none that is a parcel-carrier delivery notice from a private carrier.
The honest read is that this set tests whether Second Look over-flags official transactional messages, and that a checker which passes it has not yet been tested against a real UPS delivery text, a real toll notice, or a real retailer promotion.

## Metrics

Message catch rate is the share of scam texts rated amber or red.
Message false-alarm rate is the share of legitimate texts rated amber or red.
Report the same two metrics with red as the only positive result.
Report the false-alarm rate for UCI personal messages and the private real business texts separately, because the business texts are the harder legitimate cases.

Link catch rate is the share of phishing URLs flagged by at least one deterministic signal.
Report it overall, by signal, and without blocklists, where the last version uses only domain-age, brand-lookalike, and hosting rules.
Only aggregate OpenPhish results may be published.
