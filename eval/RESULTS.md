# Evaluation results

Evaluation date: September 11-12, 2026.

Model: `claude-haiku-4-5-20251001`.

## The honest number

Three prompt versions have been measured: the original, a first pass that cut business false alarms, and a second pass that restored scam detection.
Every "after" number below comes from held-out records that were not run while the prompt they measure was being written.

With the second-pass prompt frozen, Second Look caught 84 of 100 held-out scam texts, or 84.0% (95% Wilson interval 75.6% to 89.9%).
The same 100 records were caught 80 times by the original prompt, 80.0% (71.1% to 86.7%), and 74 times by the first pass, 74.0% (64.6% to 81.6%).
Red verdicts on those 100 rose from 54 originally and 38 after the first pass to 67, or 67.0% (57.3% to 75.4%).

The second pass gave back part of the business improvement.
It flagged 3 of 30 held-out genuine business texts, a 10.0% false-alarm rate (3.5% to 25.6%).
The same 30 records had 9 false alarms with the original prompt, 30.0% (16.7% to 47.9%), and 0 after the first pass, 0.0% (0.0% to 11.4%).
The original published full-set baseline remains visible: 25 of 60 business texts were flagged, or 41.7% (30.1% to 54.3%).

Using the held-out business half plus all 150 UCI personal texts, the combined legitimate false-alarm rate is 6 of 180, or 3.3% (1.5% to 7.1%).
It was 11 of 180, or 6.1% (3.4% to 10.6%), originally and 0 of 180, or 0.0% (0.0% to 2.1%), after the first pass.
The original combined baseline across all 60 business texts plus UCI was 27 of 210, or 12.9% (9.0% to 18.1%).

### Which records were used to write each prompt

- First pass: only the 30-record business development half was run while writing the prompt.
  The full 200 scam texts, the held-out business half, and UCI were run once after it was frozen.
- Second pass: only the 100-record scam development half and the 30-record business development half were run while writing the prompt, over four iterations.
  The held-out 100 scams, the held-out 30 business texts, and all 150 UCI texts were then run once with the prompt frozen.
- The development halves are therefore not reported as evidence.
  For reference only, the frozen second-pass prompt caught 86 of 100 development scams and flagged 3 of 30 development business texts.
- One caveat is stated plainly: the second pass was motivated by reviewing the first pass's misses across all 200 scams, so the broad patterns it targets (link-driven delivery and account-hold messages, new-number stories) were known from records that are now in the held-out half.
  No held-out record was run or inspected while the second-pass wording was being written.
- The held-out business results from the first pass had also been seen before the second pass began.

## Message results

Held-out records only.
The scam row uses the held-out 100 scams for all three prompts, so its original and first-pass numbers differ from the full 200-record figures quoted in earlier versions of this file.

| Set | Original amber or red | First pass amber or red | Second pass amber or red |
| --- | ---: | ---: | ---: |
| IMC scam texts, held-out half | 80/100, 80.0% (71.1% to 86.7%) | 74/100, 74.0% (64.6% to 81.6%) | 84/100, 84.0% (75.6% to 89.9%) |
| UCI personal texts | 2/150, 1.3% (0.4% to 4.7%) | 0/150, 0.0% (0.0% to 2.5%) | 3/150, 2.0% (0.7% to 5.7%) |
| Published business texts, held-out half | 9/30, 30.0% (16.7% to 47.9%) | 0/30, 0.0% (0.0% to 11.4%) | 3/30, 10.0% (3.5% to 25.6%) |
| Combined legitimate texts, UCI plus held-out business | 11/180, 6.1% (3.4% to 10.6%) | 0/180, 0.0% (0.0% to 2.1%) | 6/180, 3.3% (1.5% to 7.1%) |

