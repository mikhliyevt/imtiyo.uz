import { FileText, ShieldCheck } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useLang } from '@/lib/LanguageContext';

const TERMS_CONTENT = {
  uz: [
    {
      title: '1. Umumiy qoidalar',
      body: 'IMTIYO platformasi O‘zbekiston Respublikasidagi oliy va o‘rta-maxsus ta’lim muassasalari talabalariga hamkor brendlarning eksklyuziv chegirma, aksiya va bonuslaridan foydalanish imkonini beradi. Platformadan foydalanish orqali siz ushbu Foydalanish shartlariga rozilik bildirasiz.',
    },
    {
      title: '2. Ro‘yxatdan o‘tish va talabalikni tasdiqlash',
      body: 'Chegirmalardan foydalanish uchun foydalanuvchi amaldagi talaba bo‘lishi va faqat o‘ziga tegishli haqiqiy talabalik guvohnomasi yoki HEMIS / my.gov.uz ma’lumotnomasini taqdim etishi shart. Soxta hujjat yuklagan hisoblar ogohlantirishsiz bloklanishi mumkin.',
    },
    {
      title: '3. Promo-kod va QR-kodlardan foydalanish',
      body: 'Platforma orqali berilgan barcha promo-kodlar va dinamik QR-kodlar faqat shaxsiy foydalanish uchun mo‘ljallangan. Ularni uchinchi shaxslarga berish, ommaviy tarqatish yoki tijorat maqsadida sotish qat’iyan taqiqlanadi.',
    },
    {
      title: '4. Hamkor brendlar mas’uliyati',
      body: 'Har bir chegirma va aksiyaning shartlari, amal qilish muddati hamda mavjudligi tegishli hamkor brend tomonidan belgilanadi. IMTIYO hamkorlarning takliflarini o‘z vaqtida yangilab borishga intiladi, ammo hamkorlar shartlarni o‘zgartirish huquqini saqlab qoladi.',
    },
    {
      title: '5. Hisob xavfsizligi',
      body: 'Foydalanuvchi o‘z paroli va hisobiga kirish ma’lumotlarining maxfiyligini saqlash uchun shaxsan mas’uldir. Shubhali faollik aniqlansa, darhol qo‘llab-quvvatlash markaziga (@imtiyosupport_bot) murojaat qiling.',
    },
    {
      title: '6. Shartlarga o‘zgartirish kiritish',
      body: 'IMTIYO ushbu Foydalanish shartlarini istalgan vaqtda yangilash huquqiga ega. Yangilangan shartlar ushbu sahifada e’lon qilingan paytdan boshlab kuchga kiradi.',
    },
  ],
  ru: [
    {
      title: '1. Общие положения',
      body: 'Платформа IMTIYO предоставляет студентам вузов и колледжей Республики Узбекистан доступ к эксклюзивным скидкам и бонусам от партнёрских брендов. Используя платформу, вы соглашаетесь с настоящими Условиями использования.',
    },
    {
      title: '2. Регистрация и подтверждение статуса студента',
      body: 'Для доступа к скидкам пользователь должен являться действующим студентом и предоставить подлинный студенческий билет либо справку HEMIS / my.gov.uz. Аккаунты с поддельными документами могут быть заблокированы без предупреждения.',
    },
    {
      title: '3. Использование промокодов и QR-кодов',
      body: 'Все промокоды и динамические QR-коды предназначены исключительно для личного использования. Передача третьим лицам, массовое распространение или продажа строго запрещены.',
    },
    {
      title: '4. Ответственность брендов-партнёров',
      body: 'Условия, сроки действия и наличие каждой акции определяются соответствующим брендом-партнёром. Партнёры вправе изменять условия предложений.',
    },
    {
      title: '5. Безопасность аккаунта',
      body: 'Пользователь несёт личную ответственность за сохранность своего пароля и учётных данных. При подозрении на несанкционированный доступ свяжитесь со службой поддержки (@imtiyosupport_bot).',
    },
    {
      title: '6. Изменение условий',
      body: 'IMTIYO оставляет за собой право обновлять настоящие Условия использования в любое время. Изменения вступают в силу с момента публикации на данной странице.',
    },
  ],
  en: [
    {
      title: '1. General Provisions',
      body: 'The IMTIYO platform provides university and college students in Uzbekistan with exclusive discounts, offers, and perks from partner brands. By using the platform, you agree to these Terms of Service.',
    },
    {
      title: '2. Registration & Student Verification',
      body: 'To claim discounts, users must be currently enrolled students and submit a genuine Student ID card or HEMIS / my.gov.uz certificate. Accounts submitting forged documents may be suspended without notice.',
    },
    {
      title: '3. Promo Codes & QR Codes',
      body: 'All promo codes and dynamic QR codes issued via IMTIYO are strictly for personal use. Sharing with third parties, public redistribution, or commercial resale is prohibited.',
    },
    {
      title: '4. Partner Brand Responsibility',
      body: 'The terms, validity period, and availability of each offer are determined by the respective partner brand. Partners reserve the right to update offer terms.',
    },
    {
      title: '5. Account Security',
      body: 'Users are responsible for keeping their login credentials secure. If you suspect unauthorized activity, please contact support immediately (@imtiyosupport_bot).',
    },
    {
      title: '6. Updates to These Terms',
      body: 'IMTIYO may update these Terms of Service at any time. Updated terms become effective immediately upon publication on this page.',
    },
  ],
};

export default function Terms() {
  const { t, lang } = useLang();
  const sections = TERMS_CONTENT[lang] || TERMS_CONTENT.uz;

  return (
    <AppShell breadcrumbs={[{ label: t('nav.terms') }]}>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:p-9">
          <div className="flex items-start gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1D6FF2]/10 px-3 py-0.5 text-[11px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('terms.badge')}
              </span>
              <h1 className="mt-2 text-[24px] font-black tracking-tight text-[#08123A] dark:text-white md:text-[30px]">
                {t('nav.terms')}
              </h1>
              <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                {t('terms.updated')}
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
              {t('terms.questions')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/privacy"
                className="font-extrabold text-[#1D6FF2] hover:underline dark:text-sky-400"
              >
                {t('nav.privacy')}
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
