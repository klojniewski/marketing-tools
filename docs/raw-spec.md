  
Tools: Google search console \+ Ahrefs \+ Google Sheets

## Stage 1: Fetch & Immediately Filter Blog Posts (start directly from GSC)

### 1.1 Google Search Console API (Search Analytics) 

   \- Report: Performance → Pages    
   \- Parameters:    
     \- dimensions: \["page"\]    
     \- metrics: \["impressions", "clicks"\]    
     \- startDate / endDate: Period A    
     \- compareStartDate / compareEndDate: Period B    
     \- page: regex \`^/blog/.\*$\`    
     \- impressions \> 500 (configurable)

### 1.2. Immediate cleanup – remove URLs with fragments (\#) 

   \- Exclude any URL containing \`\#\`.

### 1.3. Calculate drop metrics  

   \- impressions\_diff \= impressions\_A – impressions\_B    
   \- clicks\_diff\_percent \= ((clicks\_A – clicks\_B) / clicks\_B) \* 100 (if clicks\_B \= 0 → \-100%)

### 1.4. Filter by drop size  

   \- Keep only pages where:    
     \- impressions\_diff \< \-500    
     \- clicks\_diff\_percent \< \-30%

### 1.5. Topic filter  

   \- Check URL/title for: \`sanity|cms|migration|next\\.js|nextjs|next js|seo|ai|headless cms|artificial intelligence\`    
   \- If match → “Important” \= Yes

### 1.6. Save to Sheet  

   \- Tab “Candidates” with columns: URL, Impressions A/B, Diff Impressions, Clicks A/B, Clicks Diff %, Important (Yes/No)

Only Important \= Yes pages proceed.

## Stage 2: Deep Analysis of Each Important Blog Post

2.1. Ahrefs Site Explorer → Overview    
   \- Organic Traffic, UR, Referring domains (90-day change).

2.2. Backlinks    
   \- All lost backlinks (last 90 days, DR \> 20).    
   \- Output: total count \+ top 3–5 summary.

2.3. Organic Keywords (Exact URL)    
   \- Last 90 days vs previous 90 days.    
   \- Filters: position\_declined OR position\_lost.    
   \- Sort: volume desc.    
   \- Collect ALL lost keywords \+ total lost volume.

## 3.4. SERP Analysis – only for 1–3 most valuable lost/declined keywords

1. From the full list of all lost/declined keywords for the page (obtained in 3.3), first apply strict junk filtering and irrelevance removal. Exclude the keyword completely if **any** of the following conditions are met:  
   * Search volume \< 100 (or \< 50 if the blog is very niche)  
   * KD (Keyword Difficulty) \> 60–70 (if KD data is available in Ahrefs) — almost impossible to recover without heavy link investment  
   * Keyword contains brands/services you do not work with (e.g. "webflow migration", "wordpress to sanity", "contentful next.js")  
   * Keyword is clearly unrelated to the article's topic (does not contain any words from priority list: sanity, cms, migration, next.js/nextjs, seo, ai, headless cms, etc.)  
   * Keyword is too broad/non-intent: "what is cms", "best seo tool", "what is ai" (if the article is not overview/informational)  
   * Keyword is commercial while the article is purely informational (e.g. "buy next.js development", "order sanity migration")  
2. For the remaining keywords after filtering, calculate a **Value Score** (can be implemented in code or in Google Sheets):  
   text  
   Score \= (Volume × 0.4) \+ (Traffic\_loss × 0.5) \+ (Position\_before × 0.1) – (KD × 0.05 if KD available)  
   * Traffic\_loss — lost traffic for the keyword (Ahrefs Traffic change, take absolute value of negative)  
   * Position\_before — position before the drop (lower number \= better, e.g. 3 \> 12\)  
   * KD — if \>70, score drops significantly  
3. Select **maximum 3 keywords** with the highest Score (usually 1–2 most impactful ones are enough).  
4. If after filtering and scoring 0–1 keyword remains → set column "Should we update?" to "Doubtful" or "No – low value keys".  
5. Perform full SERP analysis **only** for these 1–3 selected keywords:  
   * Retrieve position history for the last 90 days (Ahrefs Rank Tracker or Keywords Explorer → History)  
   * Retrieve current SERP top 20  
   * Retrieve historical SERP at the start of the noticeable drop (or closest available snapshot)  
   * Compare “before” vs “now”:  
     * Which URLs newly appeared in top 10  
     * Which rose significantly (e.g. from 15–20 to 1–5)  
     * Which displaced our page downward  
6. For each displacing competitor (up to 5–7 per keyword, but no more than 20–25 total per page):  
   * Open the URL in Ahrefs Site Explorer  
   * Collect:  
     * DR (Domain Rating) of the domain  
     * UR (URL Rating) of the page  
     * Estimated organic traffic of that page  
     * Number of new backlinks in the last 90 days (especially sharp spikes during drop period)  
   * Classify the displacement reason:  
     * **High authority** — DR \> 70 \+ high page traffic \+ stable link profile  
     * **Content update** — noticeable growth in new backlinks \+ traffic growth on that page in last 90 days  
     * **New article** — page first indexed less than 6 months ago  
     * **Other** — cannot be clearly classified

## 4\. Stage 3: LLM-Powered Content Gap Analysis & Update Recommendations 

After collecting competitors, the script \*\*automatically prepares and sends\*\* a structured prompt to an LLM (Claude / GPT / Grok).

**\*\*Exact LLM Prompt Template\*\* (copy-paste ready):**

\`\`\`  
You are a senior SEO strategist and content auditor for 2026, specialized in technical blog posts about Sanity CMS, Next.js, AI SEO, headless CMS, and migrations.

My article: \[OUR\_ARTICLE\_URL\]  
Main lost keywords: \[LIST\_OF\_ALL\_LOST\_KEYWORDS\]  
Total lost search volume: \[TOTAL\_LOST\_VOLUME\]

Competitors that displaced us (with classification):  
\[LIST\_OF\_COMPETITORS\_WITH\_METRICS\_AND\_CLASSIFICATION\]

Task:  
1\. Fetch the full current content of my article and all competitor articles.  
2\. Perform a deep gap analysis using 2026 Google ranking factors (E-E-A-T, Information Gain, content depth, freshness, structure, user experience, code examples, tables, lists, schema, author signals).

Compare specifically:  
\- Title and meta description quality  
\- Introduction strength and hook  
\- Depth and completeness of explanations  
\- Code examples / live demos / GitHub links  
\- Tables, comparison matrices, step-by-step guides  
\- 2026-specific updates (new features, versions, best practices)  
\- Structure and readability (H2/H3, bullet points, bold, internal links)  
\- Visuals (images, screenshots, diagrams)  
\- Conclusion and CTA  
\- Overall helpfulness and uniqueness

Output ONLY in the following valid JSON format (no extra text):

{  
  "worse\_points": \["exact list of weaknesses with examples"\],  
  "strengths": \["what we still do better"\],  
  "what\_to\_add\_or\_update": \[  
    {  
      "section": "H2 title or new section name",  
      "action": "add / rewrite / expand / update data",  
      "details": "detailed description \+ suggested length in words",  
      "why": "reason based on competitors or lost keywords"  
    }  
  \],  
  "suggested\_new\_title": "full new title (under 60 characters)",  
  "suggested\_new\_meta\_description": "full meta (150-160 characters)",  
  "update\_plan\_summary": "one-sentence overall recommendation",  
  "estimated\_effort": "Small / Medium / Large (in hours)",  
  "priority": 1-5  
}  
\`\`\`

The script must:  
\- Replace all placeholders with real data.  
\- Send the prompt to the chosen LLM.  
\- Parse the JSON response.  
\- Store the results for the final sheet.

## 5\. Stage 4: Final Output – One Google Sheet

Create / update Google Sheet named \`SEO\_Update\_Queue\_2026\`

**\*\*Main tab: “Update Queue”\*\***

| № | URL of our article | Important topic | Impressions A (last 28d) | Impressions B (prev 28d) | Diff Impressions | Clicks Diff % | All lost keywords | Lost volume total | All lost backlinks | Main lost keyword | Competitor displacers | Displacement reason | Should we update? | Priority (1–5) | LLM worse\_points | What to add / update | Suggested new title | Suggested new meta | Update plan summary | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

**Here are just the column names from the "Update Queue" main tab (exactly as listed in the guide):**

1. **№**  
2. **URL of our article**  
3. **Important topic**  
4. **Impressions A (last 28d)**  
5. **Impressions B (prev 28d)**  
6. **Diff Impressions**  
7. **Clicks Diff %**  
8. **All lost keywords**  
9. **Lost volume total**  
10. **All lost backlinks**  
11. **Main lost keyword**  
12. **Competitor displacers**  
13. **Displacement reason**  
14. **Should we update?**  
15. **Priority (1–5)**  
16. **LLM worse\_points**  
17. **What to add / update**  
18. **Suggested new title**  
19. **Suggested new meta**  
20. **Update plan summary**  
21. **Notes**

**Additional recommended tabs:**  
\- “Raw GSC Data”  
\- “Lost Keywords Detail”  
\- “Competitor SERP Changes”  
\- “LLM Raw JSON” (for debugging)

After processing all pages, output the direct link to the updated Google Sheet.