| Set | Original red only | First pass red only | Second pass red only |
| --- | ---: | ---: | ---: |
| IMC scam texts, held-out half | 54/100, 54.0% (44.3% to 63.4%) | 38/100, 38.0% (29.1% to 47.8%) | 67/100, 67.0% (57.3% to 75.4%) |
| UCI personal texts | 0/150, 0.0% (0.0% to 2.5%) | 0/150, 0.0% (0.0% to 2.5%) | 2/150, 1.3% (0.4% to 4.7%) |
| Published business texts, held-out half | 1/30, 3.3% (0.6% to 16.7%) | 0/30, 0.0% (0.0% to 11.4%) | 0/30, 0.0% (0.0% to 11.4%) |
| Combined legitimate texts, UCI plus held-out business | 1/180, 0.6% (0.1% to 3.1%) | 0/180, 0.0% (0.0% to 2.1%) | 2/180, 1.1% (0.3% to 4.0%) |

For the full 200 scams, the original prompt caught 165, or 82.5% (76.6% to 87.1%), with 107 red, and the first pass caught 151, or 75.5% (69.1% to 80.9%), with 68 red.
The second pass was not run on all 200 as evidence, because half of them were used to write it.

The second-pass frozen runs had no model failures on any held-out or UCI record.
Two development-half scam records returned HTTP 500 during the final development iteration, and the first pass had three failures across all 200 scams, one of them in the held-out half.
Failures stay as misses rather than being retried until they pass.
Median wall time in the second-pass frozen runs was 5.5 seconds for scams and 5.1 seconds for legitimate texts, with a maximum of 7.1 seconds.
Those runs used three concurrent requests instead of two, so their timings are not comparable with the 3.4 to 3.9 second medians of the earlier runs.

## Link results

The phishing-link catch rate was 92 of 150, or 61.3% (95% Wilson interval 53.3% to 68.8%).
Thirty-five of 150 were red, or 23.3% (95% Wilson interval 17.3% to 30.7%).
Without Google Safe Browsing, the domain-age, brand-lookalike, hosting, and short-link rules caught 81 of 150, or 54.0% (95% Wilson interval 46.0% to 61.8%).

| Phishing signal | Links caught | Rate |
| --- | ---: | ---: |
| Free hosting | 62/150 | 41.3% |
| Google Safe Browsing | 31/150 | 20.7% |
| Domain age of 90 days or less | 17/150 | 11.3% |
| Brand lookalike | 8/150 | 5.3% |
| Short link could not be resolved | 1/150 | 0.7% |

Signals overlap, so their counts do not sum to the overall catch count.
No Safe Browsing requests were unavailable in the final throttled run.
Only aggregate OpenPhish results are published, and its hosts and URLs are omitted from the raw result records.

The lower-ranked Tranco control set flagged 3 of 100 ordinary domains, or 3.0% (95% Wilson interval 1.0% to 8.5%), and all three were domains registered within 90 days.
The official brand-link set flagged 0 of 50, or 0.0% (95% Wilson interval 0.0% to 7.1%).

The first Tranco result had 31 amber verdicts: 28 from unavailable age data and 3 from genuinely young domains.
Treating an unavailable registry response as suspicious was over-flagging, not honest caution, because a failed lookup supplies no evidence about a site's age.
The unavailable-age row now remains visible as information but has tier `none`, and rerunning all link sets reduced the Tranco flag rate from 31% to 3%.

## Prompt-injection check

The injection suffix lowered the model's own tier for 1 of 50 red scam texts, or 2.0% (95% Wilson interval 0.4% to 10.5%).
That record also lowered the final tier from red to none because its evidence floor was none.
All 50 source messages came from a historical dataset in which links were replaced by `<URL>`, so none of this injection sample had a deterministic evidence floor above none.

The final tier fell below the evidence floor in 0 of 50 cases.
Forty-nine of 50 injected messages remained red.
This confirms that the combining code enforces the floor, but this sample does not demonstrate protection from a live link signal because the source links were stripped.
The injection check was measured with the original prompt and has not been rerun for either prompt revision.

## Changes made after failure review

The published before baseline already included three narrow reliability and link changes.

- The model timeout increased from 10 seconds to 30 seconds.
  The 12 failed scam records were rerun, reducing model failures from 12 to 1 and changing catch rate from 77.5% to 82.5%.
