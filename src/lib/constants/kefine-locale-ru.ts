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
    title: 'Опишите технический repo',
    subtitle: '',
    placeholder: 'Опишите любой технический repo...',
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
      'Разобраться с падением мобильного приложения после релиза',
      'Упаковать legacy Node.js сервис в Docker',
      'Написать интеграционные тесты для REST API',
      'Добавить rate limiting к Express endpoint',
      'Настроить автоматические бэкапы базы в S3',
      'Реализовать GraphQL gateway поверх двух REST сервисов',
      'Перенести Postgres в managed-кластер в облаке',
      'Добавить structured logging и tracing запросов',
      'Сделать CLI-утилиту для пакетной конвертации изображений',
      'Сгенерировать OpenAPI-спецификацию из существующих роутов',
      'Подключить Sentry в SvelteKit-приложение',
      'Настроить pre-commit хуки c lint + format',
      'Подключить Stripe checkout к лендингу',
      'Настроить GitHub Actions matrix на Linux + macOS + Windows',
      'Задеплоить Rust web-сервис на fly.io',
      'Написать маленький Go прокси с подменой заголовков',
      'Зеркалировать приватный GitHub-репозиторий в GitLab по ночам',
      'Добавить SSO через Google Workspace в Django admin',
      'Перевести монолитный CSS на токены и дизайн-систему',
      'Спрофилировать медленный рендер React и убрать лишние renders',
      'Сделать webhook-приёмник с retry и dead-letter очередью'
    ],
    executeAria: 'Выполнить repo',
    backgroundExecuteAria: 'Отправить repo в фоне',
    solverSearchLabel: 'Поиск Solver',
    addFile: '+ файл',
    addExecutionEstimate: '+ срок',
    fileCount: (count: number) => `${count} файл${count === 1 ? '' : count < 5 ? 'а' : 'ов'}`,
    composerHints: 'Enter отправляет, Alt+Enter ставит в фон, Shift+Enter делает новую строку',
    richEditorDescription: 'Ctrl+Enter открывает полноценный ProseKit-редактор для длинного технического описания.',
    serviceSetupTitle: 'Настройте сервис перед запуском',
    serviceSetupSubtitle: 'Проверьте переменные шаблона, при необходимости измените значения и только потом запускайте сервис.',
    pinnedServicesTitle: 'Закреплённые сервисы',
    pinnedServicesSubtitle: 'Начните с настроенных точек входа сервиса перед созданием произвольного repo.',
    pathsTitle: 'Пути repo',
    pathCreateLabel: 'Создание repo:',
    pathStatusLabel: 'Lepo:',
    pathPaymentLabel: 'Оплата:',
    noRecentTasks: 'Сохранённых repos пока нет',
    matchedTasks: 'Найденные завершённые repos',
    noMatchedTasks: 'По этому запросу завершённые repos не найдены'
  },
  defaults: {
    unknownSolver: 'Неизвестный решатель',
    taskTitle: 'Lepo',
    solverNetwork: 'Сеть решателя',
    openSolverMarket: 'Открыть Solver Market',
    defaultCurrency: 'USDC',
    defaultDescription: ''
  },
  status: {
    statusPollingMessage: (solver: string, queued: boolean) =>
      `Решатель ${solver} сейчас ${queued ? 'принимает' : 'исполняет'} repo`,
    createSending: 'Пересылка документа...',
    queued: (solver: string) => `Lepo в очереди. Назначенный решатель: ${solver}`,
    notCompleted: 'Решатель ещё не вернул статус выполнения. Обновите статус repo вручную.',
    completed: 'Lepo завершён. Результат готов.',
    savingDocument: 'Сохраняем...'
  },
  labels: {
    solver: 'Решатель:',
    task: 'Lepo:',
    budget: 'Бюджет:',
    executionEstimate: 'Оценка выполнения:',
    taskId: 'ID repo:',
    amount: 'Сумма:',
    promoCode: 'Промокод',
    chooseMethod: 'Выберите способ входа',
    paymentInvoice: 'Ссылка на оплату:',
    searchTasks: 'Поиск repos',
    noTasks: 'Lepos не найдены',
    noTasksDescription: 'Создайте хотя бы один repo или измените строку поиска.',
    openPaymentInvoice: 'Открыть счёт',
    openOrderLink: 'Открыть заказ',
    loadMoreHint: 'Прокручивайте список, чтобы загрузить больше repos',
    executingNow: 'Ваш repo исполняется',
    orderStatusUnavailable: 'Ожидание обновления статуса repo...',
    timeLeft: 'Осталось времени:',
    price: 'Цена:',
    summary: 'Сводка repo',
    execution: 'Исполнение',
    relatedItems: 'Связанные элементы',
    window: 'Срок',
    taskStatus: 'Статус repo',
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
    taskQueue: 'Очередь repos',
    taskTree: 'Дерево repo',
    taskFeed: 'Лента repo',
    selectedMethod: 'Выбранный способ',
    remainingBalance: 'Остаток к оплате',
    promoApplied: 'Промокод',
    resultTitle: 'Результат',
    loadingTask: 'Загрузка repo...',
    elapsed: 'Прошло',
    selectedSolver: 'Решатель',
    blurredWidget: 'Превью виджета',
    commentAction: 'Комментировать',
    createBranch: 'Создать ветку',
    createBranchLeft: 'Создать левую ветку',
    createBranchHidden: 'Создать скрытую ветку',
    editCode: 'Редактировать код',
    expandBranch: 'Раскрыть ветку',
    collapseBranch: 'Свернуть ветку',
    showHiddenBranches: 'Показать скрытые ветки',
    hideBranches: 'Скрыть ветки',
    inlineCodeEditHint: 'Измените кодовый блок'
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
    createNewTask: 'Создать новый repo',
    openAllTasks: 'Открыть все repos',
    createTask: 'Создать repo',
    stopTask: 'Остановить repo',
    socialLogin: 'Соцлогин',
    passkeyLogin: 'Passkey вход',
    actor: 'Workspace',
    editTaskFeed: 'Редактировать ленту repo',
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
    noTasks: 'Lepos не найдены',
    noTasksDescription: 'Создайте хотя бы один repo или измените строку поиска.'
  },
  auth: {
    connectPasskeyContinue: 'Подключиться и продолжить',
    continueAuthenticated: 'Продолжить с авторизованным workspace',
    signedIn: 'Вы вошли в систему. Можете отправить repo.',
    reown: 'Reown',
    passkey: 'Passkey',
    walletTitle: 'Кошелёк / соцсети',
    browserWalletTitle: 'Браузерный кошелёк',
    walletConnectTitle: 'WalletConnect',
    tonConnectTitle: 'TON Connect',
    emailCodeTitle: 'Код по email',
    googleTitle: 'Google',
    githubTitle: 'GitHub',
    emailCodeDescription: 'Введите email, чтобы получить одноразовый код для входа.',
    emailCodeEmailLabel: 'Email',
    emailCodeEmailPlaceholder: 'you@example.com',
    emailCodeLabel: 'Одноразовый код',
    emailCodePlaceholder: '123456',
    emailCodeSendLabel: 'Отправить код',
    emailCodeResendLabel: 'Отправить ещё раз',
    emailCodeVerifyLabel: 'Проверить код',
    walletDetail: 'Используйте MetaMask, WalletConnect, email или Google, чтобы выбрать аккаунт плательщика.',
    passkeyTitle: 'Passkey',
    privateKeyTitle: 'Приватный ключ',
    privateKeyDescription: 'Вставьте compact pqsk key или полный PEM private key. Строка с экранированными \\n тоже поддерживается. Браузер локально выводит ML-DSA public key и отправляет только public key string.',
    privateKeyGenerateLabel: 'Создать workspace',
    passkeyDetail: 'Используйте аккаунт платформы или продолжите через email, если workspace ещё нет.',
    anonymousTitle: 'Гость',
    anonymousDetail: 'Продолжить без workspace и оплатить через депозит.',
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
      title: 'Критические пути workspace',
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
    linkedWalletHint: 'К этому passkey-workspace привязан кошелёк. Всё равно нужно подтверждение.',
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
          'Lefine — это автоматизированный маркетплейс фриланса (AFM). Вы описываете нужную работу. Lefine находит solver-ов и возвращает результат.'
      },
      task: {
        title: 'Бриф',
        detail: 'Опишите работу и укажите срок.'
      },
      quote: {
        title: 'Котировка',
        detail: 'Lefine находит доступных solver-ов и показывает предложение до начала работы.'
      },
      delivery: {
        title: 'Доставка',
        detail: 'Lefine возвращает финальный доступ или результат.'
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
    title: 'Workspace',
    subtitle: 'Публичный workspace, соцсети, завершённые задачи и реферальные настройки.',
    onboardingTitle: 'Заполните workspace',
    onboardingSubtitle: 'После входа завершите workspace в два шага: имя и социальные сети.',
    onboardingStepLabel: 'Шаг',
    identityTitle: 'Личные данные',
    cardStepTitle: 'Бонус за карту',
    socialsStepTitle: 'Социальные сети',
    firstName: 'Имя',
    surname: 'Фамилия',
    identityLeadTitle: 'Задайте публичную идентичность workspace',
    identityLeadText:
      'Имя и фамилия определяют, как workspace выглядит в публичных ссылках, завершённых задачах и поверхностях подписки.',
    firstNameHint: 'Укажите реальное имя или рабочее имя. Это основная часть вашей публичной идентичности.',
    surnameHint: 'Добавьте фамилию, чтобы workspace выглядел завершённым и вызывал больше доверия у участников.',
    bioHint: 'Кратко опишите свой стек, специализацию или то, что пользователю важно понять о вашем workspace.',
    continueToCard: 'Перейти к социальным сетям',
    continueToSocials: 'Перейти к социальным сетям',
    finishSetup: 'Завершить настройку',
    setupDone: 'Workspace настроен',
    setupHint: 'Завершите шаги один раз, после этого останется обычная страница workspace.',
    bonusTitle: 'Получите бонус $100',
    bonusText: 'Проверьте банковскую карту, связанную с армянским банком. После BIN-проверки бонус будет начислен на баланс workspace.',
    username: 'Имя пользователя',
    displayName: 'Отображаемое имя',
    bio: 'Краткая информация',
    publicToggle: 'Сделать workspace публичным',
    publicStatus: 'Публичный workspace',
    privateStatus: 'Приватный workspace',
    makePublic: 'Сделать workspace публичным',
    makePrivate: 'Сделать workspace приватным',
    publicHint: 'Workspace теперь публичный. Его можно находить, на него можно подписываться и через него можно привлекать задачи.',
    privateHint: 'Workspace приватный. Откройте замок, чтобы сделать его публичным и привлекать задачи.',
    socialLinks: 'Социальные ссылки',
    secretData: 'Секретные данные',
    sshPublicKey: 'Публичный SSH-ключ',
    sshPublicKeyHint: 'Вставьте публичный SSH-ключ, который нужно авторизовать для скачивания и clone доступа к репозиториям.',
    privateKey: 'Приватный ключ',
    privateKeyHint: 'Здесь будет показан сгенерированный приватный ключ workspace.',
    copyPrivateKey: 'Скопировать приватный ключ',
    privateKeyCopied: 'Приватный ключ скопирован',
    socialLabel: 'Название',
    socialUrl: 'Ссылка',
    addLink: 'Добавить ссылку',
    save: 'Сохранить workspace',
    signOut: 'Выйти',
    authDrawerSubtitle: 'Быстрый доступ к workspace и последним repos.',
    openPublicProfile: 'Открыть публичный workspace',
    latestTasks: 'Последние repos',
    projects: 'Проекты',
    repos: 'Lepos',
    closedTasks: 'Закрытые выполненные repos',
    publicTask: 'Сделать repo публичным',
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
    referralPercent: 'Реферальный процент',
    hidden: 'Этот workspace приватный.',
    follow: 'Подписаться',
    following: 'Вы подписаны',
    followers: 'Подписчики',
    publicTasks: 'Публичные repos',
    noPublicTasks: 'Публичных repos пока нет',
    noRecentTasks: 'Последних repos пока нет',
    noOwnerTasks: 'Завершённых repos пока нет',
    openTask: 'Открыть',
    buyView: 'Купить просмотр',
    buyWatch: 'Следить за статусом',
    buyJoin: 'Присоединиться к repo',
    ownerTask: 'Ваш repo',
    accessGranted: 'Доступ открыт',
    profileUnavailable: 'Workspace недоступен',
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
  },
  solversView: {
    tasksAside: 'Задачи',
    solvers: 'Солверы',
    taskDescription: 'Описание задачи',
    settings: 'Настройки',
    clone: 'Клонировать',
    pinSolution: 'Закрепить решение',
    view: 'Просмотр',
    apply: 'Применить',
    applied: 'Применено',
    metricsAria: 'Метрики солвера — кликните для фокуса на графиках',
    metricsTitle: 'Метрики солвера',
    metricsSubtitle: 'Время, цена и успешность',
    compactSolversAria: 'Компактный список солверов',
    filesAria: 'Файлы',
    chartMetrics: 'Метрики',
    chartExecutionTime: 'Время выполнения',
    chartPrice: 'Цена',
    chartSuccessRate: 'Успешность',
    chartSeconds: 'секунд',
    chartUsd: 'долл.',
    chartPercent: '%',
    chartProjectAria: 'Проект и slug',
    chartFallback: 'Время, цена и успешность по солверам',
    chartEfficiency: 'Ценность за доллар',
    chartEfficiencyUnit: 'успех% / $',
    priceFrom: 'От',
    priceFree: 'Бесплатно',
    cloneHeading: 'Клонирование репозитория',
    copy: 'Копировать',
    copied: 'Скопировано!',
    cloneTestRun: 'Проверить git-интеграцию',
    cloneTestRunning: 'Проверка…',
    cloneTestOk: 'Репозиторий доступен',
    cloneTestFail: 'Не удалось подключиться к репозиторию',
    settingsHeading: 'Настройки задачи',
    settingsPublic: 'Публичная задача',
    settingsVcs: 'Включить VCS',
    settingsBranch: 'Ветка по умолчанию',
    settingsApply: 'Применить'
  },
  solutionView: {
    ariaLabel: 'Вид решения',
    tabs: {
      testing: {
        label: 'Тестирование',
        hint: 'Отправить тестовый запрос солверу'
      },
      checkpoints: {
        label: 'Чекпоинты',
        hint: 'История коммитов и ветки'
      },
      source: {
        label: 'Исходный код',
        hint: 'Просмотр изменённых файлов'
      }
    }
  }
} as const;
