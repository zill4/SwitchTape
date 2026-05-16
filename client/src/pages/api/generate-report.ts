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

        const prompt = `You are a music personality analyst for an app called SwitchTape. You ground your analysis in established psychological frameworks — primarily the Big Five (OCEAN) model from personality psychology, supplemented with familiar cultural frameworks (MBTI, color theory, astrology) as accessible overlays.

Analyze the following music listening data and generate a personality report:
${JSON.stringify(analysisInput, null, 2)}

PSYCHOLOGY GROUNDING — how to derive Big Five from music data:
- Openness: high if diverse genres, deep cuts, varied eras, low mainstream; low if narrow/safe taste
- Conscientiousness: high if organized, consistent within genres; low if scattered
- Extraversion: high if upbeat/dance/pop/party music; low if introspective/ambient/lo-fi/sad
- Agreeableness: high if popular collaborative genres (pop, R&B, mainstream); low if abrasive/aggressive/avant-garde
- Neuroticism: high if melancholic/intense/emotional; low if upbeat/stable mood music
Use the music data signals (genres, popularity distribution, era spread, energy implied by genres) to assign scores honestly, not just for flattery. These are scientifically validated traits — calibrate carefully.

Generate a JSON object matching this EXACT schema:
{
  "listenerType": {
    "name": "The [Creative Name] (2-3 words max, e.g. The Nostalgic Rebel, The Crate Digger)",
    "tagline": "A witty one-liner about their music personality (under 30 words)"
  },
  "bigFive": {
    "openness": 0-100,
    "conscientiousness": 0-100,
    "extraversion": 0-100,
    "agreeableness": 0-100,
    "neuroticism": 0-100,
    "summary": "2-3 sentences explaining how their music maps to these traits — reference specific genres/patterns. Stay grounded in real personality psychology, no flattery."
  },
  "mbtiVibe": {
    "type": "4-letter MBTI code (e.g. INFP, ENTJ) that best matches their listening profile",
    "description": "1-2 sentences on why this MBTI type matches their musical sensibility — explicitly note MBTI is a cultural framework, not scientifically rigorous like Big Five"
  },
  "colorAura": {
    "name": "Evocative color name (e.g. Deep Indigo, Crimson Static, Sun-Bleached Gold)",
    "hex": "#hexcode that visualizes this aura",
    "meaning": "1-2 sentences on what this color signifies emotionally per color psychology and how it connects to their listening"
  },
  "metrics": {
    "nostalgia": 0-100,
    "energy": 0-100,
    "depth": 0-100,
    "range": 0-100,
    "mainstream": 0-100,
    "replay": 0-100
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
  "vibeTags": ["#lowercase-hashtag-vibes"] (exactly 10 hashtag mood tags, no spaces in tags),
  "topArtists": [
    { "name": "Artist Name", "count": number }
  ] (top 8 artists by track count from the data),
  "recommendedArtists": [
    { "name": "Artist Name", "reason": "1 sentence on why this fits their taste — reference a specific pattern in their data" }
  ] (exactly 8 artist recommendations. Choose real artists that complement their existing taste — adjacent genres, similar era/mood, or natural next steps. AVOID artists already in their topArtists.),
  "deepCutAnalysis": [
    "paragraph 1",
    "paragraph 2",
    "paragraph 3",
    "paragraph 4"
  ] (4 paragraphs analyzing personality through music. Witty, specific, reference actual artists/genres from their data. Music-journalist voice. 2-3 sentences each.),
  "compatibility": {
    "mostCompatible": "The [Type Name] — brief description of who they'd vibe with",
    "leastCompatible": "The [Type Name] — brief description of who they'd clash with",
    "celebrityMatch": "[Celebrity Name]'s Spotify probably looks a lot like yours"
  },
  "cosmicVibe": {
    "sign": "Astrological sign or archetype that best matches their listening energy (e.g. 'A Scorpio Moon listener' or 'Late-night Pisces energy')",
    "reading": "2-3 sentences of playful astrological reading tied to their music. Keep it tongue-in-cheek — astrology is the fun overlay, not the serious analysis."
  }
}

Rules:
- Big Five is the scientific anchor — calibrate scores honestly using the music data
- MBTI is a cultural overlay, acknowledge its limits in the description
- Color aura grounded in color psychology research
- Cosmic vibe is playful, not earnest
- Recommended artists must be real, well-known artists that genuinely fit
- Vibe tags: lowercase hashtags, no spaces (use camelCase or dashes)
- Deep cut analysis: music-journalist voice, specific, reference real artists/genres from their data`;

        const model = 'gemini-3-flash-preview';
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
                        thinkingLevel: 'high',
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
