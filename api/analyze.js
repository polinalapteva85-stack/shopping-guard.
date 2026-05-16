import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { link, priceNow, priceOld } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    // Формируем контекст для ИИ, если пользователь вручную ввел цены
    let priceContext = "";
    if (priceNow && priceOld) {
        priceContext = `Пользователь видит в магазине: Цена сейчас — ${priceNow} руб., зачёркнутая цена — ${priceOld} руб. Проанализируй именно эти цифры.`;
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o", 
            messages: [
                { 
                    role: "system", 
                    content: `Ты — Shopping Guard 2026, финансовый ИИ-эксперт. Ты помогаешь раскрывать уловки продавцов и оценивать качество.
                    
                    СТРОЖАЙШЕЕ ПРАВИЛО:
                    Никаких вводных слов и извинений! Не пиши "Я не могу открыть ссылку", "Анализ на основе категории" и т.д. Твой ответ должен НАЧИНАТЬСЯ строго со строки "🔍 **ОБЪЕКТ:**". В тексте ЗАПРЕЩЕНО использовать маркеры списков (знаки дефиса "-", звездочки "*"), пиши всё сплошным текстом с абзацами, чтобы не ломать верстку!

                    СТРУКТУРА ОТВЕТА (строго):
                    🔍 **ОБЪЕКТ:** (Название товара или категория)
                    
                    🛑 **ДЕТЕКТОР ЛЖИ:** (Если переданы конкретные цены, разбери их. Если цен нет, объясни стандартный трюк со скидками в этой категории. Напиши про накрутку отзывов)
                    
                    🛠️ **КАЧЕСТВО И МАТЕРИАЛЫ:** (Оцени надежность товара, его типичные плюсы и скрытые минусы: пластик, сборка, долговечность)
                    
                    📊 **РЕАЛЬНАЯ ЭКОНОМИКА:** (Укажи примерную фабричную себестоимость, расходы маркетплейса и честную розничную цену в рублях. Напиши размер маркетинговой переплаты в процентах)
                    
                    💡 **ИТОГОВЫЙ СОВЕТ:** (Короткий вердикт покупателю: брать, ждать скидок или это хлам)
                    
                    ❌/⚠️/✅ **ВЕРДИКТ:** (Статус)

                    [SCORE: заменить_на_число_от_1_до_100]` 
                },
                { role: "user", content: `Данные для анализа: ${link}. ${priceContext}` }
            ],
            temperature: 0.5
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
