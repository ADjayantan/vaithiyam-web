import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const systemPrompt = `You are அகஸ்தியன் (Agasthiyan), a knowledgeable AI assistant for Vaithiyam, specializing in Siddha medicine, Ayurveda, and traditional Tamil herbal remedies. Respond in simple Tamil or Tamil-English mix. Keep responses brief (2-3 sentences). Do not diagnose diseases or replace doctors. When asked about a specific herb or medicine, give its Tamil name, tradition (Siddha/Ayurveda), and main uses.`;

    // ─── 1. Try Google Gemini API if key is present ──────────────────────────
    if (geminiKey) {
      try {
        const contents = (history || []).map((h: { role: string; content: string }) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        }));
        contents.push({ role: 'user', parts: [{ text: message }] });

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.7,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply });
          }
        } else {
          const errText = await response.text();
          console.error('Gemini API error response:', errText);
        }
      } catch (err) {
        console.error('Failed to query Gemini API:', err);
      }
    }

    // ─── 2. Try Anthropic API if key is present ──────────────────────────────
    if (anthropicKey) {
      try {
        const formattedMessages = (history || []).map((h: { role: string; content: string }) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content,
        }));
        formattedMessages.push({ role: 'user', content: message });

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 300,
            system: systemPrompt,
            messages: formattedMessages,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.content?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply });
          }
        } else {
          const errorText = await response.text();
          console.error('Anthropic API error response:', errorText);
        }
      } catch (err) {
        console.error('Failed to query Anthropic API:', err);
      }
    }

    // ─── 3. Fallback to Local Mock Simulator ─────────────────────────────────
    console.warn('No active AI API key resolved or queries failed. Falling back to local mock response.');
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.json({ reply: getFallbackResponse(message) });
  } catch (error) {
    console.error('Agasthiyan API error:', error);
    return NextResponse.json({ reply: 'ஏதோ பிழை ஏற்பட்டுள்ளது. மீண்டும் முயலவும்.' });
  }
}

function getFallbackResponse(msg: string): string {
  const lowerMsg = msg.toLowerCase();
  
  if (lowerMsg.includes('நெல்லிக்காய்') || lowerMsg.includes('amla')) {
    return 'நெல்லிக்காய் (Amla) என்பது ஒரு காயகல்ப மூலிகையாகும். இது வைட்டமின் சி மற்றும் ஆன்டி-ஆக்ஸிடன்ட்கள் நிறைந்தது, நோய் எதிர்ப்புச் சக்தியை அதிகரிக்கவும் கூந்தல் ஆரோக்கியத்திற்கும் பயன்படுகிறது.';
  }
  if (lowerMsg.includes('கடுக்காய்') || lowerMsg.includes('haritaki')) {
    return 'கடுக்காய் (Haritaki) திரிபலா சூரணத்தில் ஒரு முக்கிய மூலப்பொருள் ஆகும். இது சித்த மருத்துவத்தில் குடல் சுத்திகரிப்புக்கும், செரிமானம் மற்றும் மலச்சிக்கலைத் தீர்க்கவும் பயன்படுகிறது.';
  }
  if (lowerMsg.includes('துளசி') || lowerMsg.includes('tulsi')) {
    return 'துளசி (Holy Basil) காய்ச்சல், இருமல், மற்றும் சளித் தொல்லைகளுக்கு சிறந்த கிருமிநாசினியாகும். இது சுவாசப் பாதையை சீராக்க உதவுகிறது.';
  }
  if (lowerMsg.includes('இருமல்') || lowerMsg.includes('சளி') || lowerMsg.includes('cough') || lowerMsg.includes('cold')) {
    return 'இருமல் மற்றும் சளிக்கு அதிமதுரம், துளசி, கற்பூரவல்லி மற்றும் ஆடாதோடை இலைச் சாறு சிறந்த பலன் தரும். சுடுதண்ணீரில் இவற்றை கஷாயமாக அருந்தலாம்.';
  }
  if (lowerMsg.includes('வணக்கம்') || lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    return 'வணக்கம்! நான் அகஸ்தியன் AI உதவியாளர். சித்த, ஆயுர்வேத மூலிகைகள் மற்றும் பாரம்பரிய ஆரோக்கிய வழிமுறைகள் குறித்து உங்களுக்கு உதவ நான் தயாராக உள்ளேன். எதைப் பற்றி அறிய விரும்புகிறீர்கள்?';
  }
  
  return 'வணக்கம்! நான் சித்த மற்றும் ஆயுர்வேத மருத்துவத்தில் தேர்ச்சி பெற்ற அகஸ்தியன் AI. மூலிகைகள் அல்லது ஆரோக்கியக் குறிப்புகள் பற்றி என்னிடம் கேட்கலாம். அவசர மருத்துவக் கோளாறுகளுக்கு தகுதியான மருத்துவரை அணுகவும்.';
}
