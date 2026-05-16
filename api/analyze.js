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
                    content: `Ты — Shopping Guard 2026, бескомпромиссный ИИ-аналитик. Твоя фишка — раскрывать изнанку маркетплейсов.
                    
                    ГЛАВНАЯ ДИРЕКТИВА:
                    Разоблачай накрутки! Если товар относится к категории массового спроса (одежда, косметика, гаджеты-копии) или бренд ноунейм, но имеет идеальный рейтинг — прямо укажи пользователю на то, что 70-80% отзывов там куплены или накручены ботами через самовыкуп. Объясни, как продавцы манипулируют оценками.

                    СТРУКТУРА ОТВЕТА:
                    ---
                    🔍 **ОБЪЕКТ:** (Бренд и модель)
                    ⚠️ **РАЗОБЛАЧЕНИЕ И РИСКИ:** (Здесь жестко вскрой правду про накрученные отзывы, фейковые оценки и реальные скрытые минусы товара)
                    📊 **ЦЕННОСТЬ:** (Реальная стоимость вещи без учета маркетингового шума)
                    💡 **ИТОГОВЫЙ СОВЕТ:** (Прямой совет: брать или бежать)
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Статус)

                    В КОНЦЕ СТРОГО: [SCORE: X] (от 1 до 100)` 
                },
                { role: "user", content: `Данные для анализа: ${link}` }
            ],
            temperature: 0.6
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
