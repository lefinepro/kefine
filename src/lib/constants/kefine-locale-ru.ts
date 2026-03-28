export const KEFINE_TEXT_RU = {
  meta: {
    locale: 'ru'
  },
  brand: {
    name: 'Lefine'
  },
  topbar: {
    topActions: 'Основные действия',
    openActionsMenu: 'Открыть меню действий',
    closeActionsMenu: 'Закрыть меню действий',
    quickActions: 'Быстрые действия',
    language: 'Язык',
    languageAria: 'Открыть меню языков',
    languageEnglish: 'Английский',
    languageRussian: 'Русский',
    theme: {
      switchToDark: 'Переключить на тёмную тему',
      switchToLight: 'Переключить на светлую тему'
    },
    dockLabel: 'Управление сайдбаром',
    socialLabel: 'Ссылки сообщества',
    legalLabel: 'Юридические ссылки',
    mailLabel: 'Написать нам',
    githubLabel: 'Открыть GitHub',
    signIn: 'Войти',
    signedIn: 'Выполнен вход',
    socialLinks: {
      mastodon: {
        label: 'Открыть Mastodon',
        href: 'https://mastodon.social/@lefine'
      },
      discord: {
        label: 'Открыть Discord',
        href: 'https://discord.com/invite/lefine'
      },
      linkedin: {
        label: 'Открыть LinkedIn',
        href: 'https://www.linkedin.com/company/lefine'
      },
      telegram: {
        label: 'Открыть Telegram',
        href: 'https://t.me/lefine'
      }
    },
    legalLinks: {
      privacy: 'Политика конфиденциальности',
      terms: 'Условия',
      refund: 'Возврат',
      related: 'Связанные юридические страницы',
      updated: 'Обновлено',
      backToApp: 'Вернуться в приложение'
    },
    githubUrl: 'https://github.com/lefine',
    contactEmail: 'order@lefine.pro'
  },
  create: {
    title: 'Решайте задачи за часы, а не за месяцы',
    placeholder: 'Опишите, что нужно решить...',
    placeholderVariants: ['Нужен доступ к Telegram', 'Развернуть приватный VPN для команды', 'Деплой production-приложения', 'Оптимизация алгоритма'],
    executeAria: 'Выполнить задачу',
    pathsTitle: 'Пути задачи',
    pathCreateLabel: 'Создание:',
    pathStatusLabel: 'Задача:',
    pathPaymentLabel: 'Оплата:',
    recentTasks: 'Последние задачи',
    noRecentTasks: 'Сохранённых задач пока нет',
    matchedTasks: 'Найденные завершённые задачи',
    noMatchedTasks: 'По этому запросу завершённые задачи не найдены'
  },
  defaults: {
    unknownSolver: 'Неизвестный решатель',
    taskTitle: 'Задача',
    solverNetwork: 'Сеть решателя',
    openSolverMarket: 'Открыть Solver Market',
    defaultCurrency: 'USDC',
    defaultDescription: ''
  },
  status: {
    statusPollingMessage: (solver: string, queued: boolean) =>
      `Решатель ${solver} сейчас ${queued ? 'принимает' : 'исполняет'} задачу`,
    createSending: 'Отправка задачи...',
    queued: (solver: string) => `Задача в очереди. Назначенный решатель: ${solver}`,
    notCompleted: 'Решатель ещё не вернул статус выполнения. Обновите статус задачи вручную.',
    completed: 'Задача завершена. Можно перейти к оплате.'
  },
  labels: {
    solver: 'Решатель:',
    task: 'Задача:',
    budget: 'Бюджет:',
    executionEstimate: 'Оценка выполнения:',
    taskId: 'ID задачи:',
    amount: 'Сумма:',
    promoCode: 'Промокод',
    chooseMethod: 'Выберите способ входа',
    paymentInvoice: 'Ссылка на оплату:',
    searchTasks: 'Поиск задач',
    noTasks: 'Задачи не найдены',
    noTasksDescription: 'Создайте хотя бы одну задачу или измените строку поиска.',
    openPaymentInvoice: 'Открыть счёт',
    openOrderLink: 'Открыть заказ',
    loadMoreHint: 'Прокручивайте список, чтобы загрузить больше задач',
    executingNow: 'Ваша задача исполняется',
    orderStatusUnavailable: 'Ожидание обновления статуса задачи...',
    timeLeft: 'Осталось времени:',
    price: 'Цена:',
    taskStatus: 'Статус задачи',
    hoursUnit: 'ч',
    minutesUnit: 'мин',
    subtasks: 'Подзадачи',
    selectedMethod: 'Выбранный способ',
    remainingBalance: 'Остаток к оплате',
    promoApplied: 'Промокод',
    resultTitle: 'Результат',
    loadingTask: 'Загрузка задачи...',
    elapsed: 'Прошло',
    selectedSolver: 'Решатель',
    blurredWidget: 'Превью виджета'
  },
  placeholders: {
    promoCode: 'WELCOME10',
    taskSearch: 'id, название, решатель, статус...',
    contactName: 'Ваше имя',
    contactEmail: 'your@email.com',
    contactMessage: 'Расскажите, чем вам помочь...'
  },
  buttons: {
    apply: 'Применить',
    createNewTask: 'Создать новую задачу',
    openAllTasks: 'Открыть все задачи',
    createTask: 'Создать задачу',
    stopTask: 'Остановить задачу',
    socialLogin: 'Соцлогин',
    passkeyLogin: 'Passkey вход',
    actor: 'Actor',
    payWithPromo: 'Оплатить промокодом',
    anonymous: 'Анонимно',
    cancel: 'Отменить',
    delete: 'Удалить',
    tryAgain: 'Повторить',
    payNow: 'Оплатить',
    depositNow: 'Внести депозит',
    confirmLinkedWallet: 'Подтвердить привязанный кошелёк',
    openResult: 'Открыть результат',
    saveResult: 'Сохранить результат',
    enterPromo: 'Ввести промокод',
    closeDialog: 'Закрыть',
    sendMessage: 'Открыть письмо',
    backToMethods: 'Назад к способам',
    viewExternalResult: 'Открыть внешний результат'
  },
  notes: {
    waitingCompletion: 'Ожидание завершения задачи по /task/<orderId>',
    paymentInvoice: 'Ссылка на оплату:',
    noTasks: 'Задачи не найдены',
    noTasksDescription: 'Создайте хотя бы одну задачу или измените строку поиска.'
  },
  auth: {
    connectPasskeyContinue: 'Подключиться и продолжить',
    continueAuthenticated: 'Продолжить с авторизованным профилем',
    signedIn: 'Вы вошли в систему. Можете отправить задачу.',
    reown: 'Reown',
    passkey: 'Passkey',
    walletTitle: 'Wallet / Social',
    walletDetail: 'Используйте MetaMask, WalletConnect, Email или Google, чтобы выбрать аккаунт плательщика.',
    passkeyTitle: 'Passkey',
    localhostTitle: 'Localhost',
    passkeyDetail: 'Используйте аккаунт платформы или продолжите через email, если профиля ещё нет.',
    anonymousTitle: 'Гость',
    anonymousDetail: 'Продолжить без профиля и оплатить через депозит.',
    walletAccount: 'Подключённый аккаунт',
    walletNetworkEthereum: 'Ethereum',
    walletNetworkGnosis: 'Gnosis',
    anonymousHint: 'Анонимная оплата доступна.'
  },
  executionFlow: {
    batching: {
      title: 'Батчинг ордеров',
      detail: 'Ордеры, созданные одновременно, объединяются, чтобы снизить стоимость исполнения.'
    },
    competition: {
      title: 'Конкуренция началась',
      detail: 'Решатели торгуются за маршрут и проверяют выполнение перед запуском.'
    },
    winnerSelected: {
      title: 'Найдена лучшая цена',
      detail: 'Победивший решатель фиксирует маршрут и готовит исполнение.'
    },
    bridging: {
      title: 'Идёт бриджинг к сети назначения',
      detail: 'Активы переводятся в целевую сеть, подтверждения ещё собираются.'
    },
    'awaiting-auth': {
      title: 'Выберите способ продолжить',
      detail: 'Выберите вход или продолжите анонимно перед оплатой.'
    },
    'awaiting-payment': {
      title: 'Готово к оплате',
      detail: 'Авторизация подтверждена. Завершите оплату или депозит, чтобы открыть результат.'
    }
  },
  subtasks: {
    prepareConfig: {
      id: 'prepare-config',
      title: 'Подготовить конфигурацию',
      detail: 'Нормализовать запрос, собрать контекст и зафиксировать объём исполнения.'
    },
    runChecks: {
      id: 'run-checks',
      title: 'Сделать проверки',
      detail: 'Проверить зависимости, dry-run и ограничения безопасности перед запуском.'
    },
    syncArtifacts: {
      id: 'sync-artifacts',
      title: 'Синхронизировать артефакты',
      detail: 'Перенести подготовленные артефакты в целевое окружение.'
    },
    profileCode: {
      id: 'profile-code',
      title: 'Профилировать критические пути',
      detail: 'Измерить самые медленные участки до оптимизаций.'
    },
    benchmarkPaths: {
      id: 'benchmark-paths',
      title: 'Сравнить варианты',
      detail: 'Сопоставить конкурирующие стратегии и выбрать самый быстрый вариант.'
    },
    publishResult: {
      id: 'publish-result',
      title: 'Подготовить результат',
      detail: 'Упаковать результат и подготовить поверхность доставки.'
    }
  },
  payment: {
    summaryTitle: 'Сводка оплаты',
    methodSelectTitle: 'Выберите путь оплаты',
    walletReadyTitle: 'Оплата кошельком готова',
    passkeyReadyTitle: 'Оплата через passkey готова',
    anonymousReadyTitle: 'Требуется депозит',
    promoHint: 'Промокод может покрыть часть стоимости. Оставшийся баланс останется доступным к оплате.',
    depositDialogTitle: 'Выберите способ депозита',
    depositDialogDetail: 'Выберите, как пополнить заказ. Промокод можно комбинировать с другим способом.',
    depositPendingTitle: 'Депозит в процессе',
    depositPendingDetail: 'Ждём подтверждения пополнения перед разблокировкой результата.',
    paidTitle: 'Оплата подтверждена',
    paidDetail: 'Заказ оплачен. Подготавливаем выдачу результата.',
    linkedWalletHint: 'К этому passkey-профилю привязан кошелёк. Всё равно нужно подтверждение.',
    payCtaHint: 'Используйте выбранный аккаунт, чтобы завершить оплату сейчас.'
  },
  result: {
    widgetTitle: 'Интерактивный виджет результата',
    widgetSummary: 'Откройте встроенный виджет выдачи для этого завершённого заказа.',
    iframeTitle: 'Встроенная панель результата',
    iframeSummary: 'Результат доступен внутри встроенной панели для быстрого просмотра.',
    externalTitle: 'Внешняя ссылка на результат',
    externalSummary: 'Этот заказ завершается на внешнем ресурсе.',
    anonymousSaveHint: 'Авторизуйтесь, чтобы сохранить результат и вернуться к нему позже.'
  },
  vpnFlow: {
    discoveryTitle: 'Выясняем, какой VPN сервис лучше',
    discoveryDetail: 'Сравниваем провайдеров, регионы и ограничения по протоколам, прежде чем выбрать вариант.',
    pricingTitle: 'Узнаём цену',
    pricingDetail: 'Выбранный решатель оценивает стоимость настройки и ожидаемое время выполнения.',
    deployingTitle: 'Сервер подобран, начинаем разворачивать сервис',
    deployingDetail: 'Идёт подготовка окружения и настройка VPN-сервиса на выбранном сервере.',
    readyTitle: 'Сервис готов',
    readyDetail: 'Виджет результата подготовлен из результата solver и пока остаётся заблюренным.',
    widgetTitle: 'Виджет VPN-сервиса',
    widgetSummary: 'Результат сервиса подготовлен и позже будет подключён к payload crater.'
  },
  errors: {
    orderRequired: 'Текст задачи обязателен',
    loadGeneric: 'Не удалось создать задачу',
    unknown: 'Неизвестная ошибка',
    fallback: 'Не удалось создать задачу',
    promoEmpty: 'Введите промокод.',
    promoOk: 'Промокод применён: скидка 10%',
    promoWrong: 'Промокод не распознан',
    passkeyFailed: 'Не удалось войти через Passkey',
    walletConfirmationRequired: 'Подтвердите привязанный кошелёк перед продолжением.'
  },
  table: {
    headers: {
      task: 'Задача',
      solver: 'Решатель',
      status: 'Статус',
      amount: 'Сумма',
      created: 'Создано',
      action: 'Действие'
    }
  },
  contact: {
    title: 'Написать в Lefine',
    description: 'Заполните сообщение, и мы откроем почтовый клиент с готовым черновиком.',
    nameLabel: 'Имя',
    emailLabel: 'Email',
    messageLabel: 'Сообщение'
  }
} as const;