- Link extraction now requires a real public suffix for bare dotted text.
  This stops phrases such as `Nice.nice` and `store.like cereals` from becoming links, and the two affected legitimate records were rerun.
- An unavailable domain-age lookup now contributes a `none` information row instead of an amber floor.
  All three link sets were rerun, and no brand, wording, or classification rules were added to improve the measured catch rate.

The corrected red baseline changed four members of the deterministic 50-record injection sample, so the complete injection sample was rerun as well.

The false-alarm follow-up made one small model-instruction change after deterministically splitting the business set.

- The prompt now distinguishes a routine keyword reply or call to the number on the back of a card from risky requests to use a link for verification, share secrets, call an unfamiliar supplied number, or send money.
  It also says pressure matters only when the message explicitly pushes toward one of those risky actions.
- The prompt was revised using only the 30-record development half, then frozen before the held-out business, scam, and UCI sets were run.
- The two publisher institution-name placeholders were replaced with realistic institution names before live evaluation, as documented in `eval/README.md` and each record's `note`.
  One replacement initially duplicated the template's following generic `Bank` label; the data rendering was corrected and the held-out half was rerun with the prompt still frozen.

The first pass over-corrected, so a second pass revised the same instructions after deterministically splitting the scam set.

- Of the first pass's new misses, most were link-driven delivery, reschedule, customs, account-hold, and tax-refund messages, plus new-number stories that the first pass's "if no risky action is requested, choose none" line had overridden.
- The prompt now says genuine alerts tell you what happened, and when they ask for anything it is a keyword reply, a call to the number on the back of your card, a check of an email they sent, or a visit to the organization's own named website or office.
- It defines risky requests once: using a link or unfamiliar number in the message to verify, sign in, pay, claim a prize or refund, reschedule or release a delivery, confirm details, or fix or unlock something; sharing a code, password, or card number; or sending money or gift cards.
- Red covers a new-number, broken-phone, or family-emergency story from an unknown sender even before money is mentioned, gift-card or wire demands, threats, and an account, card, refund, or package hold paired with a risky request.
  Amber covers any other risky request, even when the message sounds routine.
- Four iterations were run on the development halves only.
  The third iteration added a sentence exempting information and feedback links; it raised development business false alarms from 3 to 5 without helping scams, so it was removed.
  The frozen fourth iteration is the second iteration's wording with gift-card and wire demands restored to red, rerun on the development halves before freezing.
- No keyword allowlist, link rule, or evidence-floor change was made.

## Missed scams

Every final `none` result on the 100 held-out scams with the frozen second-pass prompt is listed below.
All 16 are first-contact messages or fragments with no request yet, and 15 of them were also missed by both earlier prompts.
The system was not tuned to flag ordinary greetings merely to improve this score.

- `scam-59`: The message is only an IRS-themed PDF filename and file-size fragment with no call to action; the original prompt rated it red.
- `scam-134`: The standalone text says an apparent acquaintance is bringing a cake and contains no request or pressure.
- `scam-135`: The standalone text is a friendly greeting with no request, pressure, or money cue.
- `scam-139`: The entire first-contact message is the ordinary greeting "How are you doing."
- `scam-140`: The text only expresses interest in a house and has no payment, link, or urgency cue.
- `scam-141`: The sender asks about a claimed past date but does not yet ask for money, credentials, or urgent action.
- `scam-143`: The claimed dating-app reconnection contains no immediate pressure or sensitive request.
- `scam-145`: The standalone text is a casual check-in with no request beyond conversation.
- `scam-146`: The standalone text is an ordinary greeting addressed to Anne.
- `scam-149`: The standalone text is a generic "long time no see" greeting.
- `scam-151`: The golf-acquaintance opener establishes false familiarity but makes no request beyond confirming identity.
- `scam-152`: The text only says the sender saw a Facebook property listing and makes no risky request.
- `scam-157`: The text asks why the recipient is busy and contains no financial or credential request.
- `scam-160`: The compliment about a skirt asks only for a conversation when convenient.
- `scam-162`: The standalone text is an ordinary pickup-time question.
- `scam-166`: The text complains about a lack of replies but contains no financial, credential, or urgent action request.

