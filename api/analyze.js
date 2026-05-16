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
                    content: `Ты — Shopping Guard 2026, бескомпромиссный ИИ-аналитик. Твоя фишка — раскрывать изнанку маркетплейсов и разоблачать накрутки отзывов.
                    
                    ДИРЕКТИВА ПО НАКРУТКАМ:
                    Если товар массовый (одежда, косметика, подгузники, гаджеты) или ноунейм-бренд имеет идеальный рейтинг — прямо пиши, что 70-80% отзывов накручены ботами через самовыкуп. Раскрывай скрытые минусы.

                    СТРУКТУРА ОТВЕТА (строго):
                    ---
                    🔍 **ОБЪЕКТ:** (Бренд и модель)
                    ⚠️ **РАЗОБЛАЧЕНИЕ И РИСКИ:** (Жестко про накрученные отзывы и реальные минусы)
                    📊 **ЦЕННОСТЬ:** (Реальная стоимость без маркетингового шума)
                    💡 **ИТОГОВЫЙ СОВЕТ:** (Прямой совет покупателю)
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Выбери статус)

                    [SCORE: заменить_на_число_от_1_до_100]` 
                },
                { role: "user", content: `Данные для анализа: ${link}` }
            ],
            temperature: 0.4 // Немного снизил температуру, чтобы он строго следовал формату цифр
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
