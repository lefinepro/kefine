import { KEFINE_TEXT_EN } from '$lib/constants/kefine-locale-en';

export const KEFINE_TEXT_HY = {
  ...KEFINE_TEXT_EN,
  meta: {
    locale: 'hy'
  },
  topbar: {
    ...KEFINE_TEXT_EN.topbar,
    topActions: 'Վերին գործողություններ',
    openActionsMenu: 'Բացել գործողությունների ընտրացանկը',
    closeActionsMenu: 'Փակել գործողությունների ընտրացանկը',
    quickActions: 'Արագ գործողություններ',
    language: 'Լեզու',
    languageAria: 'Բացել լեզուների ընտրացանկը',
    languageEnglish: 'Անգլերեն',
    languageRussian: 'Ռուսերեն',
    languageArmenian: 'Հայերեն',
    dockLabel: 'Կողային վահանակի կառավարում',
    socialLabel: 'Համայնքի հղումներ',
    legalLabel: 'Իրավական հղումներ',
    mailLabel: 'Գրել մեզ',
    githubLabel: 'Բացել GitHub-ը',
    signIn: 'Մուտք',
    signedIn: 'Մուտք գործած',
    theme: {
      auto: 'Ավտո',
      light: 'Բաց',
      dark: 'Մուգ',
      switchToDark: 'Անցնել մուգ թեմայի',
      switchToLight: 'Անցնել բաց թեմայի'
    },
    legalLinks: {
      ...KEFINE_TEXT_EN.topbar.legalLinks,
      privacy: 'Գաղտնիության քաղաքականություն',
      terms: 'Պայմաններ',
      company: 'Իրավական տվյալներ',
      related: 'Կապակցված իրավական էջեր',
      updated: 'Թարմացվել է',
      backToApp: 'Վերադառնալ հավելված'
    },
    contactPage: {
      title: 'Կապ մեզ հետ',
      description: 'Օգտագործեք email-ը support-ի, պատվերների, վճարումների և փաստաթղթերի հարցերով։',
      openEmail: 'Բացել փոստային հաճախորդը',
      openGithub: 'Բացել GitHub-ը',
      statusLabel: 'Կարգավիճակ',
      statusValue: 'Հասանելի է support-ի և պատվերների համար',
      supportFeature: 'Պատվերների support',
      paymentFeature: 'Վճարումներ և հաշիվներ',
      docsFeature: 'Փաստաթղթեր և իրավական հարցումներ',
      responseFeature: 'Պատասխան email-ով',
      privacyCard: 'Privacy և իրավական պայմաններ',
      mailClientHint: 'Բացել լռելյայն փոստային հաճախորդը',
      contactsTitle: 'Կոնտակտներ',
      servicesTitle: 'Ծառայություններ',
      emailFact: 'Էլ. փոստ',
      phoneFact: 'Հեռախոս',
      countryFact: 'Երկիր'
    }
  },
  create: {
    ...KEFINE_TEXT_EN.create,
    title: 'Նկարագրեք տեխնիկական առաջադրանք',
    subtitle: 'Նշեք կատարման ժամկետը։ Lefine-ը գտնում է solver, հաստատում ուղին ու ETA-ն, հետո հանձնում արդյունքը։',
    placeholder: 'Նկարագրեք VPN կամ DevOps առաջադրանքը...',
    placeholderVariants: [
      'Թիմի համար տեղակայել մասնավոր VPN',
      'Կարգավորել WireGuard endpoint պտտմամբ',
      'Ավտոմատացնել staging deploy pipeline-ը',
      'Ուղղել CI/CD rollback flow-ը'
    ],
    executeAria: 'Ուղարկել առաջադրանքը',
    backgroundExecuteAria: 'Ուղարկել առաջադրանքը ֆոնային ռեժիմով',
    addFile: '+ ֆայլ',
    addExecutionEstimate: '+ ժամկետ',
    fileCount: (count: number) => `${count} ֆայլ`,
    composerHints: 'Enter-ը ուղարկում է, Alt+Enter-ը ուղարկում է ֆոնում, Shift+Enter-ը նոր տող է ավելացնում',
    serviceSetupTitle: 'Կարգավորեք ծառայությունը մինչև մեկնարկը',
    serviceSetupSubtitle: 'Ստուգեք template-ի փոփոխականները, փոխեք արժեքները, եթե պետք է, և հետո միայն գործարկեք ծառայությունը։',
    pinnedServicesTitle: 'Ամրացված ծառայություններ',
    pinnedServicesSubtitle: 'Սկսեք կարգավորված service entry point-երից, ապա միայն գրեք ազատ ձևի առաջադրանք։',
    recentTasks: 'Վերջին առաջադրանքներ',
    noRecentTasks: 'Պահված առաջադրանքներ դեռ չկան',
    matchedTasks: 'Գտնված ավարտված առաջադրանքներ',
    noMatchedTasks: 'Այս հարցմանը համապատասխան ավարտված առաջադրանքներ դեռ չկան'
  },
  defaults: {
    ...KEFINE_TEXT_EN.defaults,
    unknownSolver: 'Անհայտ solver',
    taskTitle: 'Առաջադրանք',
    solverNetwork: 'Solver ցանց',
    openSolverMarket: 'Բացել Solver Market-ը',
    defaultCurrency: 'USD'
  },
  status: {
    ...KEFINE_TEXT_EN.status,
    createSending: 'Փաստաթուղթը փոխանցվում է...',
    notCompleted: 'Solver-ը դեռ ավարտման կարգավիճակ չի վերադարձրել։ Թարմացրեք ձեռքով։',
    completed: 'Առաջադրանքը ավարտված է։ Արդյունքը պատրաստ է։'
  },
  labels: {
    ...KEFINE_TEXT_EN.labels,
    solver: 'Solver:',
    task: 'Առաջադրանք:',
    budget: 'Բյուջե:',
    executionEstimate: 'Կատարման գնահատական:',
    taskId: 'Առաջադրանքի ID:',
    amount: 'Գումար:',
    chooseMethod: 'Ընտրեք շարունակելու եղանակը',
    paymentInvoice: 'Վճարման հղում:',
    searchTasks: 'Որոնել առաջադրանքներ',
    noTasks: 'Առաջադրանքներ չեն գտնվել',
    noTasksDescription: 'Ստեղծեք գոնե մեկ առաջադրանք կամ փոխեք հարցումը։',
    openPaymentInvoice: 'Բացել վճարման հղումը',
    openOrderLink: 'Բացել պատվերը',
    loadMoreHint: 'Պտտեք ներքև՝ ավելի շատ առաջադրանքներ բեռնելու համար',
    executingNow: 'Ձեր առաջադրանքը կատարվում է',
    orderStatusUnavailable: 'Սպասում ենք առաջադրանքի կարգավիճակի թարմացմանը...',
    timeLeft: 'Մնացած ժամանակը:',
    price: 'Գինը:',
    summary: 'Առաջադրանքի ամփոփում',
    execution: 'Կատարում',
    relatedItems: 'Կապակցված տարրեր',
    window: 'Ժամկետ',
    taskStatus: 'Առաջադրանքի կարգավիճակ',
    hoursUnit: 'ժ',
    minutesUnit: 'ր',
    subtasks: 'Ենթաառաջադրանքներ',
    selectedMethod: 'Ընտրված եղանակ',
    remainingBalance: 'Մնացած վճարը',
    promoApplied: 'Պրոմոկոդ',
    resultTitle: 'Արդյունք',
    loadingTask: 'Առաջադրանքը բեռնվում է...',
    elapsed: 'Անցել է',
    selectedSolver: 'Solver',
    blurredWidget: 'Widget նախադիտում'
  },
  buttons: {
    ...KEFINE_TEXT_EN.buttons,
    apply: 'Կիրառել',
    createNewTask: 'Ստեղծել նոր առաջադրանք',
    openAllTasks: 'Բացել բոլոր առաջադրանքները',
    createTask: 'Ստեղծել առաջադրանք',
    stopTask: 'Դադարեցնել առաջադրանքը',
    socialLogin: 'Սոցիալական մուտք',
    passkeyLogin: 'Passkey մուտք',
    anonymous: 'Անանուն',
    cancel: 'Չեղարկել',
    delete: 'Ջնջել',
    tryAgain: 'Փորձել նորից',
    payNow: 'Վճարել հիմա',
    depositNow: 'Լիցքավորել',
    confirmLinkedWallet: 'Հաստատել կապակցված դրամապանակը',
    openResult: 'Բացել արդյունքը',
    rejectResult: 'Մերժել արդյունքը',
    saveResult: 'Պահել արդյունքը',
    enterPromo: 'Մուտքագրել պրոմոկոդ',
    closeDialog: 'Փակել',
    sendMessage: 'Բացել email draft-ը',
    backToMethods: 'Վերադառնալ եղանակներին',
    viewExternalResult: 'Բացել արտաքին արդյունքը'
  },
  auth: {
    ...KEFINE_TEXT_EN.auth,
    connectPasskeyContinue: 'Կապել և շարունակել',
    continueAuthenticated: 'Շարունակել նույնականացված պրոֆիլով',
    signedIn: 'Դուք մուտք եք գործել։ Կարող եք ուղարկել առաջադրանքը։',
    privateKeyTitle: 'Private key',
    privateKeyDescription: 'Տեղադրեք compact pqsk key կամ ամբողջական PEM private key։ Escaped \\n տարբերակն էլ է ընդունվում։ Բրաուզերը local ձևով ստանում է ML-DSA public key-ը և ուղարկում միայն public key string-ը։',
    privateKeyGenerateLabel: 'Ստեղծել actor',
    walletTitle: 'Wallet / Social',
    walletDetail: 'Օգտագործեք MetaMask, WalletConnect, Email կամ Google՝ վճարող հաշիվը ընտրելու համար։',
    passkeyDetail: 'Օգտագործեք հարթակի հաշիվը կամ շարունակեք email-ով, եթե passkey պրոֆիլ դեռ չկա։',
    anonymousTitle: '10 րոպե թեստ',
    anonymousDetail: 'Փորձել հիմա',
    walletAccount: 'Կապակցված հաշիվ',
    anonymousHint: 'Անանուն վճարումը հասանելի է։'
  },
  payment: {
    ...KEFINE_TEXT_EN.payment,
    summaryTitle: 'Վճարման ամփոփում',
    methodSelectTitle: 'Ընտրեք վճարման ուղին',
    walletReadyTitle: 'Դրամապանակով վճարումը պատրաստ է',
    passkeyReadyTitle: 'Passkey վճարումը պատրաստ է',
    anonymousReadyTitle: 'Պահանջվում է դեպոզիտ',
    depositDialogTitle: 'Ընտրեք դեպոզիտի եղանակը',
    depositDialogDetail: 'Ընտրեք, թե ինչպես ֆինանսավորել պատվերը։ Պրոմոկոդը կարելի է համադրել այլ եղանակի հետ։',
    depositPendingTitle: 'Դեպոզիտը ընթացքի մեջ է',
    depositPendingDetail: 'Սպասում ենք հաստատմանը, հետո արդյունքը կբացվի։',
    paidTitle: 'Վճարումը հաստատված է',
    paidDetail: 'Պատվերը վճարված է։ Արդյունքը պատրաստվում է։'
  },
  result: {
    ...KEFINE_TEXT_EN.result,
    widgetTitle: 'Ինտերակտիվ արդյունքի widget',
    widgetSummary: 'Բացեք ներկառուցված արդյունքի widget-ը այս ավարտված պատվերի համար։',
    iframeTitle: 'Ներկառուցված արդյունքի վահանակ',
    iframeSummary: 'Արդյունքը հասանելի է ներկառուցված վահանակում արագ դիտման համար։',
    externalTitle: 'Արտաքին արդյունքի հղում',
    externalSummary: 'Այս պատվերի արդյունքը բացվում է արտաքին ռեսուրսում։',
    anonymousSaveHint: 'Նույնականացեք, որպեսզի պահպանեք արդյունքն ու հետագայում վերադառնաք դրան։'
  },
  afe: {
    ...KEFINE_TEXT_EN.afe,
    title: '',
    cards: {
      afe: {
        title: 'Ի՞նչ է Lefine-ը',
        detail:
          'Lefine-ը Automated Freelance Marketplace (AFM) է, որտեղ դուք նկարագրում եք անհրաժեշտ աշխատանքը, իսկ Lefine-ը գտնում է ճիշտ ուղին արդյունքը հասցնելու համար։'
      },
      task: {
        title: 'Բրիֆ',
        detail: 'Նկարագրեք աշխատանքը և նշեք ժամկետը։'
      },
      quote: {
        title: 'Գնառաջարկ',
        detail: 'Solver-ը հաստատում է ուղին և ETA-ն։'
      },
      delivery: {
        title: 'Առաքում',
        detail: 'Lefine-ը հասցնում է վերջնական հասանելիությունը կամ արդյունքը։'
      }
    }
  },
  errors: {
    ...KEFINE_TEXT_EN.errors,
    orderRequired: 'Առաջադրանքի տեքստը պարտադիր է',
    loadGeneric: 'Չհաջողվեց ստեղծել առաջադրանքը',
    fallback: 'Չհաջողվեց ստեղծել առաջադրանքը',
    promoEmpty: 'Մուտքագրեք պրոմոկոդ։',
    promoOk: 'Պրոմոկոդը կիրառվեց. 10% զեղչ',
    promoWrong: 'Պրոմոկոդը չի ճանաչվել',
    passkeyFailed: 'Passkey մուտքը ձախողվեց',
    walletConfirmationRequired: 'Շարունակելուց առաջ հաստատեք կապակցված դրամապանակը։'
  },
  contact: {
    ...KEFINE_TEXT_EN.contact,
    title: 'Գրել Lefine-ին',
    description: 'Լրացրեք հաղորդագրությունը, և մենք կբացենք պատրաստ email draft-ը։',
    nameLabel: 'Անուն',
    emailLabel: 'Email',
    messageLabel: 'Հաղորդագրություն'
  }
} as const;
