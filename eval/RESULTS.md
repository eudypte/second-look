# Evaluation results

Evaluation date: September 11-12, 2026.

Model: `claude-haiku-4-5-20251001`.

## The honest number

With the shipped prompt frozen, Second Look caught 84 of 100 held-out scam texts, or 84.0% (95% Wilson interval 75.6% to 89.9%); 67 were red, or 67.0% (57.3% to 75.4%).
It flagged 6 of 180 genuine texts, or 3.3% (1.5% to 7.1%): 3 of 30 held-out business texts, 10.0% (3.5% to 25.6%), and 3 of 150 UCI personal texts, 2.0% (0.7% to 5.7%).

## Method

Each message set was split deterministically into a development half and a held-out half.
The prompt was written using only the development halves, then frozen, and the held-out halves were run once.
Development-half results are not reported as evidence.
Three prompt versions were measured: the original, a first pass that cut business false alarms, and a second pass (shipped) that restored scam detection.
One caveat: the second pass was motivated by reviewing the first pass's misses across all 200 scams, so its broad target patterns were known from records now in the held-out half, though no held-out record was run or inspected while its wording was written.

## Message results

Held-out records only.

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

All 16 missed held-out scams are first-contact greetings or fragments with no request yet, and 15 of them were also missed by both earlier prompts.
Of the three flagged UCI texts, two were red because a casual message from a real friend looked like the first message of a new-number or family-emergency scam.
The three flagged business texts (a USPS tracking notice, a bank check-fraud alert, and a pharmacy refill reminder) were all flagged by the model alone, as amber.

The second-pass frozen runs had no model failures on any held-out or UCI record.
Median wall time was 5.5 seconds for scams and 5.1 seconds for legitimate texts, with a maximum of 7.1 seconds.

## Link results

The phishing-link catch rate was 92 of 150, or 61.3% (95% Wilson interval 53.3% to 68.8%); 35 were red, or 23.3% (17.3% to 30.7%).
Without Google Safe Browsing, the domain-age, brand-lookalike, hosting, and short-link rules caught 81 of 150, or 54.0% (46.0% to 61.8%).
The lower-ranked Tranco control set flagged 3 of 100 ordinary domains, or 3.0% (1.0% to 8.5%), all registered within 90 days.
The official brand-link set flagged 0 of 50, or 0.0% (0.0% to 7.1%).
Only aggregate OpenPhish results are published.

## Prompt-injection check

The injection suffix lowered the final tier below the evidence floor in 0 of 50 cases, and 49 of 50 injected messages remained red.
The source links had been stripped, so this sample does not demonstrate protection from a live link signal, and it was measured with the original prompt only.

## Cost and limitations

Measured model usage across all three prompt versions was $1.7706, of which the second pass spent $0.8535.
The link evaluation made no model calls.

This is a small evaluation, so the confidence intervals are wide; the 10.0% business false-alarm rate rests on 3 of 30 records.
Differences between the prompts on the business and UCI sets are within run-to-run noise of a few records.
The scam messages are historical reports from 2017 through 2024 with links replaced by `<URL>`, which removes much of Second Look's deterministic advantage.
The UCI texts are mostly easy personal messages from around 2012, and the business texts are published examples rather than messages from real inboxes.
The OpenPhish snapshot represents one day.
