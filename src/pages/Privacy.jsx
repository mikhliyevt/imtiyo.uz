import { Lock, Shield } from 'lucide-react';
import AppShell from '@/components/AppShell';

const PRIVACY_SECTIONS = [
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
    body: 'Barcha ma’lumotlaringiz zamonaviy shifrlash protokollari (HTTPS/TLS) orqali uzatiladi va himoyalangan bulutli serverlarda saqlanadi. Talabalik hujjatlariga faqat vakolatli moderatorlar tekshiruv maqsadida kira oladi.',
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
];

export default function Privacy() {
  return (
    <AppShell breadcrumbs={[{ label: 'Maxfiylik siyosati' }]}>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:p-9">
          <div className="flex items-start gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#1D6FF2]/10 text-[#1D6FF2] dark:bg-sky-500/15 dark:text-sky-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Lock className="h-3.5 w-3.5" />
                Ma’lumotlaringiz himoyalangan
              </span>
              <h1 className="mt-2 text-[24px] font-black tracking-tight text-[#08123A] dark:text-white md:text-[30px]">
                Maxfiylik siyosati
              </h1>
              <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Oxirgi yangilanish: 2026-yil · Barcha foydalanuvchilar uchun ochiq sahifa
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {PRIVACY_SECTIONS.map((section) => (
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
              Bog‘lanish: <span className="font-extrabold">support@imtiyo.uz</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#1D6FF2] hover:underline dark:text-sky-400"
              >
                Foydalanish shartlari
              </a>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <a
                href="/help"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#1D6FF2] hover:underline dark:text-sky-400"
              >
                Yordam markazi
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
