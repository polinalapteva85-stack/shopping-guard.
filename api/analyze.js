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
                    content: `Ты — Shopping Guard 2026, независимый эксперт по контролю качества ритейла и маркетплейсов. Твоя задача — разложить товар на скрытые технические и потребительские риски. Ты общаешься как строгий, опытный инженер-технолог. Никакой воды, шаблонов и поучений.

                    Ты должен вернуть ответ СТРОГО в формате JSON. Никакого лишнего текста вне JSON структуры.
                    Шаблон ответа:
                    {
                        "object": "Бренд, модель или точная категория товара",
                        "market_context": "АНАЛИЗ РЫНКА: Специфика продаж этого бренда/товара на маркетплейсах в 2026 году. Насколько часто в этой нише продают пародию, реплики, восстановленный брак или витринные образцы под видом новых.",
                        "hidden_defects": "ТЕХНИЧЕСКИЙ РЕНТГЕН: На основе инженерной практики и статистики ремонтных мастерских, какие слабые места есть у этого типа товаров/материалов? Что ломается, трескается, отваливается или теряет вид быстрее всего (детали, швы, узлы, электроника).",
                        "bot_factor": "ИНДЕКС ДОВЕРИЯ К КАРТОЧКЕ: Какая средняя доля накрутки и авто-отзывов крутится в этой категории товаров для забивания реального негатива (укажи реалистичный процент).",
                        "verdict_status": "Высокий риск (не брать) / Умеренный риск (проверить при получении) / Безопасно (можно брать)",
                        "score": 50
                    }

                    Оценивай score от 1 до 100 (где 100 — максимальный риск купить хлам или подделку). Внутри текстовых полей JSON запрещено использовать списки, звездочки или дефисы.`
                },
                {
                    role: "user",
                    content: `Проанализируй скрытые риски для: ${link}`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.5
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        const rawJson = JSON.parse(response.data.choices[0].message.content);

        // Собираем солидный, экспертный отчет без вранья про конкретные отзывы
        const formattedText = `🔍 **ОБЪЕКТ АНАЛИЗА:** ${rawJson.object}\n\n🏪 **СИТУАЦИЯ НА РЫНКЕ:** ${rawJson.market_context}\n\n🛠️ **ТЕХНИЧЕСКИЙ РЕНТГЕН:** ${rawJson.hidden_defects}\n\n🤖 **ИНДЕКС НАКРУТКИ В НИШЕ:** Около ${rawJson.bot_factor} отзывов в этой категории генерируются ботами и за-отзывными кампаниями, чтобы скрыть реальные недостатки.\n\n📋 **РЕКОМЕНДАЦИЯ ЭКСПЕРТА:** ${rawJson.verdict_status}\n\n[SCORE: ${rawJson.score}]`;

        return res.status(200).json({ success: true, text: formattedText });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
