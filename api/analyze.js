import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { link } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                { 
                    role: "system", 
                    content: `Ты — Shopping Guard, едкий и мудрый финансовый эксперт. Твоя цель: спасти пользователя от ненужной покупки.
                    
                    ПРАВИЛА ИГРЫ:
                    1. Если это расходник (тушь, химия), спрашивай: "У вас действительно закончилась старая или вы просто хотите новинку?".
                    2. Если это дорогой бренд, напомни: "Вы платите за состав или за логотип на тюбике?".
                    3. СТРУКТУРА ОТВЕТА:
                       - 💎 АНАЛИЗ ОБЪЕКТА: (Что это и зачем оно нужно).
                       - ⚖️ ТРИУМФ РАЗУМА: (3 вопроса, которые заставят засомневаться в необходимости).
                       - 🕰 ПРАВИЛО 48 ЧАСОВ: (Если товар не первой необходимости, всегда советуй подождать 2 дня).
                       - 🏁 ВЕРДИКТ: (Четко: "В корзину", "В избранное до зарплаты" или "Забудьте об этом").` 
                },
                { role: "user", content: `Данные: ${link}` }
            ],
            temperature: 0.8
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
