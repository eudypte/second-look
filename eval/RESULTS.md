# Evaluation results

Evaluation date: September 11-12, 2026.

Model: `claude-haiku-4-5-20251001`.

## The honest number

Second Look caught 165 of 200 scam texts, or 82.5% (95% Wilson interval 76.6% to 87.1%), with 2 false alarms among 150 UCI personal texts, or 1.3% (95% Wilson interval 0.4% to 4.7%).
The harder real business-text set was not present, so there is not yet a defensible combined false-alarm number or an `n = 200` legitimate-text headline.

These are the final numbers after the narrow reliability and false-link fixes described below.
The initial scam run caught 155 of 200, or 77.5% (95% Wilson interval 71.2% to 82.7%), but 12 model reads had failed and 11 of those stopped exactly at the old 10-second timeout.

## Message results

| Set | Amber or red | Red only | Model failures | Median wall time |
| --- | ---: | ---: | ---: | ---: |
| IMC scam texts | 165/200, 82.5% (76.6% to 87.1%) | 107/200, 53.5% (46.6% to 60.3%) | 1/200 | 3.8 s |
| UCI personal texts | 2/150, 1.3% (0.4% to 4.7%) | 0/150, 0.0% (0.0% to 2.5%) | 0/150 | 3.4 s |
| Private real business texts | not available | not available | not available | not available |

The remaining model failure was `scam-96`, whose targeted rerun returned HTTP 400.
It remains a miss in the published result rather than being retried until it passes.
The longest successful or failed message check took 15.0 seconds after the timeout change.

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

Three narrow changes were made, and only affected evaluations were rerun.

- The model timeout increased from 10 seconds to 30 seconds.
  The 12 failed scam records were rerun, reducing model failures from 12 to 1 and changing catch rate from 77.5% to 82.5%.
- Link extraction now requires a real public suffix for bare dotted text.
  This stops phrases such as `Nice.nice` and `store.like cereals` from becoming links, and the two affected legitimate records were rerun.
- An unavailable domain-age lookup now contributes a `none` information row instead of an amber floor.
  All three link sets were rerun, and no brand, wording, or classification rules were added to improve the measured catch rate.

The corrected red baseline changed four members of the deterministic 50-record injection sample, so the complete injection sample was rerun as well.

## Missed scams

Every final `none` result is listed below.
Most misses are first-contact wrong-number messages whose scam intent only becomes apparent later in a conversation, and the system was not tuned to flag ordinary greetings merely to improve this score.

- `scam-75`: The row is only a bank account number and account name, with no request, pressure, or stated reason to transfer money.
- `scam-96`: The model call returned HTTP 400, and the dataset's stripped link left no deterministic evidence floor.
- `scam-126`: The message ends immediately after offering a freebie, so the action or link that would reveal the lure is missing.
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
- `scam-154`: The sender asks whether a Facebook property is still for sale, with no payment or urgency cue.
- `scam-155`: The property-viewing request ends with the incomplete token `http`, leaving no usable link or later scam step.
- `scam-156`: The Oprah-related opener uses curiosity but does not yet request a tap, reply, payment, or code.
- `scam-157`: The text asks why the recipient is busy and contains no financial or credential request.
- `scam-158`: The sender claims familiarity but provides no new-number story, money request, or urgent action.
- `scam-160`: The compliment about a skirt asks only for a conversation when convenient.
- `scam-161`: The extended wrong-number exchange builds rapport and asks where the recipient is from, but contains no pressure or financial ask.
- `scam-162`: The standalone text is an ordinary pickup-time question.
- `scam-163`: The entire message is the identity claim "It's me jiyong."
- `scam-164`: The message shares a Snapchat handle but contains no urgency, payment request, or credential request.
- `scam-165`: The request for a precious-metals price list resembles a normal business inquiry at this stage.
- `scam-166`: The text complains about a lack of replies but contains no financial, credential, or urgent action request.

## Flagged legitimate texts

- `legit-75`: A chain-message game says "ACCEPT DAY" and "No rply means enemy," which resembles a deadline plus a threat to force a reply.
- `legit-83`: A confusing question asking whether the recipient knows an unknown number was interpreted as pressure to confirm contact information.

## Cost and limitations

The retained raw evaluation records contain $0.3188 of model usage, and superseded targeted runs add $0.0473, for $0.3661 of measured evaluation spend.
Including the manual page checks whose token usage was not instrumented, total API spend stayed below $0.38 and well below the $5 cap.
The link evaluation made no model calls.

This is a small evaluation, so the confidence intervals remain wide and the precise rates should not be treated as population estimates.
The scam messages are historical reports from 2017 through 2024, and their links were replaced by `<URL>`, which removes much of Second Look's deterministic advantage and makes the injection floor test unusually weak.
The UCI legitimate texts are mostly easy personal messages collected around 2012, not the business alerts most likely to resemble scams.
The private real business-text set had not been supplied, so its false-alarm placeholder remains empty and the planned balanced `n = 200` headline cannot yet be reported.
The OpenPhish snapshot represents one day and its link results can change as domains age and blocklists update.
