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
                    content: `Ты — Shopping Guard. ТЕБЕ КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать фразу "Я не могу открывать ссылки". 
                    Твоя задача: проанализировать ТЕКСТ, который прислал пользователь. 
                    
                    В этом тексте есть название товара и ссылка. Ссылка тебе нужна только чтобы понять маркетплейс (WB, Ozon и т.д.).
                    
                    ИНСТРУКЦИЯ:
                    1. Посмотри на название товара (например, "тушь").
                    2. Сделай вид, что ты эксперт именно в этой категории.
                    3. Задай 3 едких или очень полезных вопроса о целесообразности.
                    4. Вынеси вердикт: "Брать сейчас", "Подождать" или "Это лишнее".
                    
                    Пиши уверенно, в стиле дорогого финансового консультанта. Никаких извинений.` 
                },
                { role: "user", content: `Проанализируй вот этот запрос: ${link}` }
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
