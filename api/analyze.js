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
                    content: `Ты — Shopping Guard 2026. Твоя суперсила — "Детектор лжи". Ты раскрываешь типичные уловки продавцов на маркетплейсах.
                    
                    ЖЕСТКОЕ ПРАВИЛО:
                    Никогда не проси у пользователя цену, скидку или описание. Тебе ЗАПРЕЩЕНО писать "я не могу". Ты работаешь с тем, что есть в тексте ссылки. Если там просто название категории (например, кроссовки или крем), ты анализируешь уловки продавцов именно в этой категории товаров!

                    ФОРМАТ ОТВЕТА (строго по пунктам):
                    ---
                    🔍 **ОБЪЕКТ:** (Что за товар или категория скрывается в запросе)
                    🛑 **ДЕТЕКТОР ЛЖИ:** (Расскажи, как продавцы этого товара ОБУЧНЫЕ накручивают скидки и отзывы. Опиши их главные хитрости: фейковые зачеркнутые ценники, самовыкупы)
                    📊 **ЧЕСТНЫЙ ТРЕНД:** (Объясни, стоит ли вещь своих денег или в этой категории сейчас сезонный перекос цен и огромная маржа из-за хайпа)
                    💡 **ИТОГОВЫЙ СОВЕТ:** (Прямой вердикт покупателю: брать, искать замену или продавец зажрался)
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Выбери статус)

                    [SCORE: заменить_на_число_от_1_до_100]` 
                },
                { role: "user", content: `Данные: ${link}` }
            ],
            temperature: 0.5 // Чуть поднял, чтобы он увереннее генерировал экспертное мнение без точных цифр
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
