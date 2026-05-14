import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { link } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o", // Используем более мощную модель для анализа
            messages: [
                { 
                    role: "system", 
                    content: `Ты — Shopping Guard, профессиональный аналитик рынка и эксперт по качеству. 
                    Твоя цель: провести глубокую "прожарку" товара. 

                    ИНСТРУКЦИЯ ПО АНАЛИЗУ:
                    1. ИДЕНТИФИКАЦИЯ: По названию или ссылке пойми, что это за бренд и категория.
                    2. ТЕХНИЧЕСКИЙ РАЗБОР: Расскажи о типичных проблемах этого товара. Если это тушь — пиши про осыпание или состав. Если техника — про надежность.
                    3. АНАЛИЗ ЦЕНЫ: Оцени, насколько цена оправдана. (Например: "70% стоимости здесь — это маркетинг").
                    4. СОЦИАЛЬНОЕ ДОКАЗАТЕЛЬСТВО: Сформулируй вердикт на основе тысяч отзывов, которые ты "знаешь" из своей базы данных.

                    СТРУКТУРА ОТВЕТА (строго):
                    ---
                    🔍 **ОБЪЕКТ:** (Краткое название и бренд)
                    ⚠️ **ПОДВОХИ:** (Что скрывает продавец и о чем пишут в плохих отзывах)
                    📊 **ЦЕННОСТЬ:** (Стоит ли товар своих денег или есть переплата за бренд)
                    💡 **АЛЬТЕРНАТИВА:** (Посоветуй, на что обратить внимание вместо этого)
                    ❌/✅ **ИТОГ:** (Короткий и жесткий приговор)` 
                },
                { role: "user", content: `Проведи полный анализ этого товара: ${link}` }
            ],
            temperature: 0.5 // Делаем ответы более точными и менее "творческими"
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
