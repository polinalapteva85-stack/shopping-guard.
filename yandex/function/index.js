// Shopping Guard — функция анализа для Яндекс Облака.
// Принимает ссылку (или текст из «Поделиться»), цену и описание,
// сама узнаёт товар Wildberries по ссылке и просит YandexGPT разобрать покупку.

const FOLDER_ID = process.env.FOLDER_ID;
const MODEL = process.env.MODEL || 'aliceai-llm';

const SYSTEM_PROMPT = `Ты — Shopping Guard, ироничный друг, который уберегает от глупых покупок на маркетплейсах. Пиши коротко, просто, с лёгким юмором.

Тебе передают данные о товаре: название, бренд, характеристики, описание продавца, рейтинг и отзывы покупателей (если есть), слова покупателя и цену. Это всё, что у тебя есть, — работай с этим.

ГЛАВНОЕ ПРАВИЛО — НИКАКОЙ ВОДЫ. Каждая фраза опирается на конкретный факт: цифру, жалобу из отзывов, слова из описания, характеристику — или на твоё знание рынка и техники (сколько такие товары обычно стоят, что физически возможно). Своими знаниями пользуйся смело и говори уверенно: не «кажется сомнительным», а «так не бывает: аккумулятор на 20 000 мАч не может весить 150 граммов».
Запрещено:
- советовать что-то проверить самому: «почитайте отзывы», «сравните цены», «обратите внимание на бренд», «изучите состав», «посмотрите аналоги» — ты уже всё это сделал за покупателя;
- обтекаемые слова: «возможно», «может быть», «кажется», «сомнительно», «стоит учесть», «в целом», «как правило», «не всегда»;
- писать «цена неизвестна», «нельзя оценить», «нет данных» — ты всегда знаешь, сколько примерно стоит такой товар;
- пересказывать описание продавца и хвалить товар его словами;
- придумывать факты, которых нет в данных.

Отзывы: ищи жалобы, которые повторяются у разных людей, и называй их с цифрами — считай по тем отзывам, что тебе передали, и не преувеличивай (пример формы: «из 30 последних плохих отзывов в 8 пишут, что молния сломалась за месяц»). Одиночную жалобу не выдавай за проблему. Если плохих отзывов мало и они разные — так и скажи одной фразой.
Проверь каждую цифру в характеристиках и описании на правдоподобие: мощность, яркость, ёмкость, вес, объём, состав, срок работы. Цифры, которые противоречат друг другу или законам физики, — главный подвох карточки: назови их и объясни простыми словами, сколько должно быть на самом деле.
Нет отзывов — это не причина ждать: суди по характеристикам, описанию и цене.
Цена: всегда назови, сколько такой товар обычно стоит на маркетплейсах (диапазон в рублях). Если цена покупателя указана — назови переплату или экономию в рублях.

Ответ строго в этой структуре, именно с этими эмодзи и заголовками, каждый раздел — 1–3 коротких предложения:

⚖️ **ВЕРДИКТ:** БРАТЬ, ПОДОЖДАТЬ или МИМО — и одна фраза почему.

🔍 **ОБЪЕКТ:** что это, бренд, модель — одной строкой.

🗣 **ЧТО ГОВОРЯТ ПОКУПАТЕЛИ:** рейтинг, сколько отзывов, главные повторяющиеся жалобы с цифрами.

🛑 **ПОДВОХ В КАРТОЧКЕ:** что продавец недоговаривает или приукрашивает — со ссылкой на конкретные слова или характеристики. Подвоха нет — напиши «Не нашёл» и одну фразу почему.

📊 **ЦЕНА:** сколько такое обычно стоит и переплата в рублях.

[SCORE: число от 1 до 100]

SCORE — индекс риска покупки: 1–30 — БРАТЬ, 31–70 — ПОДОЖДАТЬ, 71–100 — МИМО. Число должно совпадать с вердиктом.`;

function reply(statusCode, data) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(data)
    };
}

async function fetchWithTimeout(url, options = {}, ms = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// Номер товара в ссылке WB бывает в разных местах: /catalog/123/, ?card=123, ?nm=123
function wbArticleFromUrl(url) {
    if (!/wildberries|wb\.ru|wbstatic|wb\.click/i.test(url)) return null;
    const m = url.match(/\/catalog\/(\d{5,12})/i) || url.match(/[?&](?:card|nm|nm_id)=(\d{5,12})/i)
        || url.match(/\/(\d{6,12})(?:\/|\?|$)/);
    return m ? m[1] : null;
}

// Номер товара Wildberries из ссылки; короткие ссылки сначала раскрываем
async function findWbArticle(url) {
    const direct = wbArticleFromUrl(url);
    if (direct) return direct;
    try {
        const res = await fetchWithTimeout(url, { redirect: 'follow' }, 4000);
        return wbArticleFromUrl(res.url);
    } catch (_) {
        return null;
    }
}

// Карточка товара WB лежит на одном из серверов basket-NN — опрашиваем их разом
async function fetchWbCard(article) {
    const nm = Number(article);
    const vol = Math.floor(nm / 100000);
    const part = Math.floor(nm / 1000);
    const hosts = Array.from({ length: 60 }, (_, i) => String(i + 1).padStart(2, '0'));
    // Серверы WB иногда отвечают медленно — даём две попытки
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await Promise.any(hosts.map(async (h) => {
                const res = await fetchWithTimeout(
                    `https://basket-${h}.wbbasket.ru/vol${vol}/part${part}/${nm}/info/ru/card.json`, {}, 8000);
                if (!res.ok) throw new Error('нет');
                return await res.json();
            }));
        } catch (_) {
            // пробуем ещё раз
        }
    }
    return null;
}

