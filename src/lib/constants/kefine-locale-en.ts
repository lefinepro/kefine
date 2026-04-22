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
      auto: 'Auto',
      light: 'Light',
      dark: 'Dark',
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
      company: 'Legal Information',
      related: 'Related legal pages',
      updated: 'Last updated',
      backToApp: 'Back to app'
    },
    githubUrl: 'https://github.com/lefinepro',
    contactEmail: 'order@lefine.pro',
    emailDialog: {
      title: 'Email Lefine',
      description: 'Choose how to contact us.',
      copy: 'Copy email',
      copied: 'Copied',
      openClient: 'Open mail client'
    },
    contactPage: {
      title: 'Contact us',
      description: 'Use email for support, orders, payments, or document-related questions.',
      openEmail: 'Open mail client',
      openGithub: 'Open GitHub',
      statusLabel: 'Status',
      statusValue: 'Available for support and orders',
      supportFeature: 'Order support',
      paymentFeature: 'Payments and invoices',
      docsFeature: 'Documents and legal requests',
      responseFeature: 'Async email response',
      privacyCard: 'Privacy and legal terms',
      mailClientHint: 'Open your default email client',
      contactsTitle: 'Contacts',
      servicesTitle: 'Services',
      emailFact: 'Email',
      phoneFact: 'Phone',
      countryFact: 'Country'
    }
  },
  create: {
    title: 'Describe a technical task',
    subtitle: 'Set the execution time. Lefine finds a solver, confirms the route and ETA, and delivers the result.',
    placeholder: 'Describe any technical task...',
    placeholderVariants: [
      'Fix a broken CI/CD rollback flow',
      'Set up monitoring and alerts for a production service',
      'Build a Telegram bot for support requests',
      'Optimize a slow PostgreSQL query path',
      'Implement OAuth login in a web app',
      'Deploy a private VPN for a remote team',
      'Migrate a monolith endpoint to a separate service',
      'Write a parser for API responses and export reports',
      'Create a landing page for a technical product',
      'Debug a mobile app crash after release'
    ],
    executeAria: 'Execute task',
    backgroundExecuteAria: 'Send task in background',
    addFile: '+ file',
    addDescription: '+ description',
    addExecutionEstimate: '+ ETA',
    fileCount: (count: number) => `${count} file${count === 1 ? '' : 's'}`,
    composerHints: 'Enter to send, Alt+Enter to queue, Shift+Enter for a new line',
    richEditorDescription: 'Ctrl+Enter opens a full ProseKit editor for longer technical briefs.',
    serviceSetupTitle: 'Configure the service before launch',
    serviceSetupSubtitle: 'Review the template variables, adjust the values, then start the service manually.',
    pinnedServicesTitle: 'Pinned services',
    pinnedServicesSubtitle: 'Start from configured service entry points before describing a custom task.',
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
    createSending: 'Forwarding document...',
    queued: (solver: string) => `Task queued. Assigned solver: ${solver}`,
    notCompleted: 'Solver did not return completion status yet. Please refresh order status manually.',
    completed: 'Task completed. Result is ready.',
    savingDocument: 'Saving...'
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
    summary: 'Task Summary',
    execution: 'Execution',
    relatedItems: 'Related items',
    window: 'Window',
    taskStatus: 'Task status',
    hoursUnit: 'hours',
    minutesUnit: 'min',
    subtasks: 'Work breakdown',
    exchangeWaiting: 'Exchange',
    performers: 'Performers',
    notebook: 'Notebook',
    iterations: 'Iterations',
    interimResult: 'Interim result',
    finalResult: 'Final result',
    leaveComment: 'Leave comment',
    noNotebookYet: 'The performer has not published notebook stages yet.',
    taskQueue: 'Task queue',
    taskTree: 'Task tree',
    taskFeed: 'Task feed',
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
    actor: 'Workspace',
    editTaskFeed: 'Edit task feed',
    payWithPromo: 'Pay with promo code',
    anonymous: 'Anonymous',
    cancel: 'Cancel',
    delete: 'Delete',
    tryAgain: 'Try again',
    payNow: 'Pay now',
    depositNow: 'Deposit',
    confirmLinkedWallet: 'Confirm linked wallet',
    openResult: 'Open result',
    confirmStep: 'Confirm step',
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
    continueAuthenticated: 'Continue with authenticated workspace',
    signedIn: 'You are signed in. You can submit your task.',
    reown: 'Reown',
    passkey: 'Passkey',
    walletTitle: 'Wallet / Social',
    browserWalletTitle: 'Browser wallet',
    walletConnectTitle: 'WalletConnect',
    tonConnectTitle: 'TON Connect',
    googleTitle: 'Google',
    githubTitle: 'GitHub',
    walletDetail: 'Use MetaMask, WalletConnect, Email, or Google to claim the paying account.',
    passkeyTitle: 'Passkey',
    privateKeyTitle: 'Private key',
    privateKeyDescription: 'Paste a compact pqsk key or full PEM private key text. Escaped \\n lines are accepted too. The browser derives the ML-DSA public key locally and sends only the public key string.',
    privateKeyGenerateLabel: 'Generate workspace',
    passkeyDetail: 'Use your platform account, or continue with email if no passkey workspace exists.',
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
    queued: {
      title: 'Sent to exchange',
      detail: 'The task is registered and waiting for performers.'
    },
    matching: {
      title: 'Waiting for performers',
      detail: 'The exchange is matching available performers for this task.'
    },
    assigned: {
      title: 'Performers found',
      detail: 'One or more performers accepted the task and are preparing execution.'
    },
    running: {
      title: 'Task in progress',
      detail: 'Execution is live. Follow notebook stages and performer updates below.'
    },
    review: {
      title: 'Reviewing result',
      detail: 'A performer has returned a result. Review notebook stages and confirm if needed.'
    },
    completed: {
      title: 'Execution completed',
      detail: 'The final notebook and result are ready.'
    },
    failed: {
      title: 'Execution failed',
      detail: 'The current run failed. Review the latest notebook stage for context.'
    },
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
      detail: ''
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
      title: 'Workspace critical paths',
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
    linkedWalletHint: 'A wallet is linked to this passkey workspace. Confirmation is still required.',
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
  afe: {
    title: '',
    labels: {
      input: 'Task',
      intake: 'in',
      route: 'route',
      result: 'result',
      delivery: 'Delivery'
    },
    cards: {
      afe: {
        title: 'What is Lefine?',
        detail: 'Lefine is an Automated Freelance Marketplace (AFM) where you describe the work you need and Lefine finds the right path to deliver the result.'
      },
      task: {
        title: 'Brief',
        detail: 'Describe the work and set the timing.'
      },
      quote: {
        title: 'Quote',
        detail: 'A solver confirms the route and ETA.'
      },
      delivery: {
        title: 'Delivery',
        detail: 'Lefine delivers the final access or result.'
      }
    }
  },
  errors: {
    backendUnavailableTitle: 'Crater not configured',
    backendUnavailableDetail: 'The backend health check failed. Start crater or fix the configured crater URL.',
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
  },
  profile: {
    title: 'Workspace',
    subtitle: 'Public workspace, social links, completed tasks, and referral settings.',
    onboardingTitle: 'Complete your workspace',
    onboardingSubtitle: 'After login, finish the workspace in two steps: name and social links.',
    onboardingStepLabel: 'Step',
    identityTitle: 'Identity',
    cardStepTitle: 'Card bonus',
    socialsStepTitle: 'Social links',
    firstName: 'First Name',
    surname: 'Surname',
    identityLeadTitle: 'Set the public identity for your workspace',
    identityLeadText:
      'Your first name and surname shape how your workspace appears in public links, completed tasks, and follow surfaces.',
    firstNameHint: 'Use your real or working first name. It is shown as the primary part of your public identity.',
    surnameHint: 'Add a surname to make the workspace look complete and trustworthy for other participants.',
    bioHint: 'Write a short introduction about your stack, focus, or what people should expect from your workspace.',
    continueToCard: 'Continue to social links',
    continueToSocials: 'Continue to social links',
    finishSetup: 'Finish setup',
    setupDone: 'Workspace setup complete',
    setupHint: 'Finish the steps once and the normal workspace view will stay available.',
    bonusTitle: 'Get a $100 bonus',
    bonusText: 'Verify a bank card tied to an Armenian bank. The bonus is added to your workspace balance after BIN validation.',
    username: 'Username',
    displayName: 'Display name',
    bio: 'Short info',
    publicToggle: 'Make workspace public',
    publicStatus: 'Public workspace',
    privateStatus: 'Private workspace',
    makePublic: 'Make workspace public',
    makePrivate: 'Make workspace private',
    publicHint: 'Your workspace is public now. People can discover it, follow it, and use it to attract tasks.',
    privateHint: 'Your workspace is private. Open the lock to make it public and attract tasks.',
    socialLinks: 'Social links',
    secretData: 'Secret data',
    sshPublicKey: 'SSH public key',
    sshPublicKeyHint: 'Paste the public SSH key that should be authorized for repository download and clone access.',
    privateKey: 'Private key',
    privateKeyHint: 'Your generated workspace private key will appear here.',
    copyPrivateKey: 'Copy private key',
    privateKeyCopied: 'Private key copied',
    socialLabel: 'Label',
    socialUrl: 'URL',
    addLink: 'Add link',
    save: 'Save workspace',
    signOut: 'Sign out',
    authDrawerSubtitle: 'Quick access to your workspace, profile link, and recent tasks.',
    shareProfile: 'Copy workspace link',
    openPublicProfile: 'Open public workspace',
    latestTasks: 'Latest tasks',
    closedTasks: 'Closed completed tasks',
    publicTask: 'Make task public',
    viewAccess: 'Paid view',
    watchAccess: 'Status follow',
    joinAccess: 'Join to execute',
    cardTitle: 'Bank card bonus',
    cardHint: 'Attach a card and verify its BIN against an Armenian bank to get a $100 bonus.',
    cardNumber: 'Card number or first 6-8 digits',
    verifyCard: 'Verify card',
    skipCard: 'Skip for now',
    socialOptionalHint: 'Social links are optional. You can finish without them.',
    socialBonusHint: 'Add at least one social link to unlock the $100 card bonus.',
    bonusBalance: 'Bonus balance',
    referralPercent: 'Referral percent',
    profileCopied: 'Workspace link copied',
    taskCopied: 'Task link copied',
    shareTask: 'Copy task link',
    hidden: 'This workspace is private.',
    follow: 'Follow',
    following: 'Following',
    followers: 'Followers',
    publicTasks: 'Public tasks',
    noPublicTasks: 'No public tasks yet',
    noRecentTasks: 'No recent tasks yet',
    noOwnerTasks: 'No completed tasks yet',
    openTask: 'Open task',
    buyView: 'Buy view',
    buyWatch: 'Follow status',
    buyJoin: 'Join task',
    ownerTask: 'Your task',
    accessGranted: 'Access granted',
    profileUnavailable: 'Workspace is unavailable',
    templates: 'Services',
    templatesSubtitle: 'Create reusable services and share them as standalone entry points.',
    noTemplates: 'No services yet',
    createTemplate: 'Create',
    templateTitle: 'Service title',
    templateDescription: 'Service note',
    templatePrompt: 'Service prompt',
    templateVariables: 'Prompt variables',
    templateVariableDefault: 'Default value',
    templateLocalizationHint: 'Auto copies for EN, RU, and HY are generated from the current editor locale.',
    templatePrefillTitle: 'Service request title',
    templatePrefillDescription: 'Service request',
    templatePricingMode: 'Price adjustment',
    templateFixedMode: 'USD',
    templatePercentMode: 'Percent',
    templatePrice: 'Adjustment amount',
    templatePercent: 'Service percent',
    templateFiles: 'Service files',
    templateAddFiles: 'Add service files',
    templatePublish: 'Publish service',
    templatePublished: 'Published',
    templateDraft: 'Draft',
    templatePrivate: 'Private',
    templatePublic: 'Public',
    templateVisibility: 'Visibility',
    templateCreateCtaTitle: 'Create your first service',
    templateCreateCtaDetail: 'Services stay hidden by default. Create one, configure price and bonus rules, then choose private or public visibility.',
    templateOpenEditor: 'Open service editor',
    templateBonusTitle: 'Service bonus',
    templateBonusToggle: 'Reward balance after using this service',
    templateBonusMode: 'Bonus mode',
    templateBonusValue: 'Bonus value',
    templateBonusFixed: 'Fixed USD bonus',
    templateBonusPercent: 'Percent bonus',
    templateBonusPreview: 'Balance reward',
    templateFreeHint: 'This service can effectively become free when the reward offsets the price.',
    templateCopyLink: 'Copy service link',
    templateOpen: 'Open service',
    templateDelete: 'Delete service',
    templateFeePreview: 'Author fee',
    templateNetPreview: 'Order remainder',
    templateLinkCopied: 'Service link copied',
    templateSlug: 'Service URL',
    templateSlugHint: 'Optional. Leave empty to keep a UUID-style link.'
  }
} as const;
