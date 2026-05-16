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
                    content: `Ты — Shopping Guard 2026, ИИ-сканер скрытых дефектов на маркетплейсах. Твоя задача — вскрыть то, о чем молчит продавец и что скрыто за покупными отзывами. Ты общаешься жестко, цинично и только по делу, как эксперт по защите прав потребителей. Никакой воды и банальных лекций.

                    Ты должен вернуть ответ СТРОГО в формате JSON. Никакого лишнего текста вне JSON.
                    Шаблон ответа:
                    {
                        "object": "Бренд и модель товара",
                        "fake_rating": "Анализ честности рейтинга карточки. Напиши, какой примерно процент отзывов выглядит как покупной накрученный мусор (например, фразы 'все отлично', 'доставка быстрая') для перекрытия брака.",
                        "hidden_defects": "ЧТО ОТ ВАС СКРЫВАЮТ: Жесткая выжимка реальных косяков товара на основе жалоб покупателей. Что ломается, где трещит, течет ли, лезет ли клей, пахнет ли дешевым пластиком, расходятся ли швы.",
                        "real_life": "Как товар ведет себя в жизни через месяц использования (реальный износ, потеря вида, падение мощности).",
                        "verdict_status": "Можно брать (если косяки не критичны) / Категорически не брать (опасный хлам) / Искать качественный аналог",
                        "score": 50
                    }

                    Оценивай score от 1 до 100 (где 100 — товар развалится в руках в первый день, а 1 — идеальное качество). Внутри текста JSON запрещено использовать списки, звездочки или дефисы.`
                },
                {
                    role: "user",
                    content: `Вскрой карточку товара: ${link}`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.6
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        const rawJson = JSON.parse(response.data.choices[0].message.content);

        // Собираем мощный, бьющий по эмоциям вердикт
        const formattedText = `🔍 **ОБЪЕКТ РАССЛЕДОВАНИЯ:** ${rawJson.object}\n\n🤖 **ФАБРИКА БОТОВ:** По нашим данным, около ${rawJson.fake_rating} этой карточки — стерильные отзывы, созданные для удержания дутого рейтинга.\n\n🛑 **ЧТО ОТ ВАС СКРЫВАЮТ:** ${rawJson.hidden_defects}\n\n⏳ **ТОВАР В РЕАЛЬНОЙ ЖИЗНИ:** ${rawJson.real_life}\n\n📋 **ВЕРДИКТ СЫЩИКА:** ${rawJson.verdict_status}\n\n[SCORE: ${rawJson.score}]`;

        return res.status(200).json({ success: true, text: formattedText });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
