import { writable } from 'svelte/store';

const LOCALE_STORAGE_KEY = 'kefine-locale';

export type KefineLocale = 'en' | 'ru';

const KEFINE_TEXT_EN = {
  meta: {
    locale: 'en'
  },
  brand: {
    name: 'Lefine'
  },
  topbar: {
    topActions: 'Top actions',
    openActionsMenu: 'Open actions menu',
    closeActionsMenu: 'Close actions menu',
    quickActions: 'Quick actions',
    language: 'Language',
    languageAria: 'Open language menu',
    languageEnglish: 'English',
    languageRussian: 'Russian',
    theme: {
      switchToDark: 'Switch to dark theme',
      switchToLight: 'Switch to light theme'
    },
    dockLabel: 'Sidebar controls',
    socialLabel: 'Community links',
    mailLabel: 'Write to us',
    githubLabel: 'Open GitHub',
    signIn: 'Sign in',
    signedIn: 'Signed in',
    socialLinks: {
      mastodon: {
        label: 'Open Mastodon',
        href: 'https://mastodon.social/@lefine'
      },
      discord: {
        label: 'Open Discord',
        href: 'https://discord.com/invite/lefine'
      },
      linkedin: {
        label: 'Open LinkedIn',
        href: 'https://www.linkedin.com/company/lefine'
      },
      telegram: {
        label: 'Open Telegram',
        href: 'https://t.me/lefine'
      }
    },
    githubUrl: 'https://github.com/lefine',
    contactEmail: 'order@lefine.pro'
  },
  create: {
    title: 'Solve problems in hours, not months.',
    placeholder: 'Describe what should be solved...',
    placeholderVariants: ['Need access to Telegram', 'Deploy private VPN for the team', 'Deploy my production app', 'Optimize an algorithm'],
    executeAria: 'Execute task',
    pathsTitle: 'Task routes',
    pathCreateLabel: 'Create task:',
    pathStatusLabel: 'Task:',
    pathPaymentLabel: 'Payment:',
    recentTasks: 'Recent tasks',
    noRecentTasks: 'No saved tasks yet',
    matchedTasks: 'Resolved tasks',
    noMatchedTasks: 'No resolved tasks match this query yet'
  },
  defaults: {
    unknownSolver: 'Unknown solver',
    taskTitle: 'Task',
    solverNetwork: 'Solver network',
    openSolverMarket: 'Open Solver Market',
    defaultCurrency: 'USDC',
    defaultDescription: ''
  },
  status: {
    statusPollingMessage: (solver: string, queued: boolean) => `Solver ${solver} is ${queued ? 'accepting' : 'executing'} the task`,
    createSending: 'Sending task...',
    queued: (solver: string) => `Task queued. Assigned solver: ${solver}`,
    notCompleted: 'Solver did not return completion status yet. Please refresh order status manually.',
    completed: 'Task completed. Choose payment.'
  },
  labels: {
    solver: 'Solver:',
    task: 'Task:',
    budget: 'Budget:',
    executionEstimate: 'Execution estimate:',
    taskId: 'Task ID:',
    amount: 'Amount:',
    promoCode: 'Promo code',
    chooseMethod: 'Choose login method',
    paymentInvoice: 'Payment invoice link:',
    searchTasks: 'Search tasks',
    noTasks: 'No tasks found',
    noTasksDescription: 'Create at least one task or change search query.',
    openPaymentInvoice: 'Open payment invoice',
    openOrderLink: 'Open order',
    loadMoreHint: 'Scroll to load more tasks',
    executingNow: 'Your task is being executed',
    orderStatusUnavailable: 'Waiting for task status update...',
    timeLeft: 'Time left:',
    price: 'Price:',
    taskStatus: 'Task status',
    hoursUnit: 'hours',
    minutesUnit: 'min',
    subtasks: 'Work breakdown',
    selectedMethod: 'Selected method',
    remainingBalance: 'Remaining balance',
    promoApplied: 'Promo applied',
    resultTitle: 'Result',
    loadingTask: 'Loading task...',
    elapsed: 'Elapsed',
    selectedSolver: 'Solver',
    blurredWidget: 'Widget preview'
  },
  placeholders: {
    promoCode: 'WELCOME10',
    taskSearch: 'id, title, solver, status...',
    contactName: 'Your name',
    contactEmail: 'your@email.com',
    contactMessage: 'Tell us what you need help with...'
  },
  buttons: {
    apply: 'Apply',
    createNewTask: 'Create new task',
    openAllTasks: 'Open all tasks',
    createTask: 'Create task',
    stopTask: 'Stop task',
    socialLogin: 'Social login',
    passkeyLogin: 'Passkey login',
    actor: 'Actor',
    payWithPromo: 'Pay with promo code',
    anonymous: 'Anonymous',
    cancel: 'Cancel',
    delete: 'Delete',
    tryAgain: 'Try again',
    payNow: 'Pay now',
    depositNow: 'Deposit',
    confirmLinkedWallet: 'Confirm linked wallet',
    openResult: 'Open result',
    saveResult: 'Save result',
    enterPromo: 'Enter promo code',
    closeDialog: 'Close',
    sendMessage: 'Open email draft',
    backToMethods: 'Back to methods',
    viewExternalResult: 'Open external result'
  },
  notes: {
    waitingCompletion: 'Waiting for completion from /task/<orderId>',
    paymentInvoice: 'Payment invoice link:',
    noTasks: 'No tasks found',
    noTasksDescription: 'Create at least one task or change search query.'
  },
  auth: {
    connectPasskeyContinue: 'Connect and continue',
    continueAuthenticated: 'Continue with authenticated profile',
    signedIn: 'You are signed in. You can submit your task.',
    reown: 'Reown',
    passkey: 'Passkey',
    walletTitle: 'Wallet / Scial',
    walletDetail: 'Use MetaMask, WalletConnect, Email, or Google to claim the paying account.',
    passkeyTitle: 'Passkey',
    passkeyDetail: 'Use your platform account, or continue with email if no passkey profile exists.',
    anonymousTitle: '10 min test',
    anonymousDetail: 'Test now',
    walletAccount: 'Connected account',
    walletNetworkEthereum: 'Ethereum',
    walletNetworkGnosis: 'Gnosis',
    anonymousHint: 'Anonymous checkout enabled.'
  },
  executionFlow: {
    batching: {
      title: 'Batching orders',
      detail: 'Orders placed together are grouped to reduce execution costs.'
    },
    competition: {
      title: 'The competition has started',
      detail: 'Solvers are bidding and validating routes before execution.'
    },
    winnerSelected: {
      title: 'Best price found',
      detail: 'The winning solver is locking the route and preparing execution.'
    },
    bridging: {
      title: 'Bridging to destination',
      detail: 'Assets are moving to the destination chain and confirmations are in progress.'
    },
    'awaiting-auth': {
      title: 'Choose how to continue',
      detail: 'Select a login or continue anonymously before payment.'
    },
    'awaiting-payment': {
      title: 'Ready for payment',
      detail: 'Auth is confirmed. Finish payment or deposit to unlock the result.'
    }
  },
  subtasks: {
    prepareConfig: {
      id: 'prepare-config',
      title: 'Prepare configuration',
      detail: 'Normalize the request, gather context, and pin the execution scope.'
    },
    runChecks: {
      id: 'run-checks',
      title: 'Run validation checks',
      detail: 'Verify dependencies, dry runs, and safety constraints before handoff.'
    },
    syncArtifacts: {
      id: 'sync-artifacts',
      title: 'Sync artifacts',
      detail: 'Move the generated assets into the destination workspace.'
    },
    profileCode: {
      id: 'profile-code',
      title: 'Profile critical paths',
      detail: 'Measure the slowest sections before trying optimizations.'
    },
    benchmarkPaths: {
      id: 'benchmark-paths',
      title: 'Benchmark candidate paths',
      detail: 'Compare competing strategies and keep the best-performing variant.'
    },
    publishResult: {
      id: 'publish-result',
      title: 'Publish result',
      detail: 'Package the outcome and prepare the delivery surface.'
    }
  },
  payment: {
    summaryTitle: 'Payment summary',
    methodSelectTitle: 'Choose payment path',
    walletReadyTitle: 'Wallet payment ready',
    passkeyReadyTitle: 'Passkey payment ready',
    anonymousReadyTitle: 'Deposit required',
    promoHint: 'Promo can cover part of the price. Any remaining balance stays payable.',
    depositDialogTitle: 'Select deposit method',
    depositDialogDetail: 'Choose how to fund the order. Promo can be combined with another method.',
    depositPendingTitle: 'Deposit in progress',
    depositPendingDetail: 'Waiting for the funding confirmation before unlocking the result.',
    paidTitle: 'Payment confirmed',
    paidDetail: 'The order is paid. Preparing the result surface now.',
    linkedWalletHint: 'A wallet is linked to this passkey profile. Confirmation is still required.',
    payCtaHint: 'Use the selected account to complete payment now.'
  },
  result: {
    widgetTitle: 'Interactive result widget',
    widgetSummary: 'Open the embedded delivery widget for this completed order.',
    iframeTitle: 'Embedded delivery panel',
    iframeSummary: 'The result is available inside an embedded panel for quick review.',
    externalTitle: 'External result link',
    externalSummary: 'This order completes on an external resource.',
    anonymousSaveHint: 'Authenticate to save and revisit this result later.'
  },
  vpnFlow: {
    discoveryTitle: 'We determine the best VPN service',
    discoveryDetail: 'We compare providers, regions, and protocol constraints before committing to an option.',
    pricingTitle: 'We determine the price',
    pricingDetail: 'The selected solver estimates setup cost and the expected execution window.',
    deployingTitle: 'Server selected, starting service deployment',
    deployingDetail: 'Provisioning is in progress and the VPN service is being configured on the selected server.',
    readyTitle: 'Service is ready',
    readyDetail: 'The delivery widget is prepared from the solver result and stays blurred for now.',
    widgetTitle: 'VPN service widget',
    widgetSummary: 'The service result is prepared and will be connected to the crater payload later.'
  },
  errors: {
    orderRequired: 'Task text is required',
    loadGeneric: 'Could not create task',
    unknown: 'Unknown error',
    fallback: 'Could not create task',
    promoEmpty: 'Enter a promo code.',
    promoOk: 'Promo applied: 10% discount',
    promoWrong: 'Promo code not recognized',
    passkeyFailed: 'Passkey login failed',
    walletConfirmationRequired: 'Confirm the linked wallet before continuing.'
  },
  table: {
    headers: {
      task: 'Task',
      solver: 'Solver',
      status: 'Status',
      amount: 'Amount',
      created: 'Created',
      action: 'Action'
    }
  },
  contact: {
    title: 'Write to Lefine',
    description: 'Fill in the message and we will open your email client with a ready draft.',
    nameLabel: 'Name',
    emailLabel: 'Email',
    messageLabel: 'Message'
  }
} as const;

const KEFINE_TEXT_RU = {
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
    walletTitle: 'Wallet / Scial',
    walletDetail: 'Используйте MetaMask, WalletConnect, Email или Google, чтобы выбрать аккаунт плательщика.',
    passkeyTitle: 'Passkey',
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

export const KEFINE_LOCALE_TEXT = {
  en: KEFINE_TEXT_EN,
  ru: KEFINE_TEXT_RU
} as const;

export type KefineLocaleText = (typeof KEFINE_LOCALE_TEXT)[keyof typeof KEFINE_LOCALE_TEXT];

export function readLocaleFromStorage(): KefineLocale | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (savedLocale === 'ru' || savedLocale === 'en') {
    return savedLocale;
  }

  return undefined;
}

export const kefineLocale = writable<KefineLocale>(readLocaleFromStorage() ?? 'en');

export function setKefineLocale(locale: KefineLocale): void {
  kefineLocale.set(locale);
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable
  }
}

export function getLocaleText(locale: KefineLocale) {
  return KEFINE_LOCALE_TEXT[locale];
}
