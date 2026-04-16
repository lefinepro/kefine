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
    languageArmenian: 'Армянский',
    theme: {
      auto: 'Авто',
      light: 'Светлая',
      dark: 'Тёмная',
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
      company: 'Реквизиты компании',
      related: 'Связанные юридические страницы',
      updated: 'Обновлено',
      backToApp: 'Вернуться в приложение'
    },
    githubUrl: 'https://github.com/lefinepro',
    contactEmail: 'order@lefine.pro',
    emailDialog: {
      title: 'Написать в Lefine',
      description: 'Выберите, как связаться с нами.',
      copy: 'Скопировать email',
      copied: 'Скопировано',
      openClient: 'Открыть почтовый клиент'
    },
    contactPage: {
      title: 'Связаться с нами',
      description: 'Используйте email для вопросов по поддержке, заказам, оплате и документам.',
      openEmail: 'Открыть почтовый клиент',
      openGithub: 'Открыть GitHub',
      statusLabel: 'Статус',
      statusValue: 'Доступно для заказов и поддержки',
      supportFeature: 'Поддержка заказов',
      paymentFeature: 'Платежи и инвойсы',
      docsFeature: 'Документы и правовые запросы',
      responseFeature: 'Ответ по электронной почте',
      privacyCard: 'Конфиденциальность и юридические условия',
      mailClientHint: 'Открыть почтовый клиент по умолчанию',
      contactsTitle: 'Контакты',
      servicesTitle: 'Сервисы',
      emailFact: 'Электронная почта',
      phoneFact: 'Телефон',
      countryFact: 'Страна'
    }
  },
  create: {
    title: 'Опишите техническую задачу',
    subtitle: 'Укажите срок выполнения. Lefine найдёт исполнителя, подтвердит маршрут и ETA, а затем доставит результат.',
    placeholder: 'Опишите любую техническую задачу...',
    placeholderVariants: [
      'Исправить сломанный rollback в CI/CD',
      'Настроить мониторинг и алерты для прод-сервиса',
      'Собрать Telegram-бота для заявок в поддержку',
      'Оптимизировать медленный запрос в PostgreSQL',
      'Реализовать OAuth-вход в веб-приложении',
      'Развернуть приватный VPN для удалённой команды',
      'Вынести endpoint из монолита в отдельный сервис',
      'Написать парсер ответов API и экспорт отчётов',
      'Собрать landing page для технического продукта',
      'Разобраться с падением мобильного приложения после релиза'
    ],
    executeAria: 'Выполнить задачу',
    backgroundExecuteAria: 'Отправить задачу в фоне',
    addFile: '+ файл',
    addExecutionEstimate: '+ срок',
    fileCount: (count: number) => `${count} файл${count === 1 ? '' : count < 5 ? 'а' : 'ов'}`,
    composerHints: 'Enter отправляет, Alt+Enter ставит в фон, Shift+Enter делает новую строку',
    serviceSetupTitle: 'Настройте сервис перед запуском',
    serviceSetupSubtitle: 'Проверьте переменные шаблона, при необходимости измените значения и только потом запускайте сервис.',
    pinnedServicesTitle: 'Закреплённые сервисы',
    pinnedServicesSubtitle: 'Начните с настроенных точек входа сервиса перед созданием произвольной задачи.',
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
    createSending: 'Пересылка документа...',
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
    summary: 'Сводка задачи',
    execution: 'Исполнение',
    relatedItems: 'Связанные элементы',
    window: 'Срок',
    taskStatus: 'Статус задачи',
    hoursUnit: 'ч',
    minutesUnit: 'мин',
    subtasks: 'Подзадачи',
    exchangeWaiting: 'Биржа',
    performers: 'Исполнители',
    notebook: 'Ноутбук выполнения',
    iterations: 'Итерации',
    interimResult: 'Промежуточный результат',
    finalResult: 'Финальный результат',
    leaveComment: 'Оставить комментарий',
    noNotebookYet: 'Исполнитель ещё не опубликовал этапы ноутбука.',
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
    actor: 'Актор',
    payWithPromo: 'Оплатить промокодом',
    anonymous: 'Анонимно',
    cancel: 'Отменить',
    delete: 'Удалить',
    tryAgain: 'Повторить',
    payNow: 'Оплатить',
    depositNow: 'Внести депозит',
    confirmLinkedWallet: 'Подтвердить привязанный кошелёк',
    openResult: 'Открыть результат',
    confirmStep: 'Подтвердить шаг',
    rejectResult: 'Отклонить результат',
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
    walletTitle: 'Кошелёк / соцсети',
    walletDetail: 'Используйте MetaMask, WalletConnect, email или Google, чтобы выбрать аккаунт плательщика.',
    passkeyTitle: 'Passkey',
    privateKeyTitle: 'Приватный ключ',
    privateKeyDescription: 'Вставьте compact pqsk key или полный PEM private key. Строка с экранированными \\n тоже поддерживается. Браузер локально выводит ML-DSA public key и отправляет только public key string.',
    privateKeyGenerateLabel: 'Создать актор',
    passkeyDetail: 'Используйте аккаунт платформы или продолжите через email, если профиля ещё нет.',
    anonymousTitle: 'Гость',
    anonymousDetail: 'Продолжить без профиля и оплатить через депозит.',
    walletAccount: 'Подключённый аккаунт',
    walletNetworkEthereum: 'Ethereum',
    walletNetworkGnosis: 'Gnosis',
    walletNetworkAvalanche: 'Avalanche',
    walletNetworkAvalancheFuji: 'Тестовая сеть Avalanche',
    anonymousHint: 'Анонимная оплата доступна.'
  },
  executionFlow: {
    queued: {
      title: 'Задача отправлена на биржу',
      detail: 'Задача зарегистрирована и ожидает исполнителя.'
    },
    matching: {
      title: 'Идёт поиск исполнителя',
      detail: 'Биржа подбирает доступных исполнителей для этой задачи.'
    },
    assigned: {
      title: 'Исполнители найдены',
      detail: 'Один или несколько исполнителей приняли задачу и готовят запуск.'
    },
    running: {
      title: 'Задача выполняется',
      detail: 'Выполнение уже идёт. Ниже можно следить за этапами и обновлениями исполнителя.'
    },
    review: {
      title: 'Результат на проверке',
      detail: 'Исполнитель вернул результат. Проверьте этапы ноутбука и подтвердите, если нужно.'
    },
    completed: {
      title: 'Выполнение завершено',
      detail: 'Финальный ноутбук и результат готовы.'
    },
    failed: {
      title: 'Выполнение завершилось ошибкой',
      detail: 'Текущий запуск завершился ошибкой. Посмотрите последний этап ноутбука.'
    },
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
  afe: {
    title: '',
    labels: {
      input: 'Задача',
      intake: 'вход',
      route: 'маршрут',
      result: 'результат',
      delivery: 'Доставка'
    },
    cards: {
      afe: {
        title: 'Что такое Lefine?',
        detail:
          'Lefine — это автоматизированный маркетплейс фриланса (AFM), где вы описываете нужную работу, а Lefine находит лучший путь, чтобы доставить результат.'
      },
      task: {
        title: 'Бриф',
        detail: 'Опишите работу и укажите срок.'
      },
      quote: {
        title: 'Котировка',
        detail: 'Исполнитель подтверждает маршрут и ETA.'
      },
      delivery: {
        title: 'Доставка',
        detail: 'Lefine доставляет финальный доступ или результат.'
      }
    }
  },
  errors: {
    backendUnavailableTitle: 'Crater не настроен',
    backendUnavailableDetail: 'Проверка состояния backend не прошла. Запустите crater или исправьте настроенный crater URL.',
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
    emailLabel: 'Электронная почта',
    messageLabel: 'Сообщение'
  },
  profile: {
    title: 'Профиль',
    subtitle: 'Публичный профиль, соцсети, завершённые задачи, реферальные настройки и бонус за карту.',
    onboardingTitle: 'Заполните профиль',
    onboardingSubtitle: 'После входа завершите профиль в три шага: имя, бонус за карту и социальные сети.',
    onboardingStepLabel: 'Шаг',
    identityTitle: 'Личные данные',
    cardStepTitle: 'Бонус за карту',
    socialsStepTitle: 'Социальные сети',
    firstName: 'Имя',
    surname: 'Фамилия',
    identityLeadTitle: 'Задайте публичную идентичность профиля',
    identityLeadText:
      'Имя и фамилия определяют, как профиль выглядит в публичных ссылках, завершённых задачах и поверхностях подписки.',
    firstNameHint: 'Укажите реальное имя или рабочее имя. Это основная часть вашей публичной идентичности.',
    surnameHint: 'Добавьте фамилию, чтобы профиль выглядел завершённым и вызывал больше доверия у участников.',
    bioHint: 'Кратко опишите свой стек, специализацию или то, что пользователю важно понять о вашем профиле.',
    continueToCard: 'Перейти к бонусу за карту',
    continueToSocials: 'Перейти к социальным сетям',
    finishSetup: 'Завершить настройку',
    setupDone: 'Профиль настроен',
    setupHint: 'Завершите шаги один раз, после этого останется обычная страница профиля.',
    bonusTitle: 'Получите бонус $100',
    bonusText: 'Проверьте банковскую карту, связанную с армянским банком. После BIN-проверки бонус будет начислен на баланс профиля.',
    username: 'Имя пользователя',
    displayName: 'Отображаемое имя',
    bio: 'Краткая информация',
    publicToggle: 'Сделать профиль публичным',
    publicStatus: 'Публичный профиль',
    privateStatus: 'Приватный профиль',
    makePublic: 'Сделать профиль публичным',
    makePrivate: 'Сделать профиль приватным',
    publicHint: 'Профиль теперь публичный. Его можно находить, на него можно подписываться и через него можно привлекать задачи.',
    privateHint: 'Профиль приватный. Откройте замок, чтобы сделать его публичным и привлекать задачи.',
    socialLinks: 'Социальные ссылки',
    socialLabel: 'Название',
    socialUrl: 'Ссылка',
    addLink: 'Добавить ссылку',
    save: 'Сохранить профиль',
    signOut: 'Выйти',
    shareProfile: 'Скопировать ссылку профиля',
    openPublicProfile: 'Открыть публичный профиль',
    closedTasks: 'Закрытые выполненные задачи',
    publicTask: 'Сделать задачу публичной',
    viewAccess: 'Платный просмотр',
    watchAccess: 'Слежение за статусом',
    joinAccess: 'Подключиться к выполнению',
    cardTitle: 'Бонус за банковскую карту',
    cardHint: 'Привяжите карту и проверьте BIN на причастность к армянскому банку, чтобы получить бонус $100.',
    cardNumber: 'Номер карты или первые 6-8 цифр',
    verifyCard: 'Проверить карту',
    skipCard: 'Пропустить пока',
    socialOptionalHint: 'Социальные ссылки необязательны. Можно завершить и без них.',
    socialBonusHint: 'Добавьте хотя бы одну соцссылку, чтобы разблокировать бонус $100 за карту.',
    bonusBalance: 'Бонусный баланс',
    referralPercent: 'Реферальный процент',
    profileCopied: 'Ссылка профиля скопирована',
    taskCopied: 'Ссылка задачи скопирована',
    shareTask: 'Скопировать ссылку задачи',
    hidden: 'Этот профиль приватный.',
    follow: 'Подписаться',
    following: 'Вы подписаны',
    followers: 'Подписчики',
    publicTasks: 'Публичные задачи',
    noPublicTasks: 'Публичных задач пока нет',
    noOwnerTasks: 'Завершённых задач пока нет',
    openTask: 'Открыть задачу',
    buyView: 'Купить просмотр',
    buyWatch: 'Следить за статусом',
    buyJoin: 'Присоединиться к задаче',
    ownerTask: 'Ваша задача',
    accessGranted: 'Доступ открыт',
    profileUnavailable: 'Профиль недоступен',
    templates: 'Сервисы',
    templatesSubtitle: 'Создавайте переиспользуемые сервисы и делитесь ими как отдельными точками входа.',
    noTemplates: 'Сервисов пока нет',
    createTemplate: 'Создать',
    templateTitle: 'Название сервиса',
    templateDescription: 'Описание сервиса',
    templatePrompt: 'Промт сервиса',
    templateVariables: 'Переменные промта',
    templateVariableDefault: 'Значение по умолчанию',
    templateLocalizationHint: 'Автокопии для EN, RU и HY создаются из текущей локали редактора.',
    templatePrefillTitle: 'Заголовок запроса сервиса',
    templatePrefillDescription: 'Запрос сервиса',
    templatePricingMode: 'Корректировка цены',
    templateFixedMode: 'USD',
    templatePercentMode: 'Процент',
    templatePrice: 'Размер корректировки',
    templatePercent: 'Процент сервиса',
    templateFiles: 'Файлы сервиса',
    templateAddFiles: 'Добавить файлы сервиса',
    templatePublish: 'Опубликовать сервис',
    templatePublished: 'Опубликован',
    templateDraft: 'Черновик',
    templatePrivate: 'Приватный',
    templatePublic: 'Публичный',
    templateVisibility: 'Видимость',
    templateCreateCtaTitle: 'Создайте первый сервис',
    templateCreateCtaDetail: 'Сервисы по умолчанию скрыты. Создайте сервис, настройте цену и бонусы, затем выберите приватный или публичный режим.',
    templateOpenEditor: 'Открыть редактор сервиса',
    templateBonusTitle: 'Бонус сервиса',
    templateBonusToggle: 'Начислять бонус на баланс после использования сервиса',
    templateBonusMode: 'Режим бонуса',
    templateBonusValue: 'Размер бонуса',
    templateBonusFixed: 'Фиксированный бонус в USD',
    templateBonusPercent: 'Процентный бонус',
    templateBonusPreview: 'Начисление на баланс',
    templateFreeHint: 'Сервис может стать фактически бесплатным, если бонус перекрывает цену.',
    templateCopyLink: 'Скопировать ссылку сервиса',
    templateOpen: 'Открыть сервис',
    templateDelete: 'Удалить сервис',
    templateFeePreview: 'Комиссия автора',
    templateNetPreview: 'Остаток заказа',
    templateLinkCopied: 'Ссылка сервиса скопирована',
    templateSlug: 'Адрес сервиса',
    templateSlugHint: 'Необязательно. Оставьте пустым, чтобы сохранить UUID-ссылку.'
  }
} as const;
