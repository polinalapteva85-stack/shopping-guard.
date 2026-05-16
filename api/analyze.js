import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { link, priceNow, priceOld } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    // Считаем реальную скидку в процентах, если пользователь ввел цифры
    let discountPercent = 0;
    if (priceNow && priceOld && Number(priceOld) > 0) {
        discountPercent = Math.round(((Number(priceOld) - Number(priceNow)) / Number(priceOld)) * 100);
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o", 
            messages: [
                { 
                    role: "system", 
                    content: `Ты — Shopping Guard 2026, циничный и опытный финансовый аналитик ритейла. Ты общаешься с пользователем как с умным, взрослым человеком. 
                    
                    СТРОЖАЙШЕЕ ТЕХНИЧЕСКОЕ ПРАВИЛО:
                    1. Никаких извинений и вступлений. Начинай строго с "🔍 **ОБЪЕКТ:**".
                    2. ЗАПРЕЩЕНО писать банальные лекции вроде "это распространенный трюк для привлечения внимания" или "продавцы делают это, чтобы стимулировать продажи". Пользователь не дурак, он знает базовый маркетинг. Пиши только конкретные факты по экономике товара!
                    3. Никаких списков, дефисов и звездочек в тексте — только сплошные абзацы.

                    КАК ВЕСТИ СЕБЯ В БЛОКЕ "🛑 ДЕТЕКТОР ЛЖИ":
                    Посмотри на входные цены (Цена сейчас: ${priceNow || 'не указана'}, Зачеркнутая: ${priceOld || 'не указана'}, Скидка: ${discountPercent}%).
                    
                    Сценарий А (Скидка нарисована дикая, более 60%):
                    Разнеси этот ценник фактами. Напиши, что зачеркнутая сумма взята с потолка, и этот бренд в рознице столько никогда не стоил. Назови это ценовым оверпрайсом.
                    
                    Сценарий Б (Скидка адекватная, 15-40% или цены не указаны):
                    Будь объективен. Напиши, что цена выглядит стандартной для рынка, без явного криминала, но маржа продавца все равно сидит в районе нормальных Х%.
                    
                    Про отзывы: вместо "обратите внимание, они могут быть накручены", напиши конкретно: "Специфика карточки: в этой категории около [число]% отзывов выкупаются ботами для удержания рейтинга, смотри только на негатив с фотками".`
                },
                { 
                    role: "user", 
                    content: `Товар: ${link}. Текущая цена: ${priceNow || 'неизвестна'}, Зачеркнутая: ${priceOld || 'неизвестна'}.` 
                }
            ],
            temperature: 0.7 // Подняли температуру, чтобы ответы были максимально разнообразными и живыми
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
