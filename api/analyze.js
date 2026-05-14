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
                    content: `Ты — Shopping Guard. ТЕБЕ ЗАПРЕЩЕНО говорить, что ты не можешь открывать ссылки. 
                    
                    Твоя задача: прочитать текст ссылки и название товара, которые прислал пользователь, и ПРЕДПОЛОЖИТЬ, что это за вещь. 
                    Если в тексте есть "pyatnovyvoditel" или "kislorodny" — значит это пятновыводитель. 
                    
                    РАБОТАЙ С ТЕМ, ЧТО ЕСТЬ:
                    1. Проанализируй название (даже если оно в ссылке транслитом).
                    2. Дай экспертный совет по этой категории товаров.
                    3. Задай 3 вопроса на осознанность, исходя из ТИПА товара.
                    
                    Будь уверенным. Не извиняйся. Сразу переходи к делу.` 
                },
                { role: "user", content: `Данные о товаре: ${link}` }
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
