import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { link } = req.body;
    // Берем ключ строго из системных переменных Vercel
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ success: false, error: "API ключ не найден в настройках Vercel" });
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                { 
                    role: "system", 
                    content: "Ты — элитный финансовый консьерж Shopping Guard. Твоя роль: помочь пользователю принять осознанное решение о покупке. Стиль: вежливый, экспертный, дорогой." 
                },
                { role: "user", content: `Проанализируй эту покупку по ссылке: ${link}` }
            ],
            temperature: 0.7
        }, {
            headers: { 
                'Authorization': `Bearer ${apiKey}`, 
                'Content-Type': 'application/json' 
            }
        });

        const aiText = response.data.choices[0].message.content;
        return res.status(200).json({ success: true, text: aiText });

    } catch (error) {
        // Если ошибка 401, выводим понятное сообщение
        const status = error.response ? error.response.status : 500;
        if (status === 401) {
            return res.status(401).json({ success: false, error: "Неверный API ключ. Проверьте OPENAI_API_KEY в Vercel." });
        }
        return res.status(500).json({ success: false, error: error.message });
    }
}
