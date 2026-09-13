# Evaluation results

Evaluation date: September 11-12, 2026.

Model: `claude-haiku-4-5-20251001`.

## The honest number

After the prompt was frozen, Second Look flagged 0 of 30 held-out genuine business texts, a 0.0% false-alarm rate (95% Wilson interval 0.0% to 11.4%).
The same 30 records had 9 false alarms before the change, or 30.0% (16.7% to 47.9%).
The original published full-set baseline remains visible: 25 of 60 business texts were flagged, or 41.7% (30.1% to 54.3%).

The improvement did hurt measured scam detection.
The scam catch rate fell from 165 of 200, or 82.5% (76.6% to 87.1%), before to 151 of 200, or 75.5% (69.1% to 80.9%), after.
That is a decrease of 14 caught messages and 7.0 percentage points.

Using only the held-out business half plus all 150 UCI personal texts, the comparable combined legitimate false-alarm rate fell from 11 of 180, or 6.1% (3.4% to 10.6%), before to 0 of 180, or 0.0% (0.0% to 2.1%), after.
The original combined baseline across all 60 business texts plus UCI was 27 of 210, or 12.9% (9.0% to 18.1%).

The deterministic 30-record development half was used to write and revise the prompt.
Its result is therefore not reported as evidence.
The held-out half was not run or inspected after partitioning until the prompt was frozen.
The first frozen-prompt held-out run exposed a duplicated generic `Bank` label in one substituted template.
The rendering was corrected and the full held-out half was rerun without changing the prompt; both runs are retained and included in spend.

## Message results

| Set | Before amber or red | After amber or red | Before red only | After red only | After model failures | After median wall time |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| IMC scam texts | 165/200, 82.5% (76.6% to 87.1%) | 151/200, 75.5% (69.1% to 80.9%) | 107/200, 53.5% (46.6% to 60.3%) | 68/200, 34.0% (27.8% to 40.8%) | 3/200 | 3.8 s |
| UCI personal texts | 2/150, 1.3% (0.4% to 4.7%) | 0/150, 0.0% (0.0% to 2.5%) | 0/150, 0.0% (0.0% to 2.5%) | 0/150, 0.0% (0.0% to 2.5%) | 0/150 | 3.4 s |
| Published business texts, held-out half | 9/30, 30.0% (16.7% to 47.9%) | 0/30, 0.0% (0.0% to 11.4%) | 1/30, 3.3% (0.6% to 16.7%) | 0/30, 0.0% (0.0% to 11.4%) | 0/30 | 3.9 s |
| Combined legitimate texts, UCI plus held-out business | 11/180, 6.1% (3.4% to 10.6%) | 0/180, 0.0% (0.0% to 2.1%) | 1/180, 0.6% (0.1% to 3.1%) | 0/180, 0.0% (0.0% to 2.1%) | 0/180 | 3.5 s |

The after scam run had three model failures: `scam-63` returned HTTP 500, while `scam-98` and `scam-131` returned HTTP 400.
All three remain misses rather than being retried until they pass.
The longest successful or failed after-run message check took 16.5 seconds.

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

## Missed scams

Every final `none` result is listed below.
Most misses are first-contact wrong-number messages whose scam intent only becomes apparent later in a conversation, and the system was not tuned to flag ordinary greetings merely to improve this score.

