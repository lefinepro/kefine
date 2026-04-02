import type { KefineLocale } from '$lib/constants/kefine-locale';
import type { LegalPageContent } from '$lib/constants/legal-content';

export const PRIVACY_CONTENT: Record<KefineLocale, Omit<LegalPageContent, 'updatedAt'>> = {
  en: {
    id: 'privacy',
    path: '/privacy',
    title: 'Privacy Policy',
    intro: [
      'This Privacy Policy explains how Lefine collects, uses, and protects personal data when you visit the website, create solver tasks, authenticate, make payments, or use related digital delivery features.',
      'This policy applies to the Lefine product and related services delivered through the website and crater-backed infrastructure.'
    ],
    sections: [
      {
        title: '1. Information We Collect',
        paragraphs: [
          'We may collect account and contact data such as email address, username, and support correspondence.',
          'We may collect technical information such as IP address, browser type, device information, operating system, session metadata, and security logs.',
          'If you use passkeys or wallet-based authentication, we may process the identifiers and verification data necessary to operate those authentication flows.'
        ]
      },
      {
        title: '2. Payment and Transaction Data',
        paragraphs: [
          'We may process limited order and transaction data required to create tasks, generate payment links, confirm access, prevent abuse, and support customer requests.',
          'Payment providers or payment infrastructure partners may process billing and payment details under their own legal terms and privacy practices.',
          'We do not represent that all payment data is stored directly by Lefine; some information may be handled by external processors or infrastructure providers.'
        ]
      },
      {
        title: '3. How We Use Personal Data',
        paragraphs: [
          'We use personal data to operate the product, authenticate users, deliver digital results, process support requests, improve reliability, and comply with legal obligations.',
          'We may also use technical data for security monitoring, fraud prevention, service diagnostics, and aggregate product analytics.'
        ]
      },
      {
        title: '4. Data Sharing',
        paragraphs: [
          'We may share limited personal data with infrastructure, hosting, payment, communications, and security providers when this is necessary to operate the service.',
          'We do not sell personal data to third parties.'
        ]
      },
      {
        title: '5. Data Retention',
        paragraphs: [
          'We retain personal data only for as long as reasonably necessary to operate the service, maintain account access, resolve disputes, protect the platform, and satisfy legal, accounting, or compliance requirements.',
          'Authentication records, order metadata, and support communications may be retained for operational continuity and security review.'
        ]
      },
      {
        title: '6. Your Rights',
        paragraphs: [
          'Depending on applicable law, you may have rights to request access, correction, deletion, restriction, or objection regarding your personal data.',
          'To make a privacy-related request, contact us using the email address listed on the Legal Information page.'
        ]
      },
      {
        title: '7. Changes to This Policy',
        paragraphs: [
          'We may update this Privacy Policy from time to time. Material changes will be reflected on this page with an updated effective date.'
        ]
      }
    ]
  },
  ru: {
    id: 'privacy',
    path: '/privacy',
    title: 'Политика конфиденциальности',
    intro: [
      'Эта Политика конфиденциальности объясняет, как Lefine собирает, использует и защищает персональные данные, когда вы посещаете сайт, создаёте задачи, проходите авторизацию, совершаете оплату или используете цифровую выдачу результата.',
      'Политика применяется к продукту Lefine и связанным сервисам, работающим через сайт и crater-инфраструктуру.'
    ],
    sections: [
      {
        title: '1. Какие данные мы собираем',
        paragraphs: [
          'Мы можем собирать данные аккаунта и связи, включая email, имя пользователя и переписку со службой поддержки.',
          'Мы можем собирать техническую информацию, такую как IP-адрес, тип браузера, сведения об устройстве, операционная система, метаданные сессии и журналы безопасности.',
          'Если вы используете passkey или авторизацию через кошелёк, мы можем обрабатывать идентификаторы и проверочные данные, необходимые для работы этих сценариев входа.'
        ]
      },
      {
        title: '2. Платёжные и транзакционные данные',
        paragraphs: [
          'Мы можем обрабатывать ограниченный набор данных о заказе и транзакции, необходимых для создания задач, генерации платёжных ссылок, подтверждения доступа, предотвращения злоупотреблений и обработки обращений.',
          'Платёжные провайдеры или партнёры платёжной инфраструктуры могут обрабатывать биллинговые и платёжные данные на основании собственных условий и политик конфиденциальности.',
          'Не все платёжные данные обязательно хранятся непосредственно в Lefine; часть информации может обрабатываться внешними процессорами или инфраструктурными провайдерами.'
        ]
      },
      {
        title: '3. Как мы используем персональные данные',
        paragraphs: [
          'Мы используем персональные данные для работы продукта, авторизации пользователей, выдачи цифровых результатов, обработки обращений в поддержку, повышения надёжности сервиса и выполнения юридических обязанностей.',
          'Технические данные также могут использоваться для мониторинга безопасности, предотвращения мошенничества, диагностики сервиса и агрегированной аналитики.'
        ]
      },
      {
        title: '4. Передача данных',
        paragraphs: [
          'Мы можем передавать ограниченные персональные данные провайдерам инфраструктуры, хостинга, платежей, коммуникаций и безопасности, если это необходимо для работы сервиса.',
          'Мы не продаём персональные данные третьим лицам.'
        ]
      },
      {
        title: '5. Срок хранения данных',
        paragraphs: [
          'Мы храним персональные данные только столько, сколько разумно необходимо для работы сервиса, поддержки доступа к аккаунту, разрешения споров, защиты платформы и выполнения юридических, бухгалтерских или комплаенс-обязанностей.',
          'Аутентификационные записи, метаданные заказов и обращения в поддержку могут храниться для операционной устойчивости и проверки безопасности.'
        ]
      },
      {
        title: '6. Ваши права',
        paragraphs: [
          'В зависимости от применимого права у вас могут быть права на доступ, исправление, удаление, ограничение обработки или возражение в отношении ваших персональных данных.',
          'Чтобы направить privacy-запрос, используйте email, указанный на странице реквизитов компании.'
        ]
      },
      {
        title: '7. Изменения политики',
        paragraphs: [
          'Мы можем время от времени обновлять эту Политику конфиденциальности. Существенные изменения будут отражены на этой странице с новой датой вступления в силу.'
        ]
      }
    ]
  },
  hy: {
    id: 'privacy',
    path: '/privacy',
    title: 'Գաղտնիության քաղաքականություն',
    intro: [
      'Այս Գաղտնիության քաղաքականությունը բացատրում է, թե ինչպես է Lefine-ը հավաքում, օգտագործում և պաշտպանում անձնական տվյալները, երբ դուք այցելում եք կայքը, ստեղծում եք առաջադրանքներ, անցնում եք նույնականացում, կատարում եք վճարումներ կամ ստանում եք թվային արդյունքներ։',
      'Քաղաքականությունը վերաբերում է Lefine արտադրանքին և կայքի ու crater ենթակառուցվածքի միջոցով մատուցվող ծառայություններին։'
    ],
    sections: [
      {
        title: '1. Ինչ տվյալներ ենք հավաքում',
        paragraphs: [
          'Մենք կարող ենք հավաքել հաշվի և կապի տվյալներ, օրինակ` էլ. փոստ, օգտանուն և աջակցության նամակագրություն։',
          'Մենք կարող ենք հավաքել տեխնիկական տեղեկություն, օրինակ` IP հասցե, դիտարկչի տեսակ, սարքի տվյալներ, օպերացիոն համակարգ, սեսիայի մետատվյալներ և անվտանգության լոգեր։',
          'Եթե օգտագործում եք passkey կամ wallet-ով մուտք, մենք կարող ենք մշակել նույնականացման համար անհրաժեշտ տեխնիկական նույնացուցիչներ և հաստատման տվյալներ։'
        ]
      },
      {
        title: '2. Վճարային և գործարքային տվյալներ',
        paragraphs: [
          'Մենք կարող ենք մշակել պատվերի և գործարքի սահմանափակ տվյալներ, որոնք անհրաժեշտ են առաջադրանք ստեղծելու, վճարման հղումներ գեներացնելու, հասանելիությունը հաստատելու, չարաշահումը կանխելու և աջակցություն ցուցաբերելու համար։',
          'Վճարային մատակարարները կամ ենթակառուցվածքային գործընկերները կարող են մշակել վճարային տվյալները իրենց սեփական իրավական պայմաններով և գաղտնիության կանոններով։',
          'Բոլոր վճարային տվյալները պարտադիր չէ, որ պահվեն անմիջապես Lefine-ում. դրանց մի մասը կարող է մշակվել արտաքին մատակարարների կողմից։'
        ]
      },
      {
        title: '3. Ինչպես ենք օգտագործում անձնական տվյալները',
        paragraphs: [
          'Մենք օգտագործում ենք անձնական տվյալները արտադրանքը գործարկելու, օգտատերերին նույնականացնելու, թվային արդյունքներ տրամադրելու, աջակցության հարցումները մշակելու, հուսալիությունը բարելավելու և իրավական պարտավորությունները կատարելու համար։',
          'Տեխնիկական տվյալները կարող են օգտագործվել նաև անվտանգության մոնիթորինգի, խարդախության կանխման, ծառայության ախտորոշման և համախառն վերլուծության համար։'
        ]
      },
      {
        title: '4. Տվյալների փոխանցում',
        paragraphs: [
          'Մենք կարող ենք սահմանափակ անձնական տվյալներ փոխանցել հոսթինգի, ենթակառուցվածքի, վճարումների, հաղորդակցության և անվտանգության մատակարարներին, եթե դա անհրաժեշտ է ծառայությունը գործարկելու համար։',
          'Մենք անձնական տվյալներ չենք վաճառում երրորդ կողմերին։'
        ]
      },
      {
        title: '5. Տվյալների պահպանման ժամկետ',
        paragraphs: [
          'Մենք անձնական տվյալները պահում ենք միայն այնքան, որքան ողջամտորեն անհրաժեշտ է ծառայությունը գործարկելու, հաշվի հասանելիությունը պահպանելու, վեճերը լուծելու, հարթակը պաշտպանելու և իրավական կամ հաշվապահական պարտավորությունները կատարելու համար։',
          'Նույնականացման գրառումները, պատվերի մետատվյալները և աջակցության նամակագրությունը կարող են պահպանվել օպերացիոն կայունության և անվտանգության ստուգման համար։'
        ]
      },
      {
        title: '6. Ձեր իրավունքները',
        paragraphs: [
          'Կիրառելի օրենքից կախված` դուք կարող եք ունենալ ձեր անձնական տվյալների հասանելիության, ուղղման, ջնջման, սահմանափակման կամ առարկելու իրավունքներ։',
          'Գաղտնիության հետ կապված հարցման համար օգտագործեք Legal Information էջում նշված էլ. փոստը։'
        ]
      },
      {
        title: '7. Քաղաքականության փոփոխություններ',
        paragraphs: [
          'Մենք կարող ենք ժամանակ առ ժամանակ թարմացնել այս Գաղտնիության քաղաքականությունը։ Էական փոփոխությունները կարտացոլվեն այս էջում նոր թարմացման ամսաթվով։'
        ]
      }
    ]
  }
};

