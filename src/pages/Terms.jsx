import { FileText, ShieldCheck } from 'lucide-react';
import AppShell from '@/components/AppShell';

const TERMS_SECTIONS = [
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
];

export default function Terms() {
  return (
    <AppShell breadcrumbs={[{ label: 'Foydalanish shartlari' }]}>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:p-9">
          <div className="flex items-start gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1D6FF2]/10 px-3 py-0.5 text-[11px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Ochiq hujjat · Barcha foydalanuvchilar uchun
              </span>
              <h1 className="mt-2 text-[24px] font-black tracking-tight text-[#08123A] dark:text-white md:text-[30px]">
                Foydalanish shartlari
              </h1>
              <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Oxirgi yangilanish: 2026-yil · IMTIYO talabalar imtiyozlar platformasi
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {TERMS_SECTIONS.map((section) => (
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
              Shartlar bo‘yicha savollaringiz bormi?
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/privacy"
                className="font-extrabold text-[#1D6FF2] hover:underline dark:text-sky-400"
              >
                Maxfiylik siyosati
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
