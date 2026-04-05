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
    }
  },
  create: {
    ...KEFINE_TEXT_EN.create,
    title: 'Նկարագրեք տեխնիկական առաջադրանք',
    subtitle: 'Սահմանեք բյուջեն։ Lefine-ը գտնում է solver, հաստատում գինն ու ETA-ն, հետո հանձնում արդյունքը։',
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
    addPrice: '+ գին',
    fileCount: (count: number) => `${count} ֆայլ`,
    composerHints: 'Enter-ը ուղարկում է, Alt+Enter-ը ուղարկում է ֆոնում, Shift+Enter-ը նոր տող է ավելացնում',
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
    createSending: 'Առաջադրանքը ուղարկվում է...',
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
    title: 'Ինչպես է աշխատում Lefine-ը',
    cards: {
      afe: {
        title: 'Ի՞նչ է Lefine-ը',
        detail:
          'Lefine-ը Automated Freelance Exchange (AFE) է։ Դուք պարզապես նկարագրում եք առաջադրանքը, իսկ մենք ընտրում ենք այն լուծումը, որը լավագույնս համապատասխանում է դրան։'
      },
      task: {
        title: '1. Նկարագրեք առաջադրանքը',
        detail: 'Նկարագրեք ձեզ անհրաժեշտ engineering արդյունքը և սահմանեք բյուջեի վերին շեմը։'
      },
      quote: {
        title: '2. Solver-ի quote',
        detail: 'Solver-ը ընդունում է առաջադրանքը և հաստատում երթուղին, գինը և ETA-ն այդ շրջանակում։'
      },
      delivery: {
        title: '3. Արդյունքի հանձնում',
        detail: 'Lefine-ը վարում է իրականացումը և բացում է վերջնական access package-ը կամ արդյունքը։'
      }
    }
  },
  vpnFlow: {
    ...KEFINE_TEXT_EN.vpnFlow,
    discoveryTitle: 'Որոշում ենք լավագույն VPN ծառայությունը',
    discoveryDetail: 'Համեմատում ենք մատակարարներին, տարածաշրջաններն ու պրոտոկոլային սահմանափակումները նախքան ընտրությունը։',
    pricingTitle: 'Որոշում ենք գինը',
    pricingDetail: 'Ընտրված solver-ը գնահատում է տեղակայման արժեքն ու կատարման պատուհանը։',
    deployingTitle: 'Սերվերը ընտրված է, սկսում ենք տեղակայումը',
    deployingDetail: 'Տեղակայումը ընթացքի մեջ է, և ընտրված սերվերի վրա կարգավորվում է VPN ծառայությունը։',
    readyTitle: 'Ծառայությունը պատրաստ է',
    readyDetail: 'Արդյունքի widget-ը պատրաստվել է solver-ի պատասխանից և այժմ մնում է թաքցված։',
    widgetTitle: 'VPN ծառայության widget',
    widgetSummary: 'Ծառայության արդյունքը պատրաստ է և կհասնի crater payload-ի միջոցով։'
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
