# Data and attribution

- Scam messages come from [*Fishing for Smishing: Understanding SMS Phishing Infrastructure and Strategies by Mining Public User Reports*](https://github.com/reportsmishing/Smishing-Dataset-IMC25) by Sharad Agarwal, Antonis Papasavva, Guillermo Suarez-Tangil, and Marie Vasek, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Personal messages come from Tiago Almeida and José María Gómez Hidalgo's [UCI SMS Spam Collection](https://archive.ics.uci.edu/dataset/228/sms+spam+collection), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- The harder legitimate set uses [business-text examples published by their sending organizations](../eval/README.md#business-texts-the-hard-false-alarm-set).
- Legitimate link controls use [Tranco](https://tranco-list.eu/), created by Victor Le Pochat, Tom Van Goethem, Samaneh Tajalizadehkhoob, Maciej Korczyński, and Wouter Joosen, with component-source attribution documented in the [evaluation notes](../eval/README.md#tranco-legitimate-domains).
- Domain-age checks use the [IANA RDAP bootstrap](https://data.iana.org/rdap/dns.json), and blocklist checks use the non-commercial [Google Safe Browsing API](https://developers.google.com/safe-browsing/reference/rest).
- Google works to provide accurate and current information about unsafe web resources, but cannot guarantee that it is complete or error-free: risky sites may be missed, and harmless sites may be identified by mistake.
  A warning based on its data says ["Advisory provided by Google"](https://safebrowsing.google.com/); that attribution is not shown for warnings from other checks.
- OpenPhish-derived links are kept private under the [OpenPhish terms](https://openphish.com/terms.html); only aggregate evaluation results are published.

See [the evaluation data notes](../eval/README.md) for exact source revisions, sampling, licenses, and attribution details.
