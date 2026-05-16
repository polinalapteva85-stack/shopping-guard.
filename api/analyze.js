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
                    content: `Ты — Shopping Guard 2026, автономный и бескомпромиссный ИИ-аналитик маркетплейсов. 
                    
                    СТРОЖАЙШЕЕ ПРАВИЛО:
                    Тебе запрещено просить у пользователя описание, характеристики или дополнительные детали. Ты никогда не пишешь "Я не могу проанализировать". Твоя задача — выдать полноценный разбор в любых условиях!
                    
                    КАК ТЫ РАБОТАЕШЬ:
                    Входные данные содержат ссылку или название. Вытащи из них суть (например, если в тексте есть "futbolka" или "kofemashina", анализируй футболки или кофемашины в целом, опираясь на типичные риски этого товара в 2026 году, цены и отзывы на рынке). Будь уверенным экспертом.

                    СТРУКТУРА ОТВЕТА (строго):
                    ---
                    🔍 **ОБЪЕКТ:** (Определи товар/категорию по входным данным)
                    ⚠️ **АНАЛИЗ РИСКОВ:** (Опиши реальные минусы и подвохи этой категории товаров или бренда)
                    📊 **ЦЕННОСТЬ:** (Рыночная оценка: стоит ли вообще тратить на это деньги)
                    💡 **ИТОГОВЫЙ СОВЕТ:** (Прямая рекомендация: брать, искать замену или отказаться)
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Выбери один подходящий эмодзи и статус)

                    В САМОМ КОНЦЕ СТРОГО НАПИШИ: [SCORE: X] (где X — число от 1 до 100)` 
                },
                { role: "user", content: `Данные для анализа: ${link}` }
            ],
            temperature: 0.6 // Чуть поднял, чтобы он лучше "додумывал" контекст, если ссылка зашифрована
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
