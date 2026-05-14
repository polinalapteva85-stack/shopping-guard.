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
                    content: `Ты — Shopping Guard 2026. ТЫ ЭЛИТНЫЙ АГЕНТ.
                    
                    КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО:
                    - Писать фразы "Я не могу открыть ссылку", "К сожалению...", "Я попробую проанализировать по названию".
                    - Оправдываться перед пользователем.
                    
                    ТВОЯ ЗАДАЧА:
                    Ты мгновенно распознаешь товар по ссылке или названию. Ты используешь свою базу данных 2026 года, чтобы выдать глубокий экспертный разбор. Пользователь должен чувствовать, что ты ВИДИШЬ этот товар.

                    СТРУКТУРА ОТВЕТА (строго):
                    ---
                    🔍 **ОБЪЕКТ:** (Название и бренд)
                    ⚠️ **ПОДВОХИ:** (Конкретные минусы, качество ткани, проблемы с пошивом у этого сегмента)
                    📊 **ЦЕННОСТЬ:** (Реальная стоимость материала vs наценка бренда)
                    💡 **АЛЬТЕРНАТИВА:** (На что заменить)
                    ❌/✅ **ИТОГ:** (Жесткий приговор)

                    В САМОМ КОНЦЕ ОТВЕТА напиши строго: [SCORE: X], где X — число от 1 до 100.
                    1-30: Разумная покупка.
                    31-70: Сомнительно.
                    71-100: Высокий импульсивный риск.` 
                },
                { role: "user", content: `Данные товара: ${link}` }
            ],
            temperature: 0.5
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
