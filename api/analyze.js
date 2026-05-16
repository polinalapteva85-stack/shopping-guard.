import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { link, priceNow, priceOld } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

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
                    content: `Ты — Shopping Guard 2026, премиальный финансовый аналитик ритейла. Ты общаешься с пользователем как с умным взрослым человеком, без банальных лекций и объяснений базового маркетинга. Ты выдаешь сухие факты, экспертную оценку качества и аналитику цен.

                    Ты должен вернуть ответ СТРОГО в формате JSON. Никакого лишнего текста вне JSON структуры.
                    Шаблон ответа:
                    {
                        "object": "Бренд и модель товара",
                        "detector": "Анализ цен. Текущая цена: ${priceNow || 'не указана'} руб, зачеркнутая: ${priceOld || 'не указана'} руб (Скидка ${discountPercent}%). Если скидка завышена (более 50%), аргументированно вскрой фейковый оверпрайс. Напиши конкретный процент накрутки отзывов ботами в этой категории.",
                        "quality": "Трезвая оценка надежности, материалов (пластик/дерево/компоненты), сборки и скрытых дефектов, с которыми реально столкнется покупатель.",
                        "economy": "Моделирование экономики в рублях: фабричная себестоимость, расходы маркетплейса, честная розничная цена с нормальной прибылью. Процент чистой маркетинговой переплаты.",
                        "advice": "Короткий и четкий финальный совет покупателю.",
                        "verdict_status": "Брать сейчас / Подождать скидок / Искать замену",
                        "score": 50
                    }

                    Оценивайscore от 1 до 100 (где 100 — максимальный финансовый риск и обман). Запрещено использовать списки, звездочки или дефисы внутри текстовых полей JSON.`
                },
                {
                    role: "user",
                    content: `Проанализируй товар: ${link}. Текущая цена: ${priceNow || 'неизвестна'}, Зачеркнутая: ${priceOld || 'неизвестна'}.`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        const rawJson = JSON.parse(response.data.choices[0].message.content);

        // Собираем красивый финальный текст из JSON, чтобы исключить любые пропуски разделов
        const formattedText = `🔍 **ОБЪЕКТ:** ${rawJson.object}\n\n🛑 **ДЕТЕКТОР ЛЖИ:** ${rawJson.detector}\n\n🛠️ **МАТЕРИАЛЫ И КАЧЕСТВО:** ${rawJson.quality}\n\n📊 **РЕАЛЬНАЯ ЭКОНОМИКА:** ${rawJson.economy}\n\n💡 **ИТОГОВЫЙ СОВЕТ:** ${rawJson.advice}\n\n📋 **ВЕРДИКТ:** ${rawJson.verdict_status}\n\n[SCORE: ${rawJson.score}]`;

        return res.status(200).json({ success: true, text: formattedText });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
