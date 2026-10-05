# Shopping Guard

Приложение проверяет товар с маркетплейса перед покупкой: ссылка + цена → вердикт «брать / подождать / мимо».

**Адрес:** https://d5dn8uikh3frpo6bheau.4kscn31j.apigw.yandexcloud.net

## Как устроено

Всё работает в Яндекс Облаке (облако `cloud-squall-155`, каталог `default` — `b1g66ec8oqfbfoavn5ib`):

| Что | Где |
|---|---|
| Страница (`index.html`, `sw.js`, `manifest.json`) | бакет Object Storage `shopping-guard-app-b1g66e` |
| Анализ (`yandex/function/index.js`) | функция `shopping-guard-analyze`, Node.js 22 |
| Общий адрес | API Gateway `shopping-guard`, описание — `yandex/gateway.yaml` |
| Доступы | сервисный аккаунт `shopping-guard-sa` (ИИ, чтение бакета, вызов функции) |
| ИИ | Alice AI LLM (`aliceai-llm`), переменная `MODEL` у функции |

Функция сама узнаёт товары Wildberries по ссылке (карточка с `basket-NN.wbbasket.ru`, отзывы с `feedbacks1/2.wb.ru`).
Другие магазины данные не отдают — там пользователь пишет, что за товар.

## Как выложить правку

GitHub — только хранилище кода: изменения на GitHub в приложение сами **не попадают**.

```bash
# функция
yc serverless function version create --function-name shopping-guard-analyze \
  --runtime nodejs22 --entrypoint index.handler --memory 256m --execution-timeout 60s \
  --source-path yandex/function --service-account-id ajenn411nktdhikhmj2l \
  --environment FOLDER_ID=b1g66ec8oqfbfoavn5ib --environment MODEL=aliceai-llm

# страница
yc storage s3api put-object --bucket shopping-guard-app-b1g66e --key index.html \
  --body index.html --content-type "text/html; charset=utf-8" --cache-control "no-cache"
```
