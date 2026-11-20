import { Lock, Shield } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useLang } from '@/lib/LanguageContext';

const PRIVACY_CONTENT = {
  uz: [
    {
      title: '1. Qanday ma’lumotlarni yig‘amiz?',
      body: 'Ro‘yxatdan o‘tish va profilingizni to‘ldirish jarayonida siz taqdim etgan ism-familiya, elektron pochta, telefon raqami, tug‘ilgan sana, jins, viloyat, ta’lim muassasasi, o‘quv kursi hamda talabalik statusini tasdiqlovchi hujjat nusxasini saqlaymiz.',
    },
    {
      title: '2. Ma’lumotlardan foydalanish maqsadi',
      body: 'Yig‘ilgan barcha shaxsiy ma’lumotlar faqat talabalik statusingizni tekshirish, sizga mos chegirmalar va promo-kodlarni taqdim etish, shuningdek xizmat sifatini yaxshilash hamda texnik yordam ko‘rsatish uchun ishlatiladi.',
    },
    {
      title: '3. Ma’lumotlarni saqlash va himoyalash',
      body: 'Barcha ma’lumotlaringiz zamonaviy shifrlash protokollari (HTTPS/TLS) orqali uzatiladi va himoyalangan bulutli serverlarda saqlanadi. Talabalik hujjatlariga faqat vakolatli xodimlar tekshiruv maqsadida kira oladi.',
    },
    {
      title: '4. Uchinchi shaxslarga oshkor qilmaslik',
      body: 'IMTIYO sizning shaxsiy ma’lumotlaringizni reklama kompaniyalariga yoki ruxsatsiz uchinchi shaxslarga sotmaydi va tarqatmaydi. Qonun hujjatlarida nazarda tutilgan hollar bundan mustasno.',
    },
    {
      title: '5. Cookie va mahalliy saqlash (localStorage)',
      body: 'Saytning tez ishlashi, tanlangan til (UZ/RU/EN), tema (Yorug‘/Tungi rejim) va sevimli chegirmalaringizni eslab qolish uchun brauzer xotirasidan foydalaniladi.',
    },
    {
      title: '6. Foydalanuvchi huquqlari',
      body: 'Siz istalgan vaqtda o‘z profil ma’lumotlaringizni tahrirlashingiz, yangilashingiz yoki hisobingiz hamda ma’lumotlaringizni o‘chirish bo‘yicha support@imtiyo.uz elektron pochtasiga murojaat qilishingiz mumkin.',
    },
  ],
  ru: [
    {
      title: '1. Какие данные мы собираем?',
      body: 'При регистрации и заполнении профиля мы сохраняем ваше имя и фамилию, email, номер телефона, дату рождения, пол, регион, учебное заведение, курс обучения и копию документа, подтверждающего статус студента.',
    },
    {
      title: '2. Цели использования данных',
      body: 'Все персональные данные используются исключительно для подтверждения студенческого статуса, предоставления релевантных скидок и промокодов, а также для улучшения качества сервиса и поддержки пользователей.',
    },
    {
      title: '3. Хранение и защита данных',
      body: 'Данные передаются по защищённому протоколу HTTPS/TLS и хранятся на защищённых облачных серверах. Доступ к студенческим документам имеют только уполномоченные сотрудники для проверки.',
    },
    {
      title: '4. Непередача третьим лицам',
      body: 'IMTIYO не продаёт и не передаёт ваши персональные данные рекламным агентствам или сторонним организациям, за исключением случаев, предусмотренных законом.',
    },
    {
      title: '5. Cookie и локальное хранилище (localStorage)',
      body: 'Для быстрой работы сайта, сохранения выбранного языка (UZ/RU/EN), темы оформления и списка избранных скидок используется локальное хранилище браузера.',
    },
    {
      title: '6. Права пользователя',
      body: 'Вы вправе в любое время редактировать данные своего профиля или запросить удаление аккаунта и персональных данных, написав на support@imtiyo.uz.',
    },
  ],
  en: [
    {
      title: '1. Information We Collect',
      body: 'When registering and completing your profile, we store your full name, email, phone number, date of birth, gender, region, university, study year, and the document submitted to verify your student status.',
    },
    {
      title: '2. How We Use Your Information',
      body: 'Your personal data is used strictly to verify your student status, deliver relevant discounts and promo codes, improve service quality, and provide customer support.',
    },
    {
      title: '3. Data Storage & Security',
      body: 'All data is encrypted in transit (HTTPS/TLS) and stored on secured cloud servers. Verification documents are accessed solely by authorized staff for review purposes.',
    },
    {
      title: '4. No Third-Party Selling',
      body: 'IMTIYO never sells or distributes your personal data to advertisers or unauthorized third parties, except where required by law.',
    },
    {
      title: '5. Cookies & Local Storage',
      body: 'Browser storage is used to keep the site fast and remember your selected language (UZ/RU/EN), theme preference (Light/Dark), and saved deals.',
    },
    {
      title: '6. Your Rights',
      body: 'You can edit your profile information at any time or request full deletion of your account and data by contacting support@imtiyo.uz.',
    },
  ],
};

export default function Privacy() {
  const { t, lang } = useLang();
  const sections = PRIVACY_CONTENT[lang] || PRIVACY_CONTENT.uz;

  return (
    <AppShell breadcrumbs={[{ label: t('nav.privacy') }]}>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:p-9">
          <div className="flex items-start gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#1D6FF2]/10 text-[#1D6FF2] dark:bg-sky-500/15 dark:text-sky-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Lock className="h-3.5 w-3.5" />
                {t('privacy.badge')}
              </span>
              <h1 className="mt-2 text-[24px] font-black tracking-tight text-[#08123A] dark:text-white md:text-[30px]">
                {t('nav.privacy')}
              </h1>
              <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                {t('privacy.updated')}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <h2 className="text-[15.5px] font-extrabold text-[#08123A] dark:text-white">
                  {section.title}
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed font-medium text-slate-600 dark:text-slate-300">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#002D96]/[0.05] px-5 py-4 text-[13px] dark:bg-sky-500/10">
            <p className="font-semibold text-[#08123A] dark:text-slate-200">
              {t('footer.contactTitle')}:{' '}
              <span className="font-extrabold">support@imtiyo.uz</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#1D6FF2] hover:underline dark:text-sky-400"
              >
                {t('nav.terms')}
              </a>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <a
                href="/help"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#1D6FF2] hover:underline dark:text-sky-400"
              >
                {t('nav.helpCenter')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