Ten held-out scams missed by the first pass are caught by the second pass:

- `scam-15` and `scam-33`: FedEx messages asking the recipient to set delivery preferences, now amber.
- `scam-75`: A bare bank account number and account name, now amber.
- `scam-98`: A Citi account hold with a link, now red; the first pass had failed with HTTP 400 on this record.
- `scam-142`, `scam-150`, and `scam-161`: Wrong-number and false-familiarity openers, now red under the unknown-sender rule.
- `scam-155`: A property-viewing request ending in a broken `http` token, now amber.
- `scam-159`: A long-time-no-see coronavirus story asking the recipient to add a new number, now red.
- `scam-190`: A new-number message asking a parent to save the contact, now red.

Development-half misses are not listed, because that half was used to write the prompt.
One of them is worth noting as a dataset limitation: `scam-77` asks for a debit PIN through a link, but the model rated it none because the dataset's `<URL>` placeholder is not a real link.

## Flagged UCI personal texts

Second pass: these three of 150 were flagged.

- `legit-46` (amber): An enthusiastic thank-you note with unusual capitalisation; the explanation says it contains no risky request but suggests caution about spoofing, so the tier contradicts its own reasoning.
- `legit-54` (red): A friend's "come down if you can" pub invitation signed with a nickname was read as a family-emergency story from an unknown sender.
- `legit-83` (red): A confusing question asking whether the recipient knows a number was read as the opening of a new-number scam.

The unknown-sender red rule is the main cost of the second pass on personal texts: without a contact list, a casual message from a real friend can look like the first message of a family-emergency scam.

First pass: none of the 150 UCI personal texts were flagged.

Original, these two were flagged:

- `legit-75`: A chain-message game says "ACCEPT DAY" and "No rply means enemy," which resembles a deadline plus a threat to force a reply.
- `legit-83`: A confusing question asking whether the recipient knows an unknown number was interpreted as pressure to confirm contact information.

## Flagged published business texts

Second pass: these three of the 30 held-out business texts were flagged, all by the model alone.

- `business-2` (USPS, amber): The terse "Alert update has been applied" tracking notice was read as vague wording meant to prompt a tap or reply.
- `business-14` (Commerce Bank, amber): A check-fraud alert offering a `YES` or `NO` reply or a call to a printed number was still treated as pressure toward an unfamiliar number.
- `business-33` (Charles George VAMC Pharmacy, amber): A refill reminder with a `Y` reply, a phone number, and an official website was flagged; its explanation was replaced by the verdict guard.

First pass: none of the 30 held-out business texts were flagged.

Original, these 25 records were flagged in the full 60-record baseline:

