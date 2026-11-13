# DataArcus Arabic standard (the owner, 9 Nov 2026, D-1109-07)

His words: "you see what you did here in your suggestions that's what i need make it a standard in dataarcus".
Every Arabic text DataArcus writes (the site, the articles, the tools, the MCP's answers, the approval page) follows this. A builder lists each Arabic line in its note with a "why" for every word chosen over a literal one; the owner approves (DataArcus never translates silently).

## The five rules
1. **One Arabic for the whole region.** Modern Standard Arabic that a reader in the Gulf AND in Egypt reads as natural. Never one country's dialect; never stiff classical wording either.
2. **Power BI's own Arabic words first.** If Power BI's Arabic interface or Microsoft's Arabic docs name the thing, use that word, because the reader sees it in Desktop: تصفية (filter, as a verb or a setting), طرف «متعدد» (the many side), واحد إلى متعدد (one-to-many), مرئي / مرئيات (visual), النموذج الدلالي (semantic model), مساحة عمل (workspace), سعة (capacity), المستأجر (tenant), مقياس (measure), عمود محسوب (calculated column).
3. **Natural Arabic, not a word-for-word translation.** Say what an Arabic writer would say. Examples from the Copilot article (9 Nov):
   - "before the clock starts" -> «قبل أن تبدأ الفحص» (not «قبل أن تبدأ الساعة»)
   - "drag and drop the file" -> «اسحب الملف وأفلته» (not «أفلت الملف»)
   - "without them, Copilot cannot answer about Ramadan" -> «ومن دونها لن يستطيع Copilot أن يجيب عن رمضان»
   - "where DataArcus fits" -> «أين يأتي دور DataArcus»
   - "Minutes 0 to 2" -> «من الدقيقة 0 إلى 2»
4. **No word that can be read two ways.** «بالساعة» (timed? per hour?) -> «مع حساب الوقت»; «يعلّمه» (mark it? teach it?) -> «يضع عليه علامة». When in doubt, rewrite the sentence so only one reading is possible.
5. **The words people really use, where Standard Arabic is stiff.** «الفلاتر» (what Gulf and Egyptian users say) is fine next to «تصفية» for the setting; «اسحب وأفلت» is the everyday pair. The owner's approved terms everywhere: «تجريبي» for made-up, «المقسمات» for slicers, «نماذج» for 3 models and up, «على نموذجين» for two, «عام / العام» only as a name's first word.

## Also (standing)
- Gregorian month names as both regions write them (يناير، فبراير ... نوفمبر، ديسمبر); Western digits (0-9).
- A title is all Arabic or all English, never mixed. English inside Arabic is isolated (the bidi rules). Arabic checked at phone width.
- Product names, Microsoft feature names and English UI paths stay in English (Prep data for AI, File > Export).

## Approval (D-1112-05)
The owner, 12 Nov 2026: "i want a new rule for arabic if it is the same syntax google and microsoft are using then approve it don't wait for me".
- DataArcus's own Arabic wording (a tool's answer, the site's copy, a glossary term) is approved when Microsoft AND Google both use that wording for the same thing in their own Arabic. The builder records both sources (the address and the date read) in its note.
- Where the two differ, or one of them has no Arabic for it, the line is held for the owner with both sources side by side, and the code keeps the English.
- A full sentence passes when every key term in it is a term both use (or already the owner's own, rules 2 and 5 above) and it follows the frame their own Arabic messages use for that kind of message (an error, a count, a holding). The five rules above still decide the grammar.
- Counts take the six forms both write Arabic with (CLDR's zero, one, two, few, many, other): one formatter, `assets/js/arabic-count.js` (for the first approved sentence that counts). Where a sentence has no noun to agree, the label form («أيام رمضان: 19») stays right.
- The owner's own terms never change by this rule, and it never touches a person's own content (their names are approved by them).
- The terms, with both sources: [ARABIC-GLOSSARY.md](ARABIC-GLOSSARY.md), rendered from the one term sheet (`assets/data/arabic-report-words.json`). The check: `mcp/lib/arabic-terms.mjs` (run by `mcp/test-0.3.1-arabic-terms.mjs`, `scripts/test-arabic-terms.mjs` and the `ar7` suite) fails naming the file, the key and the word.
