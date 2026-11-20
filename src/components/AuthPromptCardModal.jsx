import { Check, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { useScrollLock } from '@/lib/useScrollLock';

export default function AuthPromptCardModal({
  open,
  reason = 'default',
  signedIn = false,
  onClose,
  onOpenVerify,
}) {
  const navigate = useNavigate();
  const { t } = useLang();

  useScrollLock(open);

  if (!open) return null;

  const isLike = reason === 'like';

  const title = !signedIn
    ? isLike
      ? t('authPrompt.titleLike')
      : t('authPrompt.titleDeal')
    : t('authPrompt.titleVerify');

  const subtitle = !signedIn
    ? isLike
      ? t('authPrompt.subLike')
      : t('authPrompt.subDeal')
    : t('authPrompt.subVerify');

  const benefits = [
    t('authPrompt.b1'),
    t('authPrompt.b2'),
    t('authPrompt.b3'),
    t('authPrompt.b4'),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#04091a]/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="imtiyo-auth-card-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="imtiyo-auth-card">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="absolute right-3.5 top-3.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="card_title__container pr-7">
            <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#1D6FF2]/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
              {t('authPrompt.badge')}
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
                {t('header.signup')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  navigate('/welcome?mode=signin');
                }}
                className="w-full rounded-full border border-white/15 bg-white/5 py-2 text-[12px] font-bold text-slate-200 transition-colors hover:bg-white/15 hover:text-white"
              >
                {t('authPrompt.haveAccount')}
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
              <span>{t('verify.cta')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
