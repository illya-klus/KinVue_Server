# Документообіг KinVue Server

Тут лежить план роботи і те, що агенти пам'ятають між чатами.

| Куди                                                  | Зміст                                  |
| ----------------------------------------------------- | -------------------------------------- |
| [design/](design/README.md)                           | План продукту і архітектури, `00`–`26` |
| [plan/](plan/README.md)                               | Покрокова збірка                       |
| [backlog/](backlog/README.md)                         | Тікети. Дошка Jira вже заведена        |
| [architecture.md](architecture.md)                    | Що вже є в коді                        |
| [decisions/](decisions/README.md)                     | Зобов'язуючі рішення                   |
| [status.md](status.md)                                | Зроблено і не зроблено                 |
| [log/](log/README.md)                                 | Журнал чатів                           |
| [AGENT.md](AGENT.md)                                  | Правила для Cursor, Claude і Codex     |
| [archive/jira-import/](archive/jira-import/README.md) | Чорновий імпорт на дошку, не вимоги    |

Код — те, що працює зараз. `doc/design/` — куди збірка йде. Якщо зміна суперечить рішенню зі статусом `прийнято`, агент зупиняється і каже про це. Здає роботу гілкою від `dev` і pull request, не пушем у `dev`.
