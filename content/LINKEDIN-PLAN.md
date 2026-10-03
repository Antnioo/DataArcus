# DataArcus on LinkedIn: the plan

What to post, when, and exactly how. Read it before writing a post; update the queue and the log after posting.
Last updated 2026-10-01 by the reviewer.

## Who posts
- **Abdelrahman's personal profile first**: every post is made there as its own post (video or images uploaded
  directly, never a repost). The DataArcus page gets the same post too, but isn't counted on for reach yet: a page
  repost of the Theme Generator post got 10 impressions in 4 days (2026-10).
- **Growing the page:** use the page's monthly "Invite to follow" credits on Power BI and data connections, a few at
  a time.
- **Profile basics (once):** headline "Power BI reports designed right, in minutes | Built for how the Gulf does business | dataarcus.com";
  the website in the profile's link; a featured section with the Theme Generator, the Model Health Check and the
  best-performing article.

## Rhythm
- **From week 3: one public finding a week on Tuesday** (owner 2026-10-03, the one-year direction): a real, reproducible test, in his own words; test notes in `findings/` of this repo.
- **3 posts a week:** Tuesday, Wednesday, Thursday, around 8:00-9:00 Gulf time (UAE). In Ramadan: after Iftar,
  about 21:00-22:00.
- **Every blog post becomes 3 LinkedIn posts** over two weeks: (1) the problem and the result, (2) one practical
  tip from it, (3) the tool in action. The article link goes in the first comment, not the post (LinkedIn shows
  posts with outside links to fewer people).
- **Language:** English by default; Arabic for Gulf topics (Ramadan, Hijri, Arabic reports), or both in one post
  (Arabic first, then English) when the topic is for both.

## Post types (rotate them)
| Type | What | Example from our work |
|---|---|---|
| Before / after | Two images side by side, 3 lines on what changed | The report redesign in 5 minutes |
| Real result | One number from a real check, what it means, what to do | "A quarter of the columns in Microsoft's own sample model are never used" |
| Tip | One problem, one fix, a short DAX snippet (as an image or code) | Sorting day names correctly with a sort-by column |
| Carousel | A PDF of 6-8 slides that teaches one thing | The 7 report styles by department |
| Tool demo | A 30-60 second screen recording, no voice needed | Theme Generator: brand colour in, theme and report out |
| Poll | A real question to the audience | "Which week start does your company's calendar use?" |
| Story | A short, honest lesson from building | "Why a test passed but the report was still cut off" |

## How to write a post
1. **First two lines decide everything** (that's what shows before "...see more"): the problem or the surprising
   number. No "I'm excited to share".
2. Short lines, white space, 120-250 words. One idea.
3. Show, don't claim: an image, a number, a snippet.
4. End with a real question that invites answers from experience.
5. 3 hashtags at most: #PowerBI plus one of #DAX, #DataAnalytics, #UAE, #DataVisualization.
6. Link to the article or tool in the first comment.

## Daily routine (15-20 minutes)
- In the first hour after posting: reply to every comment (it decides how far the post travels).
- On other days: 5 real comments on posts by Power BI people and Gulf data leaders. Add something useful, not "Great post".
- Note every question people ask under "Ideas" in `content/BLOG-PLAN.md`: that's the next article.

## Never
- The Model Health Check article was rewritten on 2026-10-03 (branch `content/health-check-rewrite`) on Microsoft's public COVID-19 sample; use it only after that branch is merged, and never the old "41% unused columns" numbers (the employer's model).
- Nothing from the owner's job: no employer name, dashboards, screenshots, customers or numbers. Only DataArcus test
  models and public data.
- No engagement bait ("comment YES"), no fake numbers, no posting a tool feature that isn't live yet.
- No tagging people who weren't part of the post.

## Queue (next 5 weeks, from the published articles; adjust freely; owner 2026-10-03: the Gulf calendar posts in week 2)
| Week | Tue | Wed | Thu |
|---|---|---|---|
| 1 | Theme Generator demo video (laptop view, voice-over) | The AI-readiness article: is your model ready for Copilot? | Tip: Prep data for AI in 3 steps (AI data schema, verified answers, AI instructions) |
| 2 (13-15 Oct) | Gulf calendar post 1: the problem and the result (`content/linkedin-gulf-calendar.md`) | Gulf calendar post 2: the tip | Gulf calendar post 3: the tool in action |
| 3 (20-22 Oct) | **Finding #1:** Microsoft's AI plugin on an Arabic report (dataarcus-engine `business/findings/`) | Real result: the Health Check on Microsoft's sample (score 84) | Carousel: 7 report styles by department |
| 4 (27-29 Oct) | **Finding #2:** our 34.0% mistake (English first) | Gulf (Arabic + English): comparing Ramadan sales year over year | Tip: the Hijri calendar in DAX |
| 5 | Finding #3 (from the backlog) | Real result: Pro vs PPU vs F64, when each one pays off | Tip: the licensing mistake that costs the most (the licensing calculator demo moves to week 7) |
| 6 | Finding #4 (from the backlog) | Tool demo: the DAX Measure Builder (video) | Poll: which week start does your calendar use? |
| 7 | Finding #5 (from the backlog) | Before / after: the report redesign (new Contoso images) | Tool demo: the licensing calculator |

**Ready to queue (after the Gulf calendar article is live):** three posts, Arabic then English, in
`content/linkedin-gulf-calendar.md`: (1) the problem and the result (27 announced dates, one differed from Umm
al-Qura; the UAE's 2022 weekend change), (2) tip: the Eid window measure, (3) tool demo: the Calendar Generator with
announced dates and country weekends. Two weeks, Tuesday to Thursday; best before Ramadan 2027 (around 8 February).

## Measure (once a month)
Followers, profile views, impressions and website clicks per post (LinkedIn analytics, and the site's analytics for
visits from LinkedIn). Write what worked and what didn't below, and change the next month's queue accordingly.

## Log
| Date | Post | Type | Impressions | Comments | Site clicks | Note |
|---|---|---|---|---|---|---|
| 2026-10 | MCP teaser video (31 s, square, silent; "coming soon", link to the Theme Generator in the first comment) | Tool demo | | | | Profile post (uploaded, not a repost), then the page |
