import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Clock3, Copy, ExternalLink, QrCode, Smartphone } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { copyText, formatSeconds, localizedTitle, qrUrl, randomToken } from '@/lib/deal';

export default function RedemptionModal({ brand, offer, open, onOpenChange }) {
  const { t, lang } = useLang();
  const { profile } = useStudent();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [remaining, setRemaining] = useState(900);
  const [copied, setCopied] = useState(false);

  const isApp = offer?.redemption === 'app';
  const deepLink = offer?.deepLink || brand?.deepLink;
  const appName = brand?.appName || brand?.name;

  useEffect(() => {
    if (!open || !offer) return;
    const studentId = profile.student_id || 'IMT-GUEST';
    const generated = isApp
      ? offer.promoCode || `IMTIYO-${(brand?.monogram || 'X').toUpperCase()}${randomToken(4)}`
      : `IMT-${(brand?.monogram || 'X').toUpperCase()}-${randomToken(6)}`;
    const expires = Date.now() + 15 * 60 * 1000;
    setCode(generated);
    setExpiresAt(expires);
    setRemaining(900);
    setCopied(false);
    api.createRedemption({
      brand_id: brand?.id,
      brand_name: brand?.name,
      student_name: profile.name,
      code: `${generated} · ${studentId}`,
      redemption_type: offer.redemption,
      expires_at: new Date(expires).toISOString(),
    });
  }, [open, offer?.id]);

  useEffect(() => {
    if (!open || !expiresAt) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [open, expiresAt]);

  const handleCopy = async () => {
    const ok = await copyText(code);
    setCopied(ok);
    toast({ title: ok ? t('toast.copied') : t('redeem.manualCode'), description: code });
    if (ok) setTimeout(() => setCopied(false), 2200);
  };

  const handleCopyAndOpen = async () => {
    await copyText(code);
    toast({ title: t('toast.copied'), description: t('redeem.toast', { app: appName }) });
    if (deepLink) window.open(deepLink, '_blank', 'noopener,noreferrer');
  };

  if (!brand || !offer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-[26px] border-white/70 bg-white/90 p-0 backdrop-blur-2xl">
        <div
          className="relative p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${brand.accent2}, ${brand.accent})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#06123A]/80 to-transparent" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-md">
              {isApp ? <Smartphone className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
            </span>
            <DialogHeader className="text-left">
              <DialogTitle className="text-[17px] font-extrabold leading-tight text-white">
                {t(isApp ? 'redeem.appTitle' : 'redeem.qrTitle')}
              </DialogTitle>
            </DialogHeader>
          </div>
          <p className="relative mt-2 text-[12px] font-medium text-white/85">
            {brand.name} · {localizedTitle(offer, lang)}
          </p>
        </div>

        <div className="space-y-4 p-6">
          {isApp ? (
            <>
              <p className="text-[12.5px] leading-relaxed text-slate-500">
                {t('redeem.appSubtitle', { app: appName })}
              </p>
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#002D96]/15 bg-[#002D96]/[0.04] px-4 py-3.5">
                <span className="font-mono text-[14px] font-bold tracking-[0.06em] text-[#002D96]">
                  {code}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#002D96] shadow-sm"
                  aria-label={t('common.copy')}
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <Button
                onClick={handleCopyAndOpen}
                className="h-12 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-[0_16px_34px_-16px_rgba(0,45,150,0.95)]"
              >
                {t('redeem.appCta', { app: appName })}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <p className="text-[12.5px] leading-relaxed text-slate-500">{t('redeem.qrSubtitle')}</p>
              <div className="mx-auto w-fit rounded-3xl border border-white/80 bg-white p-3 shadow-[0_18px_40px_-24px_rgba(0,45,150,0.6)]">
                <img
                  src={qrUrl(
                    `IMTIYO|${profile.student_id || 'GUEST'}|${offer.id}|${code}|${Date.now()}`,
                    240
                  )}
                  alt="QR"
                  className="h-[190px] w-[190px] rounded-xl"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[12px] font-bold text-amber-600">
                <Clock3 className="h-3.5 w-3.5" />
                {remaining > 0 ? formatSeconds(remaining) : t('redeem.expired')}
              </div>
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-900/[0.04] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {t('redeem.manualCode')}
                  </p>
                  <p className="truncate font-mono text-[13px] font-bold text-[#08123A]">{code}</p>
                  <p className="truncate font-mono text-[10px] text-slate-400">{profile.student_id}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#002D96] shadow-sm"
                  aria-label={t('common.copy')}
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="rounded-2xl bg-[#002D96]/[0.05] px-4 py-3 text-[12px] font-medium leading-relaxed text-[#002D96]">
                {t('redeem.qrInstruction')}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}