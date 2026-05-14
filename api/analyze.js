import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { link, key } = req.body;
    const apiKey = key || process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                { 
                    role: "system", 
                    content: `Ты — элитный финансовый консьерж Shopping Guard. Твоя роль: помочь пользователю принять осознанное решение о покупке. Стиль: вежливый, экспертный, дорогой. 
                    ПЛАН ОТВЕТА:
                    1. КРАТКИЙ АНАЛИЗ категории товара.
                    2. ТРИ ВОПРОСА для осознанности.
                    3. ВЕРДИКТ: инвестиция или импульс.` 
                },
                { role: "user", content: `Проанализируй эту покупку: ${link}` }
            ],
            temperature: 0.7
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        const aiText = response.data.choices[0].message.content;
        return res.status(200).json({ success: true, text: aiText });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Ошибка анализа: " + error.message });
    }
}
