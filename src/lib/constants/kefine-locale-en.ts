export const KEFINE_TEXT_EN = {
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
    languageArmenian: 'Armenian',
    theme: {
      switchToDark: 'Switch to dark theme',
      switchToLight: 'Switch to light theme'
    },
    dockLabel: 'Sidebar controls',
    socialLabel: 'Community links',
    legalLabel: 'Legal links',
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
    legalLinks: {
      privacy: 'Privacy Policy',
      terms: 'Terms',
      refund: 'Refund',
      related: 'Related legal pages',
      updated: 'Last updated',
      backToApp: 'Back to app'
    },
    githubUrl: 'https://github.com/lefine',
    contactEmail: 'order@lefine.pro'
  },
  create: {
    title: 'Solve problems in hours, not months.',
    placeholder: 'Describe what should be solved...',
    placeholderVariants: ['Need access to Telegram', 'Deploy private VPN for the team', 'Deploy my production app', 'Optimize an algorithm'],
    executeAria: 'Execute task',
    backgroundExecuteAria: 'Send task in background',
    addFile: '+ file',
    addPrice: '+ price',
    fileCount: (count: number) => `${count} file${count === 1 ? '' : 's'}`,
    composerHints: 'Enter to send, Alt+Enter to queue, Shift+Enter for a new line',
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
    rejectResult: 'Reject result',
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
    walletTitle: 'Wallet / Social',
    walletDetail: 'Use MetaMask, WalletConnect, Email, or Google to claim the paying account.',
    passkeyTitle: 'Passkey',
    localhostTitle: 'Localhost',
    passkeyDetail: 'Use your platform account, or continue with email if no passkey profile exists.',
    anonymousTitle: '10 min test',
    anonymousDetail: 'Test now',
    walletAccount: 'Connected account',
    walletNetworkEthereum: 'Ethereum',
    walletNetworkGnosis: 'Gnosis',
    walletNetworkAvalanche: 'Avalanche',
    walletNetworkAvalancheFuji: 'Avalanche Testnet',
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
