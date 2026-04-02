import type { KefineLocale } from '$lib/constants/kefine-locale';
import type { LegalSection } from '$lib/constants/legal-content';

type CompanyPageContent = {
  title: string;
  intro: string[];
  sections: LegalSection[];
  legalDisclaimerFallback: string;
};

export const COMPANY_CONTENT: Record<KefineLocale, CompanyPageContent> = {
  en: {
    title: 'Legal Information',
    intro: [
      'This page publishes Lefine company details, contact channels, digital-product disclosures, and legal notices for customers and counterparties.',
      'Blank company fields are intentionally hidden so the page only shows values that are currently configured.'
    ],
    sections: [
      {
        title: '1. Company Details'
      },
      {
        title: '2. Contact Information',
        paragraphs: [
          'For order, support, payment, or document-related questions, contact us using the details shown on this page.',
          'If a specific request requires supporting documentation or additional verification, we may ask for further information.'
        ]
      },
      {
        title: '3. Product Information',
        paragraphs: [
          'Lefine provides a digital service for submitting technical tasks, routing them through solver workflows, completing authentication and payment steps, and delivering digital results.',
          'All product outputs are delivered digitally. No physical goods or paper documents are shipped unless explicitly stated otherwise.'
        ]
      },
      {
        title: '4. Payments and Consumer Information',
        paragraphs: [
          'Pricing, supported payment methods, settlement currency, and the technical payment path may vary depending on the task type, selected payment flow, and available infrastructure.',
          'Payments may be processed directly by Lefine or through external providers and infrastructure partners operating under their own legal terms.'
        ],
        bullets: [
          'Applicable pricing and payment terms are shown before payment confirmation.',
          'Digital fulfillment may begin shortly after payment is received.',
          'Refunds and consumer rights are governed by applicable law and the relevant payment channel terms.'
        ]
      },
      {
        title: '5. Accepted Payment Methods',
        paragraphs: [
          'Supported payment methods and networks are determined by the current product configuration and may change without separate advance notice.',
          'When technically available, the product shows only the payment options relevant to the current order flow.'
        ]
      },
      {
        title: '6. Legal Documents',
        paragraphs: [
          'Use of the service is also governed by the Privacy Policy and Terms of Service published on separate legal pages.',
          'If any statement on this page conflicts with mandatory applicable law, the mandatory legal rule prevails.'
        ]
      }
    ],
    legalDisclaimerFallback:
      'The information on this page is provided for general informational purposes and reflects the published company details and service disclosures available as of the update date.'
  },
  ru: {
    title: 'Реквизиты компании',
    intro: [
      'На этой странице опубликованы основные сведения о компании Lefine, каналы связи, информация о цифровом продукте и юридические уведомления для пользователей.',
      'Пустые поля в реквизитах намеренно не отображаются, чтобы страница показывала только заполненные и актуальные данные.'
    ],
    sections: [
      {
        title: '1. Сведения о компании'
      },
      {
        title: '2. Контактная информация',
        paragraphs: [
          'По вопросам заказов, поддержки, платежей и документов вы можете связаться с нами по указанным на этой странице контактам.',
          'Если для конкретного запроса нужен подтверждающий документ или дополнительная идентификация, мы можем запросить уточняющие данные.'
        ]
      },
      {
        title: '3. Информация о продукте',
        paragraphs: [
          'Lefine предоставляет цифровой сервис для постановки технических задач, их маршрутизации через solver-процессы, прохождения этапов авторизации и оплаты и последующей цифровой выдачи результата.',
          'Все результаты сервиса предоставляются в цифровой форме. Физическая доставка товаров или бумажных документов через продукт не осуществляется, если иное прямо не указано.'
        ]
      },
      {
        title: '4. Платежи и расчёты',
        paragraphs: [
          'Стоимость заказа, поддерживаемые способы оплаты, валюта расчёта и технический маршрут оплаты могут зависеть от типа задачи, выбранного сценария оплаты и доступной платёжной инфраструктуры.',
          'Платёж может обрабатываться непосредственно Lefine либо через внешних провайдеров и инфраструктурных партнёров, действующих по собственным юридическим условиям.'
        ],
        bullets: [
          'Цены и условия оплаты отображаются до подтверждения платежа.',
          'Цифровой продукт может начать исполняться вскоре после оплаты.',
          'Возвраты и потребительские права регулируются применимым законодательством и условиями конкретного платёжного канала.'
        ]
      },
      {
        title: '5. Принимаемые способы оплаты',
        paragraphs: [
          'Поддерживаемые способы оплаты и доступные платёжные сети определяются текущей конфигурацией продукта и могут изменяться без отдельного предварительного уведомления.',
          'Если технически доступно, пользователю показываются только те способы оплаты, которые актуальны для его сценария заказа.'
        ]
      },
      {
        title: '6. Юридические документы',
        paragraphs: [
          'Использование сервиса также регулируется Политикой конфиденциальности и Условиями использования, опубликованными на отдельных страницах legal-раздела.',
          'Если отдельное положение на этой странице конфликтует с обязательными нормами применимого права, применяется соответствующая обязательная норма.'
        ]
      }
    ],
    legalDisclaimerFallback:
      'Информация на этой странице предоставляется в информационных целях и отражает опубликованные реквизиты и общие сведения о цифровом сервисе Lefine на дату обновления.'
  },
  hy: {
    title: 'Իրավական տվյալներ',
    intro: [
      'Այս էջում հրապարակվում են Lefine-ի հիմնական ընկերական տվյալները, կապի միջոցները, թվային ծառայության մասին տեղեկությունները և օգտագործողների համար իրավական ծանուցումները։',
      'Չլրացված դաշտերը միտումնավոր չեն ցուցադրվում, որպեսզի էջում մնան միայն լրացված և արդիական տվյալները։'
    ],
    sections: [
      {
        title: '1. Ընկերության տվյալներ'
      },
      {
        title: '2. Կապի տվյալներ',
        paragraphs: [
          'Պատվերների, աջակցության, վճարումների և փաստաթղթերի հարցերով կարող եք կապվել մեզ հետ այս էջում նշված կոնտակտներով։',
          'Եթե որոշ դիմումների համար անհրաժեշտ է հաստատող փաստաթուղթ կամ լրացուցիչ նույնականացում, մենք կարող ենք հարցնել լրացուցիչ տեղեկություն։'
        ]
      },
      {
        title: '3. Ապրանքի մասին',
        paragraphs: [
          'Lefine-ը թվային ծառայություն է, որը թույլ է տալիս ստեղծել տեխնիկական առաջադրանքներ, ուղարկել դրանք solver հոսքերով, անցնել նույնականացման և վճարման փուլերը և ստանալ թվային արդյունք։',
          'Ծառայության բոլոր արդյունքները տրամադրվում են թվային ձևաչափով։ Ֆիզիկական ապրանքների կամ թղթային փաստաթղթերի առաքում չի իրականացվում, եթե դա հատուկ նշված չէ։'
        ]
      },
      {
        title: '4. Վճարումներ և հաշվարկներ',
        paragraphs: [
          'Պատվերի արժեքը, աջակցվող վճարման եղանակները, հաշվարկի արժույթը և վճարման տեխնիկական ուղին կարող են կախված լինել առաջադրանքի տեսակից, ընտրված սցենարից և առկա վճարային ենթակառուցվածքից։',
          'Վճարումը կարող է մշակվել Lefine-ի կողմից կամ արտաքին մատակարարների և վճարային գործընկերների միջոցով, որոնք գործում են իրենց սեփական իրավական պայմաններով։'
        ],
        bullets: [
          'Գինը և վճարման պայմանները ցուցադրվում են մինչև վճարման հաստատումը։',
          'Թվային ծառայության կատարումը կարող է սկսվել վճարումից անմիջապես հետո։',
          'Վերադարձները և սպառողական իրավունքները կարգավորվում են կիրառելի օրենքներով և համապատասխան վճարային ալիքի պայմաններով։'
        ]
      },
      {
        title: '5. Ընդունվող վճարային եղանակներ',
        paragraphs: [
          'Աջակցվող վճարային եղանակներն ու ցանցերը որոշվում են արտադրանքի ընթացիկ կարգավորումներով և կարող են փոփոխվել առանց առանձին նախնական ծանուցման։',
          'Եթե տեխնիկապես հասանելի է, օգտատիրոջը ցուցադրվում են միայն այն վճարման եղանակները, որոնք վերաբերում են իր պատվերի սցենարին։'
        ]
      },
      {
        title: '6. Իրավական փաստաթղթեր',
        paragraphs: [
          'Ծառայության օգտագործումը կարգավորվում է նաև առանձին legal էջերում հրապարակված Գաղտնիության քաղաքականությամբ և Օգտագործման պայմաններով։',
          'Եթե այս էջի որևէ դրույթ հակասում է կիրառելի իրավունքի պարտադիր պահանջներին, կիրառվում է համապատասխան պարտադիր նորմը։'
        ]
      }
    ],
    legalDisclaimerFallback:
      'Այս էջի տեղեկատվությունը տրամադրվում է տեղեկատվական նպատակներով և արտացոլում է Lefine թվային ծառայության հրապարակված տվյալներն ու ընդհանուր նկարագրությունը թարմացման ամսաթվի դրությամբ։'
  }
};
