import type { KefineLocale } from '$lib/constants/kefine-locale';

export type LegalPageId = 'privacy' | 'terms' | 'refund';

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalPageContent = {
  id: LegalPageId;
  path: '/privacy' | '/terms' | '/refund-policy';
  title: string;
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
};

const CONTACT_EMAIL = 'order@lefine.pro';
const UPDATED_AT = 'March 2026';

const EN_CONTENT: Record<LegalPageId, LegalPageContent> = {
  privacy: {
    id: 'privacy',
    path: '/privacy',
    title: 'Privacy Policy',
    updatedAt: UPDATED_AT,
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
          `To make a privacy-related request, contact us at ${CONTACT_EMAIL}.`
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
  terms: {
    id: 'terms',
    path: '/terms',
    title: 'Terms of Service',
    updatedAt: UPDATED_AT,
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
        title: '4. Refunds',
        paragraphs: [
          'Refund eligibility is described in our Refund Policy and may depend on applicable law, the stage of fulfillment, and whether digital access or delivery has already been provided.',
          'Where required, refunds will be handled through the relevant payment channel or provider.'
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
  refund: {
    id: 'refund',
    path: '/refund-policy',
    title: 'Refund Policy',
    updatedAt: UPDATED_AT,
    intro: [
      'This Refund Policy applies to payments made for Lefine digital services, including access, task execution, and digital delivery.',
      'Because the product may begin processing or delivering digital outputs shortly after payment, refund eligibility can depend on the fulfillment stage.'
    ],
    sections: [
      {
        title: '1. General Refund Standard',
        paragraphs: [
          'If applicable consumer protection law gives you a right to request a refund, we will honor that right.',
          'We may also review refund requests on a case-by-case basis when payment was made in error, duplicated, or the service could not be delivered as described.'
        ]
      },
      {
        title: '2. When Refunds May Be Limited',
        paragraphs: [
          'Refunds may be limited or unavailable once digital access has been granted, a task has already been materially processed, or result delivery has already occurred.',
          'If third-party payment providers or processors are involved, their operational requirements may affect the technical path for issuing a refund.'
        ]
      },
      {
        title: '3. How to Request a Refund',
        paragraphs: [
          `To request a refund, contact ${CONTACT_EMAIL} and include the order identifier, purchase details, and a short explanation of the issue.`,
          'We may request additional information needed to verify the payment and assess eligibility.'
        ]
      },
      {
        title: '4. Processing',
        paragraphs: [
          'If a refund is approved, it will be returned through the original payment method where possible or through another lawful and practical method.',
          'Processing times can vary depending on the payment rail, provider, and your financial institution.'
        ]
      },
      {
        title: '5. Policy Updates',
        paragraphs: [
          'We may update this Refund Policy from time to time. The version published on this page governs future purchases from its effective date.'
        ]
      }
    ]
  }
};

const RU_CONTENT: Record<LegalPageId, LegalPageContent> = {
  privacy: {
    id: 'privacy',
    path: '/privacy',
    title: 'Политика конфиденциальности',
    updatedAt: 'Март 2026',
    intro: [
      'Эта Политика конфиденциальности объясняет, как Lefine собирает, использует и защищает персональные данные, когда вы посещаете сайт, создаёте задачи для solver-сети, проходите авторизацию, совершаете оплату или используете связанные цифровые функции доставки результата.',
      'Политика применяется к продукту Lefine и связанным сервисам, работающим через сайт и crater-инфраструктуру.'
    ],
    sections: [
      {
        title: '1. Какие данные мы собираем',
        paragraphs: [
          'Мы можем собирать данные аккаунта и связи, включая email, username и переписку со службой поддержки.',
          'Мы можем собирать техническую информацию, такую как IP-адрес, тип браузера, сведения об устройстве, операционная система, метаданные сессии и журналы безопасности.',
          'Если вы используете passkey или авторизацию через кошелёк, мы можем обрабатывать идентификаторы и проверочные данные, необходимые для работы этих сценариев входа.'
        ]
      },
      {
        title: '2. Платежи и транзакционные данные',
        paragraphs: [
          'Мы можем обрабатывать ограниченный набор данных о заказе и транзакции, необходимых для создания задач, генерации платёжных ссылок, подтверждения доступа, предотвращения злоупотреблений и обработки обращений.',
          'Платёжные провайдеры или партнёры платёжной инфраструктуры могут обрабатывать биллинговые и платёжные данные на основании собственных условий и политик конфиденциальности.',
          'Мы не утверждаем, что все платёжные данные хранятся непосредственно в Lefine; часть информации может обрабатываться внешними процессорами или инфраструктурными провайдерами.'
        ]
      },
      {
        title: '3. Как мы используем персональные данные',
        paragraphs: [
          'Мы используем персональные данные для работы продукта, авторизации пользователей, выдачи цифровых результатов, обработки обращений в поддержку, повышения надёжности сервиса и выполнения юридических обязанностей.',
          'Мы также можем использовать технические данные для мониторинга безопасности, предотвращения мошенничества, диагностики сервиса и агрегированной продуктовой аналитики.'
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
          `Чтобы направить запрос по персональным данным, напишите нам на ${CONTACT_EMAIL}.`
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
  terms: {
    id: 'terms',
    path: '/terms',
    title: 'Условия использования',
    updatedAt: 'Март 2026',
    intro: [
      'Эти Условия использования регулируют доступ к Lefine и использование сервиса, включая создание задач, матчинг с solver-сетью, сценарии авторизации, оплату и цифровую выдачу результата.',
      'Используя сервис, вы соглашаетесь с этими Условиями.'
    ],
    sections: [
      {
        title: '1. Описание сервиса',
        paragraphs: [
          'Lefine — это цифровой продукт, который помогает пользователям создавать задачи, направлять их через solver-процессы, проходить этапы оплаты и доступа и получать цифровые результаты или артефакты доставки.',
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
        title: '4. Возвраты',
        paragraphs: [
          'Право на возврат описано в нашей Политике возвратов и может зависеть от применимого права, стадии исполнения и факта предоставления цифрового доступа или результата.',
          'Если это требуется, возврат будет обрабатываться через соответствующий платёжный канал или провайдера.'
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
  refund: {
    id: 'refund',
    path: '/refund-policy',
    title: 'Политика возвратов',
    updatedAt: 'Март 2026',
    intro: [
      'Эта Политика возвратов применяется к платежам за цифровые сервисы Lefine, включая доступ, исполнение задач и цифровую выдачу результата.',
      'Поскольку продукт может начать обработку или выдачу цифровых результатов вскоре после оплаты, право на возврат может зависеть от стадии исполнения.'
    ],
    sections: [
      {
        title: '1. Общий стандарт возврата',
        paragraphs: [
          'Если применимое законодательство о защите прав потребителей даёт вам право требовать возврат, мы будем соблюдать это право.',
          'Мы также можем рассматривать запросы на возврат в индивидуальном порядке, если платёж был ошибочным, дублированным или сервис не мог быть предоставлен в заявленном виде.'
        ]
      },
      {
        title: '2. Когда возврат может быть ограничен',
        paragraphs: [
          'Возврат может быть ограничен или недоступен после предоставления цифрового доступа, существенного начала обработки задачи или фактической выдачи результата.',
          'Если задействованы сторонние платёжные провайдеры или процессоры, их операционные требования могут влиять на технический путь возврата.'
        ]
      },
      {
        title: '3. Как запросить возврат',
        paragraphs: [
          `Чтобы запросить возврат, напишите на ${CONTACT_EMAIL} и укажите идентификатор заказа, данные о покупке и краткое описание проблемы.`,
          'Мы можем запросить дополнительную информацию, необходимую для проверки платежа и оценки права на возврат.'
        ]
      },
      {
        title: '4. Сроки обработки',
        paragraphs: [
          'Если возврат одобрен, средства будут возвращены на исходный способ оплаты, когда это возможно, либо иным законным и practically feasible способом.',
          'Срок обработки зависит от платёжного канала, провайдера и вашего финансового учреждения.'
        ]
      },
      {
        title: '5. Обновления политики',
        paragraphs: [
          'Мы можем время от времени обновлять эту Политику возвратов. Версия, опубликованная на этой странице, применяется к будущим покупкам с даты её вступления в силу.'
        ]
      }
    ]
  }
};

export function getLegalPageContent(locale: KefineLocale, pageId: LegalPageId): LegalPageContent {
  return (locale === 'ru' ? RU_CONTENT : EN_CONTENT)[pageId];
}
