# Draft ASF token standard FAQ

This FAQ covers some feedback, largely [that of Greg Stein on Slack](https://the-asf.slack.com/archives/C086X8CKEMB/p1764212457655769), about the [Draft ASF token standard](draft-asf-token-standard.md) being proposed by ASF Tooling.

Questions here are not copied verbatim from the original thread, so not everything may be covered. The intention here is to try to address the design in general, and to inform continued discussion.

**Q. Why did we choose a design that is compatible with GitHub tokens?**

A. We wanted to be compatible with existing scanners because those are what we are likely to be using to detect leaked tokens, which is the only reason for having a scannable token standard in the first place.

Even if we were to, for example, write our own ASF secrets scanner, we would still probably use it in tandem with e.g. the GitHub secrets scanning scheme, because much of our code is shared on GitHub and they already have the infrastructure to scan the data that they host in bulk. Therefore, since we are already going to be relying on third parties (especially GitHub itself), it seems prudent to try to be compatible with their existing implementations.

A good conceptual case here is that of the checksum, covered in the next question.

**Q. Why not use CRC-16, which produces fewer characters and is in the Python standard library, instead of CRC-32?**

A. GitHub use, and recommend the use, of CRC-32 in scannable tokens. They don't explicitly document which CRC-32 algorithm is used, but they do give an example and the example uses IEEE 802.3 CRC-32.

Their documented reason for using CRC-32 is to lower the number of false positive matches. Since they [actually started using CRC-32 in their own tokens in 2021](https://github.blog/changelog/2021-03-31-authentication-token-format-updates-are-generally-available/), we can assume that their scanning includes code to check the CRC-32. If we used CRC-16 instead, presumably GitHub would not use it to reduce false positives.

There are, however, two very important caveats to this. One is that although GitHub started using CRC-32 in the tokens introduced in 2021, they may not be using it in the [fine-grained tokens that they introduced later, in 2022](https://github.blog/security/application-security/introducing-fine-grained-personal-access-tokens-for-github/). The format of the fine-grained tokens is undocumented, but the fact that they do not mention CRC-32 when they mentioned it just one year earlier is indicative that they no longer use it. They could be using CRC-32 with a secret prefix to the input, however, in which case they may be keeping the existence of the CRC-32 itself secret; it would not be possible to reverse engineer the format without knowing the prefix.

The second caveat is that although GitHub probably at least use CRC-32 to eliminate false positives of their 2021 tokens, unless the lack of it in the later tokens implies that they removed this functionality, there is no evidence that they use CRC-32 when scanning submitted tokens from other organisations. To submit a token you have to do so manually, to an email address, which somebody presumably reads and then gets an engineer to implement. This is an extremely manual process, so it may accommodate custom false positive elimination techniques, potentially even including CRC-16. In other words, we could just ask them when we make the submission.

Overall, how to be compatible with GitHub's secret scanner is not well documented. Their own internal practices are not well documented. They did not even appear to stay consistent with their own security best practices from a year prior to a new token release; yet they still promote the prior practices in their existing documentation. Whether we should aim to be compatible is, therefore, difficult to determine.

**Q. What design choices are opened up if we choose not to be compatible with GitHub, or other, secret scanners?**

A. All elements are open to alternative designs. We can use a different namespace. We can use a different alphabet for encoding the entropy. We can use a different amount of entropy. We can use a different checksum, or no checksum at all. We can order the elements in a different way. We can add other elements, e.g. for administrative reasons.

There are reasons to do so, if compatibility is not an issue. Reverse domain names such as `org_apache` would be a better fit for prefixes to avoid collisions. They would also make leak reports self documenting, to a degree. One can even imagine a standard URL for finding out where to report leaked tokens based on RFC 8615, so for example if somebody found an `org_apache` token in the wild they could go to `https://www.apache.org/.well-known/secret-key-leak` to find instructions on where to report the leak. This would scale to all organisations without requiring a central registry.

Similarly, the choice of CRC-32 is unusual. As pointed out by Greg Stein, CRC-16 already eliminates the vast majority of false positives. Checksums are also widely used for purposes other than denoting a scannable secret, but the combination of the prefix and the existence of the checksum may be enough for domain separation. The question is what problem or attack we are trying to mitigate. If we are trying to avoid accidental collisions, a prefix and CRC-16 are probably enough. If we are trying to avoid deliberate false positives, we would need to use an HMAC, public key cryptography, or some similar solution, each of which has significant drawbacks.

There is no existing standard for scannable secret tokens except, arguably, for RFC 8959, the `secret-token` URL scheme, which is incompatible with `token68` due to its use of `:` which the latter forbids, and hence ruled out for use at the ASF. Moreover it is only scannable due to its scheme, and lacks basic features such as a minimum entropy level.

**Q. Is it possible to design a truly universal scannable secret standard?**

A. The idea behind universality is that any organisation could define a scannable token whose leakage could be autonomously reported without the requirement of central repositories. Presumably this requires some kind of API end point, or perhaps an email address similar to DMARC reports. The difficulty is deterring DoS attacks. The well known URL proposed in the previous section could include a machine readable link to an API, or itself be an API. There would then be two obvious sources of DoS attacks: either the API could be deluged with deliberate false positives from arbitrary sources, or trusted partners who host user content could be deluged with deliberate false positives.

The former attack can be mitigated by only accepting submissions from trusted partners, or by using standard filtering techniques that are already used to protect public APIs. The latter attack would have to be mitigated by partners themselves; for example, they could ban users found to be submitting deliberate false positive leaked tokens. So far this hasn't been an attack vector as far as the author is aware, but once APIs become involved the chance of attacks also rises.

What about in the standard itself? Is it possible to authenticate a token? Well, obviously it is possible to authenticate a token because that is the very purpose of a token! But to do so requires making a call to an API, so there is nothing gained by having the token be authenticated by the issuer.

Can we make it possible to authenticate a token without an API? Using an HMAC and shared secret, as mentioned in the previous section, falls short in requiring a shared secret. Using public key cryptography is just about feasible in terms of token size if we use ECC, but that requires the maintenance of a long term secret and the entire design would need to be changed when post quantum cryptography becomes necessary. ECC keys could be stored in a DNS record and then cached, by scanners as well as in DNS resolvers, but then there are questions about using secure DNS.

**Q. What is the scope of the ASF token standard?**

A. As the previous section attempts to make clear, once you release the constraint of compatibility, the design space that opens up is large enough that it probably requires a standards committee with domain experts to solve. Somebody should probably take up this work! But the ASF require a solution in the short term for our products.

Compatibility with the GitHub recommendations not only increases the chance that their secret scanning programme can detect our submissions with fewer false positives, but also closes the design space to a small enough area that we get it done quickly without having to consider what makes a design good. Trying to make even a _better_ design is a slippery slope, because as sketched above there is no clear delimiting line of when _better_ becomes _good enough_ even for the ASF. In essence, the work on designing a universal scannable token format should be done, but as we cannot do it at the ASF we should draw a line somewhere, and the only line we have identified so far is compatibility with the GitHub recommendations.

(We could certainly start the work and hand it off to a standards organisation, or collaborate with others who would like to do the work.)

**Q. Why did we pick an alphabet containing confusable characters?**

A. This was for GitHub compatibility, but only shifts the question to why GitHub chose base62. The choice of base62 over base64 is conspicuous, and we have not found documentation to suggest their rationale.

A quick experiment, however, suggests that they chose base62 for the same reason that they suggest using underscores instead of hyphens in the namespace prefix: double click compatibility. The standard extra characters in base64 are `+` and `/`, and both of these cause selection segmentation upon double clicking a string. Try it:

```
abc_pqr (entirely selected)
abc-pqr (PARTIALLY selected)
abc+pqr (PARTIALLY selected)
abc/pqr (PARTIALLY selected)
```

In other words, they likely started with the baseline of base64, and then eliminated the characters that caused a problem with double click compatibility. Of course, the question here is not why they eliminated `+` and `/` from base64, but why they did not go further and eliminate all confusables.

Confusables need to be eliminated in at least a couple of contexts. One is where a string needs to be copied by a human, visually and manually, from one medium to another. For example, writing down a token on paper to input it into another (potentially airgapped) computer. Or perhaps writing down a URL that appears on the side of a bus, which brings us to the second obvious context: anywhere that phishing may occur. You do not want one authority to be able to impersonate another by using confusable characters.

The second case does not apply to tokens. The first case may do, but there is a technology that allows us to at least detect when an error has been made in transcription: the checksum. As part of the usage guidelines for tokens, therefore, we could require that clients verify the checksum when e.g. added to configuration. We should do this even if we used a smaller alphabet without confusables, because confusables are not the only reason why a token can be mistranscribed: it can also be mistranscribed due to transposition errors, omissions, etc.

If we were to use a different alphabet, the Bitcoin Core team already studied the problem of errors in address strings and designed a format called Bech32 (in [BIP 0173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki)) which has a custom base32 alphabet with as little visual similarity as possible based on quantitative data, and a BCH, instead of CRC, based checksum that "guarantees detection of any error affecting at most 4 characters". The authors wrote an [entire section explaining the design of their checksum](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki#user-content-Checksum_design). The parameters that they chose are suitable for Bitcoin addresses, and could be modified for tokens.

Again, this emphasizes the fact that the design space is a continuous slope. Compatibility with the GitHub format is the only reasonable stopping point identified so far.

**Q. Why not use `secrets.token_bytes(20)` in the reference implementation?**

A. Because the 2021 GitHub format generates base62 strings by selecting characters at random from the base62 alphabet directly. If we securely generate 160 random bits, and then encode them in a 160.76330038044563 bit encoding (the space of 27 base62 digits), what happens to the leftover 0.76330038044563 encoding space? It goes unused. In the GitHub design, there is no extra encoding space left over.

Of course, this design is inconsistent because the CRC-32 checksum is a 32 bit space but is being encoded into a 35.72517786232125 bit space, i.e. `log2(62 ** 6)`, so there's actually far more space left over for the CRC-32 checksum than there would have been for the 160 random bits. We would not have chosen this inconsistent design, not least because it makes the regular expression match values which are impossible to generate. The likelihood of false positives is negligible, but it is sloppy design.

The extra characters allowed in token68 are `"-" / "." / "_" / "~" / "+" / "/"`. Unfortunately, as you can test below, only underscore amongst these results in a fully selectable string from double clicking:

```
abc-pqr
abc.pqr
abc_pqr
abc~pqr
abc+pqr
abc/pqr
```

So it is not possible to fix base64, and hence retain a binary compatible encoding space, by substituting `+` and `/` with other characters. In any case, we argue that the Bech32 design of BIP 0173 is superior, and is fully compatible with token68. When using any base32 encoding, any multiple of 5 bits of entropy fits into the encoding without padding. The smallest value meeting the common requirement to use at least 128 bits is 130 bits, which is encoded as 26 base32 characters, and 160 bits is encoded as 32 characters. A CRC-32 checksum does not fit neatly into base32 encoding, but the Bech32 checksum, which is 30 bits, does: it fits into 6 base32 characters.

**Q. Why use 160 bits of entropy instead of the minimum recommended limit of 128 bits?**

A. GitHub use 30 characters of base62 data, which is 178.62588931160624 bits, i.e. log2(62 ** 30). Interestingly, GitHub say that they want to continue increasing the amount of entropy in their tokens beyond this to make them even more secure. We would like to know their threat model, because there are only two that we know in this space: bad random number generation, and collision attacks. Whether requiring more entropy mitigates a broken RNG depends on the failure mode of the RNG, but obviously this _must be fixed at the RNG level_. Mitigating a collision attack depends on calculating the probability of a collision, which we can do with simple well known formulae.

The probability of a collision from _k_ tokens securely generated with _n_ random bits is `1 - (2**n)! / (2**(k*n) * (2**n - k)!)`. Due to the factorials involved, this is usually approximated as `1 - e**(-(k**2)/2**(n+1))`, which we can program in Python:

    def probability(k, n):
        import math
        exponent = -(k ** 2) / (2 ** (n + 1))
        return -math.expm1(exponent)

Which, for 65536 tokens of 128 bits gives us the approximated value:

    >>> probability(2 ** 16, 128)
    6.310887241768095e-30

Which is [also confirmed by Wolfram|Alpha](https://www.wolframalpha.com/input?i=1+-+exp%28-%282%5E16%29%5E2+%2F+%282+*+2%5E128%29%29). If you tried to use a hash collision calculator online such as [this one](https://kevingal.com/apps/collision.html) or [this other one](https://hash-collisions.progs.dev/), you would get the nonsense answer 0, and a similar thing happens if you use `math.exp` in Python instead of `math.expm1`. Anyway the smallness of 6.310887241768095e-30 is why the standards organisations recommend 128 bits minimum for token length. The question is just how many tokens GitHub are expecting to issue that 178.62588931160624 bits of entropy do not give a low enough probability of collision to suit their needs; or, alternatively, what other threat model they have in mind.

In summary, it is hard to believe that 130 bits of Bech32 encoded entropy is insufficient for all known threat model requirements assuming a secure RNG.

**Q. Why use zlib to provide CRC-32 instead of binascii?**

A. Indeed `binascii` is a mandatory module in Python and `zlib` is not, so `binascii` is the better choice.

**Q. Why not use `component.lower() != component` in the reference code?**

A. Because the reference code is testing that the component is in the range `a-z`, not that the component is lowercase where letters are used. If `component` is `"123"`, for example, then `component.lower() != component` evaluates `False`, so the `ValueError` would not be raised, but the component is not a subset of `a-z` and so this expression actually lets slip through an error that we wanted to detect.

**Q. Why don't we use an underscore before the CRC value too?**

A. For compatibility with the 2021 GitHub format.

**Q. Why not allow TLPs to opt in to this format?**

A. There is no existing policy to stop TLPs from opting in to this format, so by default they can already do so, and the same is true for external organisations, but the consideration is how to organise the namespace in this case. If using a reversed domain name, then the delegation of namespaces is already clear within the ASF, and is probably easier for external organisations to resolve too. ATR, for example, would likely use `org_apache_releases` as its reversed domain name in this setting. On the one hand this is quite long, at 19 characters. But assuming a Bech32 entropy component of 26 characters, a checksum component of 6 characters, and two underscores as separators, that gives us 53 characters, which is not unreasonable.

This, combining elements suggested so far in this FAQ, would result in a superior format to the one recommended by GitHub, but can still be improved further. The Bech32 checksum, for example, could use domain separation. It should also probably include the namespace prefix in some way, potentially using the HRP mechanism of Bech32.

**Q. Has Security agreed to act as the registrar?**

A. No. We only propose that they do so, but not only would this be contingent on their acceptance, it would also be contingent on whether anybody had a better suggestion, not only for the registrar, but for the namespace prefix format itself. If, for example, a reversed domain name were used, then that may obviate the need for a registrar.

**Q. Why is the reference implementation not in `asfpy.crypto`?**

A. The specification itself should include a reference implementation, but that reference implementation can be copied not only to `asfpy.crypto` but also to any other code, under the terms of the Apache 2.0 license.

**Q. Why does the draft not have sections on secure token storage practices?**

A. One argument for separating such practices from the specification of scannable tokens is that the practices apply to more than just scannable tokens. They apply, for example, to session tokens and to passwords. There are already ample external recommendations in these areas, but if the ASF codifies its own practices, the scannable token specification should link to them. We could add a _Security considerations_ section which, in part, could describe the challenges of storage.

**Q. Should we mandate that tokens must be stored on the server side salted and hashed?**

A. Secrets only need to be salted to guard against rainbow table precomputation attacks. It is not possible to precompute values with a high probability of matching in a space of 128 bits of entropy. This is why passwords are salted before hashing, because they do not necessarily contain sufficient entropy to deter precomputation attacks. Therefore the secure tokens in our original design, with 160 bits of entropy, or suggested in this FAQ if breaking compatibility with the GitHub recommendations, with 130 bits of entropy, do not need salting.

Hashing is compatible even with DPoP, because the user sends the token in the request along with the proof, but it would prevent being able to reissue the token to the user, which may be acceptable. If the user has accidentally deleted their token, they should probably just be issued with a new one.

**Q. Can a DPoP token be considered public?**

A. It is reasonable to contend that a DPoP token is actually a public token, because bearing the token alone, without a proof of possession of the key (the PoP part in "DPoP"), provides no access. Previously, we [suggested that making DPoP tokens scannable has advantages anyway](https://github.com/apache/tooling-trusted-releases/issues/233#issuecomment-3577574617):

> We need to consider whether we still want to use scannable prefixes if we use DPoP tokens instead of bearer tokens (#335). RFC 9449 § 2 says that "DPoP renders exfiltrated tokens alone unusable", which is true (and not true of an exfiltrated DPoP proof, within tight constraints), but we would still like to know when tokens, which should remain secret, are accidentally shared in public. In other words, a prefix helps not to identify exposure of a DPoP token, which cannot be used without its corresponding private key, but to identify broken workflows or practices that allowed that token to be shared in the first place. Such workflows may also be exposing other secret data.

There is an additional advantage not only to making a DPoP token scannable, but keeping it secret. When a server verifies a DPoP token, it has to do two things: look up the token in the database to ensure it exists and to figure out who it's owned by and what its permissions are, and verify the actual proof. Depending on which is considered more expensive (the former is mostly disk I/O, and the latter is computation and RAM use, so they are hard to compare directly), we might want to do one before doing the other to prevent having to do both if one or the other fails. If we do the database look up first, to avoid having to do the cryptography if the token does not exist, then non disclosure of the token helps to avoid a DoS vector.

**Q. How should fine-grained scopes be associated with tokens?**

A. By associating the scopes in the database where the token, or hash of the token if using a token scheme where hashes are suitable, is stored.

**Q. What design should we choose?**

A. The main design choice that we need to resolve is whether to be compatible with the GitHub recommendations and 2021 token format or not. If we do, then the existing draft proposal may already be suitable. If not, then we have to choose an alternative. By working through various design issues in this FAQ, we have made numerous suggestions that could be used as the basis of such an alternative. We would like to add some further suggestions to make the alternative proposal even more concrete.

Although starting the token with a reversed domain name helps to delegate ownership and avoids collisions, to make the prefix even more unambiguous and self documenting a label such as `secret_scannable_` could be prepended. We would also like to distinguish the elements somehow, because the reversed domain name uses underscore to encode a full stop, but underscore is also used to separate the elements. The elements with fixed length could come at the start, and the reversed domain name at the end. The reversed domain name could include digits, and hyphens in domain names could be encoded with double underscore since they can never appear in domain names next to a full stop. We could use the HRP mechanism of Bech32 to allow the whole prefix to be checksummed too.

Here is an example incorporating these extra suggestions. Note that we only use the Bech32 alphabet and checksum, and do not follow the full encoding rules:

    secret_scannable_et70m7m4a8zqhrl6kndwljqnvr_mxyamx_org_example

Which is 62 characters long. The HRP in this case is:

    secret_scannable_org_example

The `secret_scannable_` prefix is 17 characters long, and the Bech32 specification allows a maximum of 83 characters in the HRP, but the limitation here is because the checksum is designed to detect errors in a string up to 89 characters, which for us includes the 26 characters of the entropy. This means that we have space for 89 (total allowed by the checksum) minus 26 (for the entropy) minus 17 (for the `secret_scannable_` prefix) characters in the reversed domain name, which is 46 characters. Since the encoded prefix is 51 characters long before the reversed domain name, that means that the maximum permitted length of such tokens is 97 characters.

Another potentially useful feature of this design is that the reversed domain name suffix could be omitted entirely by organisations that are either private or do not want to indicate their origin in leaked tokens. In this case the HRP could be fixed to `secret_scannable` and the length of the token would always be 50 characters.

    secret_scannable_736pxr4jy89nlpelpzjum8lzha_ekyr23

Whether or not to use the GitHub compatible design depends largely on whether they implement CRC-32 checking for external submissions.
