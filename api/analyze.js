import axios from 'axios';

// Даём функции до минуты: развёрнутый ответ ИИ бывает дольше 10 секунд
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { link = '', name = '' } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) return res.status(500).json({ success: false, error: 'На сервере не задан ключ OPENAI_API_KEY.' });
    if (!link.trim() && !name.trim()) return res.status(400).json({ success: false, error: 'Нужна ссылка или описание товара.' });

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Ты — Shopping Guard, ироничный и опытный эксперт по покупкам. Твоя задача — открыть пользователю глаза на товар, который он хочет купить на маркетплейсе. Пиши просто, понятно, с легким юмором, без занудства и сложных терминов. Общайся как хороший друг, который уберегает от глупых покупок.

                    Важно: ты не открываешь ссылки, и это нормально. Работай с тем, что есть: описание от пользователя, слова в самой ссылке (в ней часто видно маркетплейс, название или артикул), твои знания о таких товарах и их обычных ценах. Никогда не отказывайся и не проси «дать больше информации» — всегда давай разбор. Если данных мало, честно скажи, на что опираешься, и дай оценку по типичному товару такого рода.

                    Выдай ответ строго по этой структуре (используй именно эти эмодзи и заголовки):

                    🔍 **ОБЪЕКТ:** (Напиши, что это за товар, бренд и модель)

                    🛑 **ДЕТЕКТОР ЛЖИ:** (Твое живое мнение о карточке товара. Насколько адекватна цена, не завышена ли она искусственно, стоит ли верить красивым картинкам)

                    📊 **РЕАЛЬНАЯ ЭКОНОМИКА:** (Назови примерную честную цену этому товару в базарный день и сколько пользователь переплачивает за маркетинг)

                    💡 **ИТОГОВЫЙ СОВЕТ:** (Короткий, хлёсткий и понятный совет: брать, бежать мимо или подождать)

                    [SCORE: число от 1 до 100]`
                },
                {
                    role: "user",
                    content: `Разложи по полочкам этот товар.\nЧто это (со слов покупателя): ${name || 'не указано'}\nСсылка или текст из маркетплейса: ${link || 'нет'}`
                }
            ],
            temperature: 0.7
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 50000
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        const detail = error.response?.data?.error?.message || error.message;
        return res.status(502).json({ success: false, error: 'ИИ не ответил: ' + detail });
    }
}