- `business-0` (USPS): A routine pickup notice asks the recipient to reply `STOP`, which the model treated as pressured interaction.
- `business-3` (USPS): A delivery-exception update was misread as authority impersonation and an implied request even though it only confirms an existing request.
- `business-6` (River City Bank): A real fraud alert combines a suspicious transaction with a `YES` or `NO` reply request, matching the model's phishing-pressure pattern.
- `business-9` (Freedom Bank): A real card alert combines a dollar amount with a `YES` or `NO` reply request, and the generated explanation was replaced because it used prohibited reassurance wording.
- `business-11` (Freedom Bank): A publisher's generic template contains the literal placeholder `(Insert financial institution name here)`, which made the real example look fabricated and produced a red verdict.
- `business-12` (Farmers and Merchants Bank): A real fraud-center message pairs a transaction amount with an immediate `YES` or `NO` reply request.
- `business-13` (Farmers and Merchants Bank): A routine opt-out confirmation asks the recipient to reply `UNDO`, which was treated as suspicious interaction.
- `business-14` (Commerce Bank): A legitimate check-fraud alert includes a large masked amount, a reply request, and a phone number, closely matching phishing language.
- `business-15` (Certified Federal Credit Union): A genuine suspicious-transaction alert asks for an immediate `YES` or `NO` response and uses a generic institution placeholder.
- `business-16` (Tulsa Federal Credit Union): A real fraud alert was rated red because its suspicious-transaction warning and `YES` or `NO` reply request closely match bank phishing tactics.
- `business-17` (Centra Credit Union): A legitimate card alert combines a dollar amount, card suffix, and requested response, which the model treated as manufactured urgency.
- `business-18` (7 17 Credit Union): A genuine debit-card alert asks the recipient to validate a transaction by reply, matching the system's pressure-plus-action rule.
- `business-19` (7 17 Credit Union): A real fraud-department message requests a `YES` or `NO` response, and the generated explanation was replaced because it used prohibited reassurance wording.
- `business-21` (People's Electric Cooperative): An address-selection prompt includes an account number and asks for a one-letter reply, which was misread as a request for sensitive information.
- `business-25` (Fairfax Connector): A transit text opt-in asks for confirmation and mentions possible message rates, which the model interpreted as urgency plus a fee.
- `business-34` (Login.gov): A normal login code includes a ten-minute expiry and an official domain, but the time limit and code language triggered amber.
- `business-35` (Login.gov): A real account-security alert says access was restricted and directs the user to emailed next steps, matching an account-takeover lure.
- `business-36` (Login.gov): A real identity-verification alert says access was restricted, and the generated explanation was replaced because it used prohibited reassurance wording.
- `business-40` (Washington State DSHS): A benefits reminder requests proof of work activities and supplies an official link, which resembles a benefits-loss threat plus action.
- `business-41` (Washington State DSHS): Two official `rb.gy` short links could not be resolved, so deterministic link evidence set an amber floor.
- `business-42` (Washington State DSHS): A genuine EBT theft warning says `Act immediately!` and advises changing a PIN through official channels, matching the model's threat-and-action rule.
- `business-48` (Washington State Health Care Authority): A real health-coverage renewal notice combines an end-of-month deadline with an official website request.
- `business-50` (Washington State Health Care Authority): A genuine eligibility-review notice warns about staying insured and requests renewal by month end.
- `business-54` (Washington State Health Care Authority): A real Medicaid enrollment message says `Act now` and supplies a renewal deadline and official domain.
- `business-58` (Pennsylvania Department of Human Services): A genuine benefits renewal notice gives a five-day deadline and asks the recipient to log in, closely matching phishing pressure.

## Cost and limitations

The second pass spent $0.8535: $0.5610 across the four development iterations, of which $0.4214 was the three superseded iterations, and $0.2925 for the frozen held-out scam, held-out business, and UCI runs.
The false-alarm first pass spent $0.5019 and the original evaluation $0.4152, so measured model usage across all three is $1.7706.
The second pass stayed under its $2 cap.
The link evaluation made no model calls.

This is a small evaluation, so the confidence intervals remain wide and the precise rates should not be treated as population estimates.
The held-out halves are small: the 10.0% business false-alarm rate rests on 3 of 30 records, and its interval runs from 3.5% to 25.6%.
The differences between the three prompts on the held-out business and UCI sets are within run-to-run noise of a few records; the same development records flipped between tiers across iterations with small wording changes.
The scam messages are historical reports from 2017 through 2024, and their links were replaced by `<URL>`, which removes much of Second Look's deterministic advantage and makes the injection floor test unusually weak.
The UCI legitimate texts are mostly easy personal messages collected around 2012, not the business alerts most likely to resemble scams.
The 60 business texts are genuine wording published by the organisations that send them, but they are idealised examples rather than messages collected from real inboxes.
Published examples tend to have clean formatting and canonical wording, so the held-out business false-alarm rate may still understate problems on messier received texts.
The verdict guard replaced the model's explanation on 17 of the 30 held-out business texts in the second pass, up from 9 in the first pass, most likely because the model described genuine alerts in words the page is not allowed to use; those readers see the generic contradiction sentence instead of a specific explanation.
The scam corpus strips or truncates many links and includes first-contact fragments whose malicious action appears later, which limits how directly its catch rate predicts live performance.
The OpenPhish snapshot represents one day and its link results can change as domains age and blocklists update.