function describeWbCard(card) {
    const lines = [];
    lines.push(`Название: ${card.imt_name || ''}`);
    if (card.selling?.brand_name) lines.push(`Бренд: ${card.selling.brand_name}`);
    if (card.subj_name) lines.push(`Категория: ${card.subj_name}`);
    const options = (card.options || []).slice(0, 15).map((o) => `${o.name}: ${o.value}`);
    if (options.length) lines.push(`Характеристики: ${options.join('; ')}`);
    if (card.description) lines.push(`Описание продавца: ${card.description.slice(0, 1200)}`);
    return lines.join('\n');
}

// Отзывы WB открыты по номеру карточки (imt_id): рейтинг, распределение оценок и тексты
async function fetchWbFeedbacks(imtId) {
    try {
        return await Promise.any(['feedbacks1', 'feedbacks2'].map(async (host) => {
            const res = await fetchWithTimeout(`https://${host}.wb.ru/feedbacks/v2/${imtId}`, {}, 6000);
            if (!res.ok) throw new Error('нет');
            const data = await res.json();
            if (!data || typeof data.feedbackCount !== 'number') throw new Error('пусто');
            return data;
        }));
    } catch (_) {
        return null;
    }
}

function describeFeedbacks(fb) {
    if (!fb || !fb.feedbackCount) return '';
    const dist = fb.valuationDistribution || {};
    const bad = (dist['1'] || 0) + (dist['2'] || 0);
    const lines = [
        `Рейтинг: ${fb.valuation} из 5, всего отзывов: ${fb.feedbackCount}`,
        `Оценки: 5★ — ${dist['5'] || 0}, 4★ — ${dist['4'] || 0}, 3★ — ${dist['3'] || 0}, 2★ — ${dist['2'] || 0}, 1★ — ${dist['1'] || 0} (плохих 1–2★: ${bad})`
    ];
    const reviewText = (f) => [f.text, f.cons && `минусы: ${f.cons}`].filter(Boolean).join(' | ').replace(/\s+/g, ' ').slice(0, 220);
    const negative = (fb.feedbacks || []).filter((f) => f.productValuation <= 3 && reviewText(f)).slice(0, 30);
    if (negative.length) lines.push(`Отзывы с оценкой 1–3★ (последние ${negative.length}):\n` + negative.map((f) => `- ${f.productValuation}★ ${reviewText(f)}`).join('\n'));
    return lines.join('\n');
}

async function askYandexGpt(iamToken, userText) {
    const res = await fetchWithTimeout('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${iamToken}`,
            'x-folder-id': FOLDER_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            modelUri: `gpt://${FOLDER_ID}/${MODEL}`,
            completionOptions: { stream: false, temperature: 0.4, maxTokens: '1000' },
            messages: [
                { role: 'system', text: SYSTEM_PROMPT },
                { role: 'user', text: userText }
            ]
        })
    }, 50000);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || data?.message || `код ${res.status}`);
    return data.result.alternatives[0].message.text.trim();
}

module.exports.handler = async function (event, context) {
    let body = {};
    try {
        const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '{}');
        body = JSON.parse(raw);
    } catch (_) {
        return reply(400, { success: false, error: 'Непонятный запрос.' });
    }

    const input = String(body.link || '').trim();
    const name = String(body.name || '').trim();
    const price = String(body.price || '').trim();

    const url = (input.match(/https?:\/\/\S+/) || [])[0] || '';
    // Текст из «Поделиться» без самой ссылки — часто это и есть название товара
    const sharedText = input.replace(url, '').trim();

    let product = null;
    let article = null;
    if (url) {
        article = await findWbArticle(url);
        if (article) {
            const card = await fetchWbCard(article);
            if (card?.imt_name) {
                const feedbacks = card.imt_id ? await fetchWbFeedbacks(card.imt_id) : null;
                product = {
                    title: card.imt_name,
                    brand: card.selling?.brand_name || '',
                    hasReviews: Boolean(feedbacks?.feedbackCount),
                    details: [describeWbCard(card), describeFeedbacks(feedbacks)].filter(Boolean).join('\n')
                };
            }
        }
    }
    // В журнал — только ссылка и итог распознавания, чтобы разбирать сбои
    console.log(JSON.stringify({ url, article, recognized: Boolean(product) }));

    if (!product && !name && !sharedText) {
        return reply(200, { success: false, needName: true, error: 'Не удалось узнать товар по ссылке. Напишите, что это за товар.' });
    }

    const parts = [];
    if (product) parts.push(`Данные с маркетплейса:\n${product.details}`);
    if (sharedText) parts.push(`Текст, которым поделились: ${sharedText}`);
    if (name) parts.push(`Что это (со слов покупателя): ${name}`);
    parts.push(`Цена: ${price ? price + ' ₽' : 'не указана'}`);
    if (url) parts.push(`Ссылка: ${url}`);
    const hasReviews = Boolean(product?.hasReviews);
    if (!hasReviews) parts.push('Отзывов покупателей в данных нет — раздел «ЧТО ГОВОРЯТ ПОКУПАТЕЛИ» не пиши совсем.');

    try {
        let text = await askYandexGpt(context.token.access_token, `Разложи по полочкам этот товар.\n\n${parts.join('\n\n')}`);
        // Подстраховка: без отзывов раздел про покупателей убираем, даже если ИИ его написал
        if (!hasReviews) text = text.replace(/🗣[^\n]*(?:\n(?!\s*(?:🛑|📊|⚖️|🔍|\[SCORE))[^\n]*)*\n*/u, '');
        return reply(200, {
            success: true,
            text,
            product: product ? { title: product.title, brand: product.brand } : null
        });
    } catch (error) {
        return reply(502, { success: false, error: 'ИИ не ответил: ' + error.message });
    }
};
