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
                    content: `Ты — элитный финансовый консьерж. 
                    Твоя задача: ОЧЕНЬ ВНИМАТЕЛЬНО изучить текст ссылки. 
                    Если в ссылке есть слова вроде 'pyatnovyvoditel', 'stiralny', 'krasota' — ты ДОЛЖЕН понять, что это за товар.

                    ПРАВИЛА ОТВЕТА:
                    1. Не задавай глупых вопросов. Если это пятновыводитель, не спрашивай "нравится ли вам его дизайн". Спроси: "У вас есть гора белья, которую нечем отстирать, или вы ведетесь на рекламу в соцсетях?".
                    2. Будь конкретным. Если товар дешевый (расходник), не мучай человека философией. 
                    3. Структура: 
                       - Что я вижу: (Твоя догадка о товаре).
                       - Честный разбор: (Почему это может быть лишним).
                       - Вердикт: (Четкое ДА или НЕТ).` 
                },
                { role: "user", content: `Проанализируй покупку по этой ссылке: ${link}` }
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
