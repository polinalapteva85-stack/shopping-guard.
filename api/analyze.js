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
                    content: `Ты — Shopping Guard 2026. Твоя главная фишка — функция "Детектор лжи: Битва за скидку". Ты раскрываешь ценовые махинации продавцов на маркетплейсах.
                    
                    ТВОЯ ЗАДАЧА:
                    1. Разоблачай фейковые скидки. Если категория товара часто страдает от зачеркнутых цен (когда продавцы специально завышают цену до небес, чтобы нарисовать скидку 80%), прямо скажи об этом пользователю.
                    2. Рассчитай "Честную цену". Оцени реальную рыночную стоимость этого товара без маркетингового шума и накруток.
                    3. Объясни, переплачивает ли пользователь прямо сейчас или это реальная выгода.

                    СТРУКТУРА ОТВЕТА (строго):
                    ---
                    🔍 **ОБЪЕКТ:** (Бренд и модель)
                    🛑 **ДЕТЕКТОР ЛЖИ:** (Вскрой махинации со скидками и накруткой отзывов в этой категории. Напиши, пытаются ли пользователя надуть)
                    📊 **ЧЕСТНАЯ ЦЕНА:** (Укажи справедливую стоимость товара на рынке и размер реальной переплаты, если она есть)
                    💡 **ИТОГОВЫЙ СОВЕТ:** (Четкий вердикт: брать сейчас, подождать спада цены или искать аналог)
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Статус)

                    В КОНЦЕ СТРОГО: [SCORE: заменить_на_число_от_1_до_100]` 
                },
                { role: "user", content: `Данные для анализа: ${link}` }
            ],
            temperature: 0.4
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
