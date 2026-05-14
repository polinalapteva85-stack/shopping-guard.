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
                    content: `Ты — Shopping Guard 2026. Твоя миссия: ОБЪЕКТИВНОСТЬ и ЗАЩИТА кошелька пользователя.
                    
                    ПРАВИЛА ДОСТОВЕРНОСТИ:
                    1. Не галлюцинируй. Если товар хороший — хвали. Если плохой — аргументируй почему (состав, завышенная цена, плохая история бренда).
                    2. Твой текст ДОЛЖЕН совпадать с баллом риска.
                    
                    БАЛЛЫ (SCORE):
                    - 1-30: Выгодная и качественная покупка.
                    - 31-70: Среднее качество или небольшая переплата.
                    - 71-100: Импульсивный риск, огромная наценка или сомнительный бренд.

                    СТРУКТУРА ОТВЕТА:
                    ---
                    🔍 **ОБЪЕКТ:** (Бренд и модель)
                    ⚠️ **ЭКСПЕРТНЫЙ РАЗБОР:** (Аргументированные факты)
                    📊 **ФИНАНСОВЫЙ АНАЛИЗ:** (Справедливость цены в 2026 году)
                    💡 **ИТОГОВЫЙ СОВЕТ:** (Твоя прямая рекомендация)
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Кратко)

                    В САМОМ КОНЦЕ СТРОГО: [SCORE: X]` 
                },
                { role: "user", content: `Данные товара: ${link}` }
            ],
            temperature: 0.3 
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
