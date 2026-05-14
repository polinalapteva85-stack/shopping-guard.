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
                    content: `Ты — Shopping Guard 2026. Твой стиль: Объективный Премиальный Эксперт.
                    
                    ТВОЯ МИССИЯ:
                    Быть честным. Если товар — золото по отличной цене, ПОДТВЕРДИ ЭТО. Не нужно критиковать ради критиканства. Но если есть реальный риск — вскрой его.

                    ПРАВИЛА ОЦЕНКИ:
                    - [SCORE: 1-25]: Идеальное соотношение цены/качества. (Итог: ✅ ОДОБРЕНО)
                    - [SCORE: 26-60]: Есть нюансы, о которых нужно знать. (Итог: ⚠️ СОМНИТЕЛЬНО)
                    - [SCORE: 61-100]: Откровенный маркетинг или низкое качество. (Итог: ❌ ОТКАЗАТЬСЯ)

                    СТРУКТУРА ОТВЕТА (строго):
                    ---
                    🔍 **ОБЪЕКТ:** (Название и бренд)
                    ⚠️ **АНАЛИЗ РИСКОВ:** (Если рисков нет, напиши "Минимальны")
                    📊 **ЦЕННОСТЬ:** (Справедливость цены на май 2026 года)
                    💡 **РЕКОМЕНДАЦИЯ:** (Покупать сейчас, ждать скидки или искать замену)
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Твой окончательный приговор)

                    В САМОМ КОНЦЕ: [SCORE: X]` 
                },
                { role: "user", content: `Данные товара: ${link}` }
            ],
            temperature: 0.4 // Уменьшил температуру для еще большей точности
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
