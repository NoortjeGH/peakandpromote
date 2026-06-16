require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

app.post('/api/analyze', async (req, res) => {
  const { naam, bedrijfsnaam, branche, probleem } = req.body;

  if (!naam || !bedrijfsnaam || !branche || !probleem) {
    return res.status(400).json({ error: 'Vul alle velden in.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key niet geconfigureerd op de server.' });
  }

  const prompt = `Je bent een AI-consultant bij Peak & Promote, een bedrijf dat MKB-bedrijven helpt met AI en automatisering. Een potentiële klant heeft een vraag ingediend. Analyseer dit en geef een concreet, enthousiast advies.

Klantinformatie:
- Naam: ${naam}
- Bedrijfsnaam: ${bedrijfsnaam}
- Branche: ${branche}
- Probleem/uitdaging: ${probleem}

Geef je antwoord UITSLUITEND als geldig JSON (geen markdown, geen code block), in dit formaat:
{
  "oplossing": "Concreet AI of automatiserings-idee in 2-4 zinnen. Wees specifiek voor de branche.",
  "aanpak": ["Stap 1", "Stap 2", "Stap 3", "Stap 4"],
  "tools": ["Tool of technologie 1", "Tool of technologie 2", "Tool of technologie 3"],
  "prijscategorie": "klein",
  "prijsbedrag": "€500 – €2.000",
  "prijsuitleg": "Uitleg waarom deze prijs past bij dit project (1-2 zinnen).",
  "tijdsinschatting": "2-3 weken"
}

Prijsregels:
- "klein" / "€500 – €2.000": simpele automatisering, koppeling tussen 2 apps, kleine chatbot
- "middel" / "€2.000 – €7.500": maatwerk automatisering, AI-assistent, meerdere koppelingen
- "groot" / "€7.500+": volledige AI-implementatie, meerdere systemen, training + onderhoud

Schrijf in het Nederlands. Wees enthousiast, praktisch en to-the-point.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API fout:', err);
      return res.status(500).json({ error: 'Fout bij het ophalen van AI-advies.' });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error('Server fout:', err);
    res.status(500).json({ error: 'Er is iets misgegaan. Probeer het opnieuw.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Peak & Promote draait op http://localhost:${PORT}`);
});