export const TERMS_CONTENT: Record<KefineLocale, Omit<LegalPageContent, 'updatedAt'>> = {
  en: {
    id: 'terms',
    path: '/terms',
    title: 'Terms of Service',
    intro: [
      'These Terms of Service govern your access to and use of Lefine, including task creation, solver matching, authentication flows, payment flows, and digital result delivery.',
      'By using the service, you agree to these Terms.'
    ],
    sections: [
      {
        title: '1. Description of the Service',
        paragraphs: [
          'Lefine is a digital product that helps users submit tasks, route them through solver workflows, manage payment and access steps, and receive digital results or delivery artifacts.',
          'All product outputs are delivered digitally. No physical goods are provided through the service.'
        ]
      },
      {
        title: '2. Accounts and Access',
        paragraphs: [
          'Some features may require a wallet connection, passkey, email-based communication, or another supported authentication method.',
          'You are responsible for maintaining control over the devices, credentials, or accounts you use to access the service.'
        ]
      },
      {
        title: '3. Orders, Pricing, and Billing',
        paragraphs: [
          'Task pricing, execution windows, and payment requirements may vary based on solver availability, task complexity, and delivery conditions.',
          'We may use payment providers or payment infrastructure partners to process transactions, generate payment links, or verify settlement.',
          'You are responsible for reviewing the applicable price and payment requirements before completing a transaction.'
        ]
      },
      {
        title: '4. Digital Delivery and Fulfillment',
        paragraphs: [
          'Digital access, task execution, and result delivery may begin shortly after payment or other required confirmation steps are completed.',
          'Because the product is digital in nature, fulfillment state may affect refund eligibility or cancellation rights where permitted by applicable law.'
        ]
      },
      {
        title: '5. User Conduct',
        paragraphs: [
          'You may not misuse the service, interfere with its operation, attempt unauthorized access, submit unlawful content, or use the platform in violation of applicable law.',
          'We may suspend, restrict, or terminate access if we reasonably believe the service is being abused or used in a harmful way.'
        ]
      },
      {
        title: '6. No Guarantees',
        paragraphs: [
          'The service is provided on an as available basis. We do not guarantee uninterrupted availability, specific solver outcomes, or specific economic results.',
          'Execution estimates, rankings, or solver selections shown in the product may change as the task progresses.'
        ]
      },
      {
        title: '7. Limitation of Liability',
        paragraphs: [
          'To the maximum extent permitted by law, Lefine is not liable for indirect, incidental, special, consequential, or punitive damages arising from the use of the service.',
          'Nothing in these Terms excludes liability that cannot be excluded under applicable law.'
        ]
      },
      {
        title: '8. Intellectual Property',
        paragraphs: [
          'The website, interface, product content, and related materials remain the property of Lefine or its licensors unless otherwise stated.',
          'You may not reproduce, redistribute, reverse engineer, or republish protected materials except as expressly permitted by law or written permission.'
        ]
      },
      {
        title: '9. Changes to These Terms',
        paragraphs: [
          'We may update these Terms from time to time. Continued use of the service after updated Terms become effective constitutes acceptance of the revised Terms.'
        ]
      }
    ]
  },
  ru: {
    id: 'terms',
    path: '/terms',
    title: 'Условия использования',
    intro: [
      'Эти Условия использования регулируют доступ к Lefine и использование сервиса, включая создание задач, матчинг с solver-сетью, сценарии авторизации, оплату и цифровую выдачу результата.',
      'Используя сервис, вы соглашаетесь с этими Условиями.'
    ],
    sections: [
      {
        title: '1. Описание сервиса',
        paragraphs: [
          'Lefine — это цифровой продукт, который помогает пользователям создавать задачи, направлять их через solver-процессы, проходить этапы оплаты и доступа и получать цифровые результаты.',
          'Все результаты сервиса предоставляются в цифровой форме. Физические товары через сервис не поставляются.'
        ]
      },
      {
        title: '2. Аккаунты и доступ',
        paragraphs: [
          'Для некоторых функций может потребоваться подключение кошелька, passkey, коммуникация по email или другой поддерживаемый способ авторизации.',
          'Вы несёте ответственность за контроль над устройствами, учётными данными и аккаунтами, которые используете для доступа к сервису.'
        ]
      },
      {
        title: '3. Заказы, цены и биллинг',
        paragraphs: [
          'Стоимость задач, сроки исполнения и требования к оплате могут различаться в зависимости от доступности solver-ов, сложности задачи и условий выдачи.',
          'Мы можем использовать платёжных провайдеров или партнёров платёжной инфраструктуры для проведения транзакций, генерации платёжных ссылок или подтверждения расчётов.',
          'Перед завершением оплаты вы обязаны самостоятельно проверить применимую цену и платёжные условия.'
        ]
      },
      {
        title: '4. Цифровая выдача и исполнение',
        paragraphs: [
          'Цифровой доступ, исполнение задачи и выдача результата могут начаться вскоре после оплаты или иных обязательных подтверждений.',
          'Поскольку продукт носит цифровой характер, стадия исполнения может влиять на право отмены или возврата там, где это допускается применимым правом.'
        ]
      },
      {
        title: '5. Поведение пользователя',
        paragraphs: [
          'Нельзя злоупотреблять сервисом, вмешиваться в его работу, пытаться получить несанкционированный доступ, публиковать незаконный контент или использовать платформу с нарушением применимого права.',
          'Мы можем приостановить, ограничить или прекратить доступ, если разумно полагаем, что сервис используется вредоносно или недобросовестно.'
        ]
      },
      {
        title: '6. Отсутствие гарантий',
        paragraphs: [
          'Сервис предоставляется по модели as available. Мы не гарантируем непрерывную доступность, конкретный результат solver-а или конкретный экономический эффект.',
          'Оценки времени исполнения, ранжирование или выбор solver-а, отображаемые в продукте, могут меняться по мере движения задачи.'
        ]
      },
      {
        title: '7. Ограничение ответственности',
        paragraphs: [
          'В максимально допустимой законом степени Lefine не несёт ответственности за косвенные, случайные, специальные, последующие или штрафные убытки, возникающие из использования сервиса.',
          'Ничто в этих Условиях не исключает ответственность, которую нельзя исключить по применимому праву.'
        ]
      },
      {
        title: '8. Интеллектуальная собственность',
        paragraphs: [
          'Сайт, интерфейс, продуктовый контент и связанные материалы остаются собственностью Lefine или его лицензиаров, если явно не указано иное.',
          'Вы не вправе воспроизводить, распространять, реверс-инжинирить или публиковать защищённые материалы, кроме случаев, прямо разрешённых законом или письменным разрешением.'
        ]
      },
      {
        title: '9. Изменения условий',
        paragraphs: [
          'Мы можем периодически обновлять эти Условия. Продолжение использования сервиса после вступления обновлённых Условий в силу означает принятие новой редакции.'
        ]
      }
    ]
  },
  hy: {
    id: 'terms',
    path: '/terms',
    title: 'Օգտագործման պայմաններ',
    intro: [
      'Այս Օգտագործման պայմանները կարգավորում են Lefine-ի հասանելիությունն ու օգտագործումը, ներառյալ առաջադրանքների ստեղծումը, solver-ների ընտրությունը, նույնականացման և վճարման փուլերը և թվային արդյունքի տրամադրումը։',
      'Օգտագործելով ծառայությունը` դուք համաձայնում եք այս Պայմաններին։'
    ],
    sections: [
      {
        title: '1. Ծառայության նկարագրություն',
        paragraphs: [
          'Lefine-ը թվային արտադրանք է, որը օգնում է օգտատերերին ստեղծել առաջադրանքներ, ուղարկել դրանք solver հոսքերով, անցնել վճարման և հասանելիության փուլերը և ստանալ թվային արդյունքներ։',
          'Ծառայության բոլոր արդյունքները տրամադրվում են թվային ձևաչափով։ Ֆիզիկական ապրանքներ չեն տրամադրվում։'
        ]
      },
      {
        title: '2. Հաշիվներ և հասանելիություն',
        paragraphs: [
          'Որոշ գործառույթների համար կարող է պահանջվել wallet-ի կապում, passkey, email-ով կապ կամ այլ աջակցվող նույնականացման եղանակ։',
          'Դուք պատասխանատու եք այն սարքերի, հավատարմագրերի և հաշիվների վերահսկման համար, որոնցով մուտք եք գործում ծառայություն։'
        ]
      },
      {
        title: '3. Պատվերներ, գներ և հաշվարկներ',
        paragraphs: [
          'Առաջադրանքների գինը, կատարման ժամկետները և վճարման պահանջները կարող են տարբեր լինել solver-ների հասանելիությունից, բարդությունից և առաքման պայմաններից կախված։',
          'Մենք կարող ենք օգտագործել վճարային մատակարարներ կամ ենթակառուցվածքային գործընկերներ գործարքները մշակելու, վճարման հղումներ ստեղծելու կամ հաշվարկը հաստատելու համար։',
          'Վճարումից առաջ դուք պարտավոր եք ստուգել կիրառելի գինը և վճարման պայմանները։'
        ]
      },
      {
        title: '4. Թվային առաքում և կատարում',
        paragraphs: [
          'Թվային հասանելիությունը, առաջադրանքի կատարումը և արդյունքի տրամադրումը կարող են սկսվել վճարումից կամ այլ պարտադիր հաստատումից անմիջապես հետո։',
          'Քանի որ ծառայությունը թվային բնույթ ունի, կատարման փուլը կարող է ազդել վերադարձի կամ չեղարկման իրավունքների վրա, եթե դա թույլատրվում է կիրառելի օրենքով։'
        ]
      },
      {
        title: '5. Օգտատիրոջ վարքագիծ',
        paragraphs: [
          'Արգելվում է չարաշահել ծառայությունը, խոչընդոտել դրա աշխատանքին, փորձել չարտոնված հասանելիություն ստանալ, հրապարակել անօրինական բովանդակություն կամ օգտագործել հարթակը կիրառելի օրենքի խախտմամբ։',
          'Եթե ողջամտորեն կարծում ենք, որ ծառայությունը օգտագործվում է վնասակար կամ չարաշահող ձևով, կարող ենք կասեցնել, սահմանափակել կամ դադարեցնել հասանելիությունը։'
        ]
      },
      {
        title: '6. Առանց երաշխիքների',
        paragraphs: [
          'Ծառայությունը տրամադրվում է as available սկզբունքով։ Մենք չենք երաշխավորում անխափան հասանելիություն, solver-ի կոնկրետ արդյունք կամ կոնկրետ տնտեսական արդյունք։',
          'Արտադրանքում ցուցադրվող կատարման գնահատականները, վարկանիշները կամ solver-ի ընտրությունը կարող են փոխվել առաջադրանքի ընթացքի ընթացքում։'
        ]
      },
      {
        title: '7. Պատասխանատվության սահմանափակում',
        paragraphs: [
          'Օրենքով թույլատրելի առավելագույն սահմաններում Lefine-ը պատասխանատվություն չի կրում անուղղակի, պատահական, հատուկ, հետևանքային կամ տուգանային վնասների համար, որոնք առաջացել են ծառայության օգտագործումից։',
          'Այս Պայմաններում ոչինչ չի բացառում այն պատասխանատվությունը, որը չի կարող բացառվել կիրառելի օրենքով։'
        ]
      },
      {
        title: '8. Մտավոր սեփականություն',
        paragraphs: [
          'Կայքը, ինտերֆեյսը, արտադրանքի բովանդակությունը և հարակից նյութերը մնում են Lefine-ի կամ նրա լիցենզավորողների սեփականությունը, եթե այլ բան հստակ նշված չէ։',
          'Դուք չեք կարող վերարտադրել, վերաբաշխել, reverse engineer անել կամ վերահրապարակել պաշտպանված նյութերը, եթե դա հստակ չի թույլատրվում օրենքով կամ գրավոր թույլտվությամբ։'
        ]
      },
      {
        title: '9. Պայմանների փոփոխություններ',
        paragraphs: [
          'Մենք կարող ենք ժամանակ առ ժամանակ թարմացնել այս Պայմանները։ Թարմացված Պայմանների ուժի մեջ մտնելուց հետո ծառայության շարունակական օգտագործումը նշանակում է նոր տարբերակի ընդունում։'
        ]
      }
    ]
  }
};
