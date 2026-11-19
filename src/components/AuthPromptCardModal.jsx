import { Check, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Compact animated glowing-border auth prompt modal (inspired by Uiverse MuhammadHasann,
 * adapted to IMTIYO's royal-blue & electric-sky brand palette).
 * Opens when a guest tries to save a discount or claim an offer, or when a signed-in
 * unverified student tries to activate a deal.
 */
export default function AuthPromptCardModal({
  open,
  reason = 'default',
  signedIn = false,
  onClose,
  onOpenVerify,
}) {
  const navigate = useNavigate();

  if (!open) return null;

  const isLike = reason === 'like';

  const title = !signedIn
    ? isLike
      ? 'Sevimlilarga saqlash uchun ro‘yxatdan o‘ting'
      : 'Chegirmadan foydalanish uchun ro‘yxatdan o‘ting'
    : 'Talabalik statusingizni tasdiqlang';

  const subtitle = !signedIn
    ? isLike
      ? 'Yoqtirgan brend va chegirmalaringizni saqlab qo‘yish hamda yangi aksiyalardan xabardor bo‘lish uchun hisob yarating.'
      : 'Eksklyuziv talaba promo-kodlari va QR-chegirmalarini ochish uchun IMTIYO hisobiga kiring.'
    : 'Talabalik guvohnomasi yoki HEMIS ma’lumotnomasini yuklang va barcha chegirma kodlarini oching.';

  const benefits = [
    '50% gacha eksklyuziv talaba chegirmalari',
    'Sevimli brendlar va promo-kodlarni saqlash',
    '100% bepul raqamli Talaba ID kartasi',
    'Yangi aksiyalar haqida birinchi bo‘lib xabar',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04091a]/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="imtiyo-auth-card-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="imtiyo-auth-card">
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="absolute right-3.5 top-3.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="card_title__container pr-7">
            <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#1D6FF2]/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
              IMTIYO Talabalar
            </span>
            <h3 className="card_title">{title}</h3>
            <p className="card_paragraph">{subtitle}</p>
          </div>

          <hr className="line" />

          <ul className="card__list">
            {benefits.map((item) => (
              <li key={item} className="card__list_item">
                <span className="check">
                  <Check className="h-3 w-3 stroke-[3] text-white" />
                </span>
                <span className="list_text">{item}</span>
              </li>
            ))}
          </ul>

          {!signedIn ? (
            <div className="mt-1 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  navigate('/welcome?mode=signup');
                }}
                className="imtiyo-auth-cta"
              >
                Ro‘yxatdan o‘tish
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  navigate('/welcome?mode=signin');
                }}
                className="w-full rounded-full border border-white/15 bg-white/5 py-2 text-[12px] font-bold text-slate-200 transition-colors hover:bg-white/15 hover:text-white"
              >
                Allaqachon hisobim bor · Kirish
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenVerify?.();
              }}
              className="imtiyo-auth-cta mt-1 inline-flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Talabalikni tasdiqlash</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
