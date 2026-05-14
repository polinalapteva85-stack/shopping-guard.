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
                    content: `Ты — Shopping Guard 2026, элитный финансовый аналитик. 
                    Твоя цель: провести глубокую и жесткую "прожарку" товара, чтобы уберечь пользователя от импульсивной покупки. 

                    ИНСТРУКЦИЯ ПО АНАЛИЗУ:
                    1. ИДЕНТИФИКАЦИЯ: Пойми бренд и категорию.
                    2. ТЕХНИЧЕСКИЙ РАЗБОР: Расскажи о реальных проблемах (качество, состав, надежность).
                    3. АНАЛИЗ ЦЕНЫ: Оцени, насколько цена оправдана рынком 2026 года.
                    
                    СТРУКТУРА ОТВЕТА (строго):
                    ---
                    🔍 **ОБЪЕКТ:** (Название и бренд)
                    ⚠️ **ПОДВОХИ:** (Минусы и жалобы)
                    📊 **ЦЕННОСТЬ:** (Стоит ли своих денег)
                    💡 **АЛЬТЕРНАТИВА:** (Что взять взамен)
                    ❌/✅ **ИТОГ:** (Жесткий приговор)

                    В САМОМ КОНЦЕ ОТВЕТА напиши строго: [SCORE: X], где X — число от 1 до 100.
                    1-30: Разумная покупка.
                    31-70: Сомнительно.
                    71-100: Высокий импульсивный риск.` 
                },
                { role: "user", content: `Проанализируй этот товар: ${link}` }
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