- `scam-9`: The standalone text only reports a failed delivery attempt and requests no action.
- `scam-13`: The delivery message's rescheduling link was treated as a routine service task rather than a risky action.
- `scam-15`: The delivery fragment ends before giving any link or explicit action for setting preferences.
- `scam-29`: The customs-delay fragment says more information may be needed but ends before supplying an action.
- `scam-33`: The delivery fragment mentions setting preferences but ends before supplying a link or explicit request.
- `scam-53`: The entire message is an IRS-themed PDF filename with no call to action.
- `scam-59`: The message is only an IRS-themed PDF filename and file-size fragment with no call to action.
- `scam-63`: The model call returned HTTP 500, and the dataset's stripped link left no deterministic evidence floor.
- `scam-75`: The row is only a bank account number and account name, with no request, pressure, or stated reason to transfer money.
- `scam-98`: The model call returned HTTP 400, and the dataset's stripped link left no deterministic evidence floor.
- `scam-126`: The message ends immediately after offering a freebie, so the action or link that would reveal the lure is missing.
- `scam-127`: The generic AT&T notification asks the recipient to visit a link but gives no pressure or sensitive purpose.
- `scam-131`: The model call returned HTTP 400 on a reward message with no deterministic evidence floor.
- `scam-134`: The standalone text says an apparent acquaintance is bringing a cake and contains no request or pressure.
- `scam-135`: The standalone text is a friendly greeting with no request, pressure, or money cue.
- `scam-136`: The text asks why the recipient is busy and contains no financial or credential request.
- `scam-137`: The item-availability question ends with the incomplete token `https`, so there is no usable link or later scam step.
- `scam-138`: The house-availability question ends with the incomplete token `https` and otherwise reads like an ordinary inquiry.
- `scam-139`: The entire first-contact message is the ordinary greeting "How are you doing."
- `scam-140`: The text only expresses interest in a house and has no payment, link, or urgency cue.
- `scam-141`: The sender asks for a job reference based on a claimed past date, but does not yet ask for money, credentials, or urgent action.
- `scam-142`: The text is only an apology for a wrong number, before any rapport-building or financial request appears.
- `scam-143`: The claimed dating-app reconnection asks to meet for drinks but contains no immediate pressure or sensitive request.
- `scam-144`: The entire message is the ordinary check-in "Are you OK?"
- `scam-145`: The standalone text is a casual check-in with no request beyond conversation.
- `scam-146`: The standalone text is an ordinary greeting addressed to Anne.
- `scam-147`: The advertisement question ends with the incomplete token `https`, leaving no usable link or scam action.
- `scam-148`: The exchange contains a wrong-number apology but no later rapport or money request.
- `scam-149`: The standalone text is a generic "long time no see" greeting.
- `scam-150`: The text only asks whether the recipient is a named person and claims uncertainty about the number.
- `scam-151`: The golf-acquaintance opener establishes false familiarity but makes no request beyond confirming identity.
- `scam-152`: The text only says the sender saw a Facebook property listing and makes no risky request.
- `scam-153`: The entire message is "Hi."
- `scam-155`: The property-viewing request ends with the incomplete token `http`, leaving no usable link or later scam step.
- `scam-156`: The Oprah-related opener uses curiosity but does not yet request a tap, reply, payment, or code.
- `scam-157`: The text asks why the recipient is busy and contains no financial or credential request.
- `scam-158`: The sender claims familiarity but provides no new-number story, money request, or urgent action.
- `scam-159`: The contact-update message asks the recipient to add a new number but makes no financial or credential request.
- `scam-160`: The compliment about a skirt asks only for a conversation when convenient.
- `scam-161`: The extended wrong-number exchange builds rapport and asks where the recipient is from, but contains no pressure or financial ask.
- `scam-162`: The standalone text is an ordinary pickup-time question.
- `scam-163`: The entire message is the identity claim "It's me jiyong."
- `scam-164`: The message shares a Snapchat handle but contains no urgency, payment request, or credential request.
- `scam-165`: The request for a precious-metals price list resembles a normal business inquiry at this stage.
- `scam-166`: The text complains about a lack of replies but contains no financial, credential, or urgent action request.
- `scam-169`: The new-number message requests WhatsApp contact but makes no financial or credential request.
- `scam-176`: The message says the sender has a new phone but requests no action.
- `scam-190`: The new-number message asks only that the recipient save the contact.
- `scam-191`: The broken-phone story asks for a WhatsApp reply but makes no financial or credential request.

## Flagged UCI personal texts

After: none of the 150 UCI personal texts were flagged.

Before, these two were flagged:

- `legit-75`: A chain-message game says "ACCEPT DAY" and "No rply means enemy," which resembles a deadline plus a threat to force a reply.
- `legit-83`: A confusing question asking whether the recipient knows an unknown number was interpreted as pressure to confirm contact information.

## Flagged published business texts

After: none of the 30 held-out business texts were flagged.

Before, these 25 records were flagged in the original full 60-record baseline:

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

The false-alarm follow-up spent $0.5019, including all three development iterations, the frozen scam and UCI runs, and both frozen-prompt held-out runs around the institution-name rendering correction.
Together with the $0.4152 before evaluation, measured model usage is $0.9171.
Including the earlier manual page checks whose token usage was not instrumented, total API spend stayed below $0.94 and well below the $3 cap for this follow-up.
The link evaluation made no model calls.

This is a small evaluation, so the confidence intervals remain wide and the precise rates should not be treated as population estimates.
The scam messages are historical reports from 2017 through 2024, and their links were replaced by `<URL>`, which removes much of Second Look's deterministic advantage and makes the injection floor test unusually weak.
The UCI legitimate texts are mostly easy personal messages collected around 2012, not the business alerts most likely to resemble scams.
The 60 business texts are genuine wording published by the organisations that send them, but they are idealised examples rather than messages collected from real inboxes.
Published examples tend to have clean formatting and canonical wording, so the held-out 0.0% business false-alarm rate may still understate problems on messier received texts.
Its 95% Wilson interval reaches 11.4%, reflecting the small 30-record held-out sample.
The scam corpus strips or truncates many links and includes first-contact fragments whose malicious action appears later, which limits how directly its catch rate predicts live performance.
The OpenPhish snapshot represents one day and its link results can change as domains age and blocklists update.
