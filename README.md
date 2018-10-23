# invest-cli

### Что делает?
Поднимает прокси для всех апишек из `env.js` и
запускает `npm start:invest` с этими проксями.

### Возможности
1. менять env.js без перезапуска (менять апишки, например, с dev -> qa -> prod)
2. мокать запросы

### Запуск
1. установить глобально (для удобства): `npm i invest-cli -g`
2. из папки с проектом вместо `npm start:invest` выполнить `invest-cli`

### Мокирование запросов
1. Включить мокирование в `env.js` файле, поставив js-комментарий "mocked".
 Например для TRADING_API:
   ```js
    const devEnv = {
        ...
        TRADING_API: [api url], // mocked
   ```
2. В файл ~/tinkoff.json прописать моковые данные. Пример:
   ```json
   {
     "mock": {
       "TRADING_API": {
         "user": {
           "info": {
             "test": true
           }
         }
       }
     }
   }
   ```
