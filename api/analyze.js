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
                    content: `Ты — элитный финансовый консьерж Shopping Guard. Твоя задача: проанализировать товар по ссылке.
                    
                    ТАКТИКА ОТВЕТА:
                    1. ПРИВЕТСТВИЕ: Короткое и статусное.
                    2. СУТЬ: Исходя из текста ссылки (например, если там 'wildberries.ru/catalog/13212370'), пойми категорию товара. 
                    3. ВОПРОСЫ НА МИЛЛИОН: Задай 3 конкретных вопроса. Например: "Эта вещь заменит вам что-то старое или просто займет место?", "Вы планируете использовать это чаще 2 раз в месяц?", "Станет ли ваша жизнь качественнее после этой покупки?".
                    4. ВЕРДИКТ: Дай совет — купить сейчас, подождать 48 часов или отказаться.
                    
                    Пиши красиво, с абзацами, используй минимум эмодзи (только статусные: 💎, ⚖️, 🕰).` 
                },
                { role: "user", content: `Ссылка на товар: ${link}` }
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
