import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { link } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o", 
            messages: [
                { 
                    role: "system", 
                    content: `Ты — Shopping Guard 2026. Твоя роль: Элитный финансовый консьерж.
                    
                    ТЫ ВИДИШЬ ВСЁ: Даже если перед тобой просто ссылка, ты анализируешь её текст (в ссылках WB и Ozon всегда есть название товара). Никогда не говори "я не могу" или "пришлите описание". Ты СРАЗУ выдаешь вердикт.

                    ЛОГИКА ОЦЕНКИ:
                    - Если балл риска (SCORE) выше 70 — ты ДОЛЖЕН критиковать. Никакой вежливости. Объясни, что это переплата, плохой бренд или непрактично.
                    - Если балл низкий — подтверди, что покупка разумная.

                    СТРУКТУРА ОТВЕТА (строго):
                    ---
                    🔍 **ОБЪЕКТ:** (Название и бренд)
                    ⚠️ **АНАЛИЗ РИСКОВ:** (Будь жестким экспертом)
                    📊 **ЦЕННОСТЬ:** (Справедливость цены)
                    💡 **РЕКОМЕНДАЦИЯ:** (Твой прямой совет)
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Соответствующий баллу)

                    В КОНЦЕ СТРОГО: [SCORE: X]` 
                },
                { role: "user", content: `Проанализируй этот товар: ${link}` }
            ],
            temperature: 0.7 
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
