import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { analysisInput } = await request.json();

        if (!analysisInput || !analysisInput.trackCount || analysisInput.trackCount < 5) {
            return new Response(JSON.stringify({ error: 'Not enough listening data' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const apiKey = import.meta.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const prompt = `You are a music personality analyst for an app called SwitchTape. Analyze the following music listening data and generate a personality report.

Here is the user's music data:
${JSON.stringify(analysisInput, null, 2)}

Generate a JSON object matching this EXACT schema:
{
  "listenerType": {
    "name": "The [Creative Name] (2-3 words max, e.g. The Nostalgic Rebel, The Crate Digger)",
    "tagline": "A witty one-liner about their music personality (under 30 words)"
  },
  "metrics": {
    "nostalgia": 0-100 (how retro their taste skews),
    "energy": 0-100 (how high-energy their music is),
    "depth": 0-100 (how emotionally complex their choices are),
    "range": 0-100 (how diverse across genres/eras),
    "mainstream": 0-100 (how popular their picks are, derive from averagePopularity),
    "replay": 0-100 (how likely they are to revisit the same songs)
  },
  "genreDNA": [
    { "genre": "Genre Name", "percentage": number }
  ] (top 5-6 genres by percentage, sorted descending, must sum to ~100),
  "eraMap": [
    { "decade": "1990s", "percentage": number }
  ] (all decades present in their data, sorted chronologically),
  "personalitySpectrum": [
    { "leftLabel": "CHILL", "rightLabel": "CHAOTIC", "value": 0-100 },
    { "leftLabel": "CLASSIC", "rightLabel": "MODERN", "value": 0-100 },
    { "leftLabel": "INTROSPECTIVE", "rightLabel": "ANTHEMIC", "value": 0-100 },
    { "leftLabel": "UNDERGROUND", "rightLabel": "MAINSTREAM", "value": 0-100 },
    { "leftLabel": "SOLO LISTENER", "rightLabel": "CROWD ENERGY", "value": 0-100 }
  ],
  "vibeTags": ["#lowercase-hashtag-vibes"] (exactly 10 hashtag mood tags, no spaces in tags, be creative and specific to their taste),
  "topArtists": [
    { "name": "Artist Name", "count": number }
  ] (top 8 artists by track count from the data),
  "deepCutAnalysis": [
    "paragraph 1",
    "paragraph 2",
    "paragraph 3",
    "paragraph 4"
  ] (4 paragraphs analyzing their personality through their music. Be witty, specific, reference actual artists/genres from their data. Write like a music journalist who knows their stuff. Each paragraph 2-3 sentences max.),
  "compatibility": {
    "mostCompatible": "The [Type Name] — brief description of who they'd vibe with",
    "leastCompatible": "The [Type Name] — brief description of who they'd clash with",
    "celebrityMatch": "[Celebrity Name]'s Spotify probably looks a lot like yours"
  }
}

Rules:
- Be creative, witty, and personality-driven
- Reference specific genres and patterns from the data
- The listener type name should be creative and memorable (e.g. The Nostalgic Rebel, The Midnight Crate Digger)
- Vibe tags should be lowercase hashtags with no spaces (use camelCase or dashes)
- Deep cut analysis should feel like it was written by a music journalist`;

        const model = 'gemini-3.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: prompt }] },
                ],
                generationConfig: {
                    responseMimeType: 'application/json',
                    thinkingConfig: {
                        thinkingBudget: -1,
                    },
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return new Response(JSON.stringify({ error: 'Failed to generate report' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const result = await response.json();

        const textPart = result.candidates?.[0]?.content?.parts?.find(
            (p: any) => p.text !== undefined
        );
        const content = textPart?.text || '';

        let report;
        try {
            report = JSON.parse(content);
        } catch {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                report = JSON.parse(jsonMatch[0]);
            } else {
                console.error('Failed to parse Gemini response:', content);
                return new Response(JSON.stringify({ error: 'Invalid report format' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        return new Response(JSON.stringify({ report }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error generating music report:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate music report' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
