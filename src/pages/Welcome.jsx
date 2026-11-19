import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PageTopGradient from '@/components/PageTopGradient';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import UniversitySelect from '@/components/UniversitySelect';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';
import { OAUTH_PENDING_KEY, OAUTH_RETURN_KEY, useStudent } from '@/lib/StudentContext';
import { supabase } from '@/lib/supabase';
import { api, COURSE_OPTIONS } from '@/services/api';
import { REGIONS, formatUzPhone, formatBirthDateMask } from '@/lib/formUtils';
import { cn } from '@/lib/utils';

export { REGIONS, formatUzPhone, formatBirthDateMask };

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const YEARS = Array.from({ length: 2020 - 1980 + 1 }, (_, i) => String(2020 - i));

function BrandEmblem() {
  return (
    <div className="mx-auto mb-3 h-14 w-14 overflow-hidden rounded-[18px] shadow-[0_14px_30px_-10px_rgba(0,45,150,0.55)]">
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-label="Imtiyo logo">
        <defs>
          <linearGradient id="imtiyoBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0A66FF" />
            <stop offset="100%" stopColor="#0039B3" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#imtiyoBlue)" />
        <path d="M57 34 L86 46 L57 58 L28 46 Z" fill="#FFFFFF" />
        <path d="M57 45 L41 53" stroke="#0A66FF" strokeWidth="3.2" strokeLinecap="round" />
        <path
          d="M34 86 V64 C34 59 40 57 44 61 L57 72 L72 59 C76 55 83 58 83 64 V67"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="10.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g transform="translate(69, 64) rotate(-14)">
          <rect x="0" y="0" width="22" height="28" rx="6" fill="#E8F1FF" />
          <circle cx="7" cy="9" r="2.2" fill="#0039B3" />
          <circle cx="15" cy="19" r="2.2" fill="#0039B3" />
          <line
            x1="15.5"
            y1="8.5"
            x2="6.5"
            y2="19.5"
            stroke="#0039B3"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

export default function Welcome() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, signIn, updateProfile } = useStudent();

  const returnTo = searchParams.get('returnTo') || '/';

  const [mode, setMode] = useState(searchParams.get('mode') === 'signin' ? 'signin' : 'signup');
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [phoneOtpChannel, setPhoneOtpChannel] = useState('telegram'); // 'telegram' | 'sms'
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'details' | 'forgot'

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email signup rozilik checkboxi
  const [emailTermsAccepted, setEmailTermsAccepted] = useState(false);

  // OTP va Telegram Bot holati
  const [enteredCode, setEnteredCode] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [tgDeepLink, setTgDeepLink] = useState('');
  const [tgBotUsername, setTgBotUsername] = useState('imtiyokod_bot');
  const [tgCodeDelivered, setTgCodeDelivered] = useState(false);

  const [forgotStep, setForgotStep] = useState('input');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Anketa (Details)
  const [universities, setUniversities] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [region, setRegion] = useState('');
  const [university, setUniversity] = useState('');
  const [customInstitution, setCustomInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [extraPhone, setExtraPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  // Agar Google OAuth yoki sessiya avtomatik tasdiqlangan bo'lsa, darhol kerakli sahifaga yo'naltirish
  useEffect(() => {
    if (profile?.signedIn && step === 'form') {
      let target = returnTo && returnTo !== '/' ? returnTo : '/profile';
      try {
        const savedReturn = sessionStorage.getItem(OAUTH_RETURN_KEY);
        if (savedReturn && savedReturn.startsWith('/') && !savedReturn.startsWith('//')) {
          target = savedReturn;
        }
        sessionStorage.removeItem(OAUTH_RETURN_KEY);
      } catch {
        /* ignore */
      }
      navigate(target, { replace: true });
    }
  }, [profile?.signedIn, step, returnTo, navigate]);

  // 60 soniyalik taymer
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Telegram Bot (@imtiyokod_bot) orqali foydalanuvchi kontakt ulashganini va raqam mosligini kuzatish
  useEffect(() => {
    const isPhoneOtpActive =
      (step === 'otp' && method === 'phone' && phoneOtpChannel === 'telegram') ||
      (step === 'forgot' && forgotStep === 'verify_reset' && method === 'phone');

    if (!isPhoneOtpActive) return;

    const pollInterval = setInterval(async () => {
      const res = await api.pollTelegramBotAndSendCode(phone);
      if (res?.sent && res?.matched) {
        setTgCodeDelivered(true);
        setError('');
        setInfo('✅ Raqamingiz tasdiqlandi! 6 xonali kod Telegram botingizga yuborildi.');
      } else if (res?.mismatch) {
        setError(
          'Telegram raqamingiz saytda kiritilgan raqam bilan mos kelmadi! Botdagi xabarni tekshiring.'
        );
      }
    }, 2200);

    return () => clearInterval(pollInterval);
  }, [step, forgotStep, method, phoneOtpChannel, phone]);

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'signin' || m === 'signup') setMode(m);
  }, [searchParams]);

  useEffect(() => {
    api
      .listUniversities()
      .then((list) => setUniversities(list || []))
      .catch(() => {});
  }, []);

  const filteredSortedUniversities = useMemo(() => {
    const normalizeRegion = (r) =>
      String(r || '')
        .toLowerCase()
        .replace(/viloyati|shahri|respublikasi/g, '')
        .trim();

    const selectedNorm = normalizeRegion(region);

    return [...universities]
      .filter((u) => {
        if (typeof u === 'string') return true;
        if (!region || !u.region) return true;
        return u.region === region || normalizeRegion(u.region) === selectedNorm;
      })
      .sort((a, b) => {
        const nameA = typeof a === 'string' ? a : a.name || '';
        const nameB = typeof b === 'string' ? b : b.name || '';
        return nameA.localeCompare(nameB, 'uz');
      });
  }, [universities, region]);

  const resetMessages = () => {
    setError('');
    setInfo('');
  };

  // Tugma faolligi sharti (Validation)
  const isSignupFormReady = useMemo(() => {
    if (mode !== 'signup') return true;
    if (password.length < 6 || confirmPassword.length < 6) return false;
    if (password !== confirmPassword) return false;

    if (method === 'email') {
      const validEmail = email.includes('@') && email.includes('.');
      return validEmail && emailTermsAccepted;
    } else {
      const validPhone = phone.replace(/\D/g, '').length === 9;
      return validPhone;
    }
  }, [mode, method, email, phone, password, confirmPassword, emailTermsAccepted]);

  const sendRealOtp = async () => {
    setTimer(60);
    setCanResend(false);
    resetMessages();
    try {
      if (method === 'email') {
        await api.sendEmailOtpViaResend(email.trim().toLowerCase());
        setInfo('Yangi 6 xonali tasdiqlash kodi emailingizga yuborildi!');
      } else if (phoneOtpChannel === 'telegram') {
        const tgSession = await api.initTelegramOtpSession(phone, true);
        setTgDeepLink(tgSession.deepLink);
        setTgBotUsername(tgSession.botUsername);
        setTgCodeDelivered(false);
        setInfo(`@${tgSession.botUsername} botiga o‘tib «Start» va «Telefon raqamni yuborish» ni bosing.`);
      } else {
        setInfo('SMS xizmati tez orada ulanadi. Iltimos, Telegram bot orqali kod oling.');
      }
    } catch (err) {
      setError(err.message || 'Kodni yuborishda xatolik');
    }
  };

  const googleSignIn = async () => {
    resetMessages();
    setBusy(true);
    try {
      const targetAfterAuth =
        returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') && returnTo !== '/'
          ? returnTo
          : '/profile';
      try {
        sessionStorage.setItem(OAUTH_PENDING_KEY, '1');
        sessionStorage.setItem(OAUTH_RETURN_KEY, targetAfterAuth);
      } catch {
        /* ignore */
      }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/profile` },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      try {
        sessionStorage.removeItem(OAUTH_PENDING_KEY);
      } catch {
        /* ignore */
      }
      setError(err.message || 'Google orqali kirishda xatolik yuz berdi');
      setBusy(false);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    resetMessages();

    if (method === 'email') {
      if (!email.includes('@') || !email.includes('.')) {
        setError('To‘g‘ri email manzilini kiriting');
        return;
      }
    } else if (phone.replace(/\D/g, '').length !== 9) {
      setError('+998 99 999 99 99 formatida 9 ta raqam kiriting');
      return;
    }

    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Parollar bir-biriga mos kelmadi');
        return;
      }
      if (method === 'email' && !emailTermsAccepted) {
        setError('Foydalanish shartlari va Maxfiylik siyosatiga rozilik bildiring');
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const existingProfiles = await api.listProfiles();

        if (method === 'email') {
          const cleanEmail = email.trim().toLowerCase();
          const emailExists = existingProfiles.some(
            (p) => p.email && p.email.trim().toLowerCase() === cleanEmail
          );
          if (emailExists) {
            throw new Error('Bu email allaqachon ro‘yxatdan o‘tgan. «Kirish» bo‘limidan kiring.');
          }

          await api.sendEmailOtpViaResend(cleanEmail);
          setEnteredCode('');
          setTimer(60);
          setCanResend(false);
          setStep('otp');
          setBusy(false);
          return;
        } else {
          const cleanDigits = phone.replace(/\D/g, '');
          const phoneExists = existingProfiles.some(
            (p) => p.phone && p.phone.replace(/\D/g, '').endsWith(cleanDigits)
          );
          if (phoneExists) {
            throw new Error(
              'Bu telefon raqam allaqachon ro‘yxatdan o‘tgan. «Kirish» bo‘limidan kiring.'
            );
          }

          if (phoneOtpChannel === 'telegram') {
            const tgSession = await api.initTelegramOtpSession(phone, true);
            setTgDeepLink(tgSession.deepLink);
            setTgBotUsername(tgSession.botUsername);
            setTgCodeDelivered(false);
          }

          setEnteredCode('');
          setTimer(60);
          setCanResend(false);
          setStep('otp');
          setBusy(false);
          return;
        }
      }

      // ==========================================
      // TIZIMGA KIRISH (LOGIN)
      // ==========================================
      if (method === 'email') {
        const cleanEmail = email.trim().toLowerCase();
        const all = await api.listProfiles();
        const found = all.find((p) => p.email && p.email.toLowerCase() === cleanEmail);

        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInErr) {
          if (!found) {
            throw new Error('Email yoki parol noto‘g‘ri');
          }
          const savedPass = localStorage.getItem(`imtiyo_pwd_${cleanEmail}`);
          if (
            (found.password && found.password !== password) ||
            (savedPass && savedPass !== password)
          ) {
            throw new Error('Email yoki parol noto‘g‘ri');
          }
        }

        await signIn({ provider: 'email', email: cleanEmail });
        navigate(returnTo);
      } else {
        const cleanPhone = `+998 ${formatUzPhone(phone)}`;
        const digits = phone.replace(/\D/g, '').slice(-9);
        const all = await api.listProfiles();
        const found = all.find(
          (p) => p.phone && p.phone.replace(/\D/g, '').endsWith(digits)
        );
        if (!found) throw new Error('Bunday telefon raqam ro‘yxatdan o‘tmagan');

        const savedPass = localStorage.getItem(`imtiyo_pwd_phone_${digits}`);
        if (
          (found.password && found.password !== password) ||
          (savedPass && savedPass !== password)
        ) {
          throw new Error('Telefon raqam yoki parol noto‘g‘ri');
        }

        await signIn({ provider: 'phone', phone: cleanPhone });
        navigate(returnTo);
      }
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
      setBusy(false);
    }
  };

  const handleVerifyCode = async () => {
    resetMessages();
    setBusy(true);
    try {
      if (method === 'email') {
        const cleanEmail = email.trim().toLowerCase();
        const isValid = await api.verifyEmailOtpCode(cleanEmail, enteredCode);
        if (!isValid) {
          throw new Error('Tasdiqlash kodi noto‘g‘ri yoki muddati tugagan');
        }

        await supabase.auth.signUp({ email: cleanEmail, password }).catch(() => {});
        await supabase.auth.updateUser({ password }).catch(() => {});
        localStorage.setItem(`imtiyo_pwd_${cleanEmail}`, password);
        localStorage.setItem(`imtiyo_verified_${cleanEmail}`, 'true');
      } else {
        const digits = phone.replace(/\D/g, '').slice(-9);
        if (phoneOtpChannel === 'telegram') {
          const isValid = await api.verifyPhoneOtpCode(phone, enteredCode);
          if (!isValid) {
            throw new Error('Telegram botdan olingan 6 xonali kod noto‘g‘ri');
          }
        }
        localStorage.setItem(`imtiyo_pwd_phone_${digits}`, password);
        setExtraPhone(formatUzPhone(phone));
      }

      setStep('details');
    } catch (err) {
      setError(err.message || 'Tasdiqlash kodi noto‘g‘ri');
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    resetMessages();

    if (firstName.trim().length < 2) {
      setError('Ismingizni kiriting');
      return;
    }
    if (lastName.trim().length < 2) {
      setError('Familiyangizni kiriting');
      return;
    }
    if (!region) {
      setError('Viloyatingizni tanlang');
      return;
    }
    if (!university) {
      setError('Ta’lim muassasangizni tanlang');
      return;
    }
    if (university === 'Boshqa' && customInstitution.trim().length < 2) {
      setError('Ta’lim muassasangiz nomini yozing');
      return;
    }
    if (!course || !COURSE_OPTIONS.includes(String(course))) {
      setError('Kursingizni tanlang (1–6)');
      return;
    }
    if (!birthDay || !birthMonth || !birthYear) {
      setError('Tug‘ilgan kun, oy va yilingizni tanlang');
      return;
    }
    if (!gender) {
      setError('Jinsingizni tanlang');
      return;
    }

    const finalPhoneDigits = (method === 'phone' ? phone : extraPhone).replace(/\D/g, '');
    if (finalPhoneDigits.length !== 9) {
      setError('Telefon raqamingizni to‘liq kiriting (9 ta raqam)');
      return;
    }

    setBusy(true);
    try {
      const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`;
      const finalInstitution =
        university === 'Boshqa' ? customInstitution.trim() : university;
      const formattedPhone = `+998 ${formatUzPhone(method === 'phone' ? phone : extraPhone)}`;
      const birthDate = `${birthDay.padStart(2, '0')}.${birthMonth.padStart(2, '0')}.${birthYear}`;

      let uploadedAvatarUrl = '';
      if (avatarFile) {
        try {
          uploadedAvatarUrl = await api.uploadFile(avatarFile, 'avatars');
        } catch {
          uploadedAvatarUrl = avatarPreview;
        }
      }

      const created = await signIn({
        provider: method,
        email: method === 'email' ? email.trim().toLowerCase() : '',
        phone: formattedPhone,
        name: fullNameCombined,
        university: finalInstitution,
        course: String(course),
        gender,
        birth_date: birthDate,
        region,
        avatar_url: uploadedAvatarUrl,
      });

      if (created?.id) {
        await updateProfile({
          name: fullNameCombined,
          full_name: fullNameCombined,
          university: finalInstitution,
          course: String(course),
          phone: formattedPhone,
          birth_date: birthDate,
          gender,
          region,
          password,
          email_verified: true,
          ...(uploadedAvatarUrl ? { avatar_url: uploadedAvatarUrl } : {}),
        });
      }

      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Ma’lumotlarni saqlashda xatolik');
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetMessages();

    if (method === 'email') {
      if (!email.includes('@')) {
        setError('Parolni tiklash uchun email manzilingizni kiriting');
        return;
      }
      setBusy(true);
      try {
        await api.sendEmailOtpViaResend(email.trim().toLowerCase());
        setInfo('Parolni tiklash kodi emailingizga yuborildi.');
        setForgotStep('verify_reset');
      } catch (err) {
        setError(err.message || 'Xatolik yuz berdi');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (phone.replace(/\D/g, '').length !== 9) {
      setError('+998 99 999 99 99 formatida 9 ta raqam kiriting');
      return;
    }

    setBusy(true);
    try {
      const digits = phone.replace(/\D/g, '').slice(-9);
      const all = await api.listProfiles();
      const found = all.find(
        (p) => p.phone && p.phone.replace(/\D/g, '').endsWith(digits)
      );
      if (!found) throw new Error('Bunday telefon raqam bazada topilmadi');
      const tgSession = await api.initTelegramOtpSession(phone, true);
      setTgDeepLink(tgSession.deepLink);
      setTgBotUsername(tgSession.botUsername);
      setForgotStep('verify_reset');
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setBusy(false);
    }
  };

  const handleCompletePasswordReset = async (e) => {
    e.preventDefault();
    resetMessages();
    if (newPassword.length < 6) {
      setError('Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak');
      return;
    }
    setBusy(true);
    try {
      if (method === 'email') {
        const cleanEmail = email.trim().toLowerCase();
        const ok = await api.verifyEmailOtpCode(cleanEmail, enteredCode);
        if (!ok) throw new Error('Tasdiqlash kodi noto‘g‘ri');
        localStorage.setItem(`imtiyo_pwd_${cleanEmail}`, newPassword);
        await signIn({ provider: 'email', email: cleanEmail });
      } else {
        const digits = phone.replace(/\D/g, '').slice(-9);
        const ok = await api.verifyPhoneOtpCode(phone, enteredCode);
        if (!ok) throw new Error('Tasdiqlash kodi noto‘g‘ri');
        localStorage.setItem(`imtiyo_pwd_phone_${digits}`, newPassword);
        await signIn({ provider: 'phone', phone: `+998 ${formatUzPhone(phone)}` });
      }
      setInfo('Parolingiz muvaffaqiyatli yangilandi!');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setBusy(false);
    }
  };

  const switchAuthMode = (nextMode) => {
    setMode(nextMode);
    setStep('form');
    resetMessages();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('mode', nextMode);
    setSearchParams(nextParams, { replace: true });
  };

  const welcomeBreadcrumbs = useMemo(() => {
    const baseLabel = mode === 'signup' ? 'Ro‘yxatdan o‘tish' : 'Kirish';
    if (step === 'form') {
      return [{ label: baseLabel }];
    }
    const stepLabel =
      step === 'otp'
        ? 'Tasdiqlash kodi'
        : step === 'details'
          ? 'Talaba ma’lumotlari'
          : 'Parolni tiklash';
    return [
      {
        label: baseLabel,
        onClick: () => {
          setStep('form');
          resetMessages();
        },
      },
      { label: stepLabel },
    ];
  }, [mode, step]);

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[#08123A] dark:bg-[#070d1f] dark:text-slate-100">
      <PageTopGradient />

      {/* YUQORI GLASS PANEL: LOGO (OVAL) + TIL */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 pt-4 md:px-8">
        <Link
          to="/"
          className="imtiyo-glass-pill inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5"
        >
          <Logo size="sm" />
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>

      {/* UNIFIED BREADCRUMB (YUQORI CHAP BURCHAKDA) */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-8">
        <PageBreadcrumb items={welcomeBreadcrumbs} className="mb-0" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-12 pt-4">
        <div className="mb-5 text-center">
          <BrandEmblem />
          <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-[#08123A] dark:text-white">
            {step === 'details'
              ? 'Ma’lumotlaringizni kiriting'
              : step === 'forgot'
                ? 'Parolni tiklash'
                : mode === 'signup'
                  ? 'Ro‘yxatdan o‘tish'
                  : 'Tizimga kirish'}
          </h1>
        </div>

        <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_26px_60px_-34px_rgba(0,45,150,0.45)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_26px_60px_-34px_rgba(0,0,0,0.85)]">
          {/* 1. RO'YXATDAN O'TISH / KIRISH FORMASI */}
          {step === 'form' && (
            <>
              <div className="mb-4 grid grid-cols-2 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => switchAuthMode('signup')}
                  className={cn(
                    'rounded-full py-2 text-[12px] font-bold transition-all',
                    mode === 'signup'
                      ? 'bg-white text-[#002D96] shadow-sm dark:bg-[#1D6FF2] dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  Ro‘yxatdan o‘tish
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode('signin')}
                  className={cn(
                    'rounded-full py-2 text-[12px] font-bold transition-all',
                    mode === 'signin'
                      ? 'bg-white text-[#002D96] shadow-sm dark:bg-[#1D6FF2] dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  Kirish
                </button>
              </div>

              <button
                type="button"
                onClick={googleSignIn}
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-slate-200/90 bg-white text-[13px] font-bold text-[#08123A] shadow-sm transition-transform hover:scale-[1.01] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                Google orqali davom etish
              </button>

              <div className="my-3.5 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200/80 dark:bg-slate-700" />
                <span className="text-[10.5px] font-semibold uppercase text-slate-400">yoki</span>
                <span className="h-px flex-1 bg-slate-200/80 dark:bg-slate-700" />
              </div>

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('email');
                    resetMessages();
                  }}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-[12px] font-bold',
                    method === 'email'
                      ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('phone');
                    resetMessages();
                  }}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-[12px] font-bold',
                    method === 'phone'
                      ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Telefon raqam
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-3">
                {/* 1-MAYDON: EMAIL YOKI TELEFON */}
                {method === 'email' ? (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full bg-transparent text-[13.5px] font-semibold text-[#08123A] outline-none dark:text-white"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800">
                    <span className="text-[13.5px] font-extrabold text-[#002D96] dark:text-sky-400">
                      +998
                    </span>
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                      inputMode="numeric"
                      placeholder="99 999 99 99"
                      className="w-full bg-transparent text-[13.5px] font-semibold text-[#08123A] outline-none dark:text-white"
                    />
                  </div>
                )}

                {/* 2-MAYDON: YANGI PAROL */}
                <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800">
                  <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    placeholder={mode === 'signup' ? 'Yangi parol (min. 6 ta belgi)' : 'Parolingiz'}
                    className="w-full bg-transparent text-[13.5px] font-semibold text-[#08123A] outline-none dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-slate-400 hover:text-[#002D96] dark:hover:text-sky-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* 3-MAYDON: PAROLNI TASDIQLASH */}
                {mode === 'signup' && (
                  <div
                    className={cn(
                      'flex items-center gap-2.5 rounded-2xl border bg-white px-3.5 py-2.5 transition-colors dark:bg-slate-800',
                      confirmPassword && password !== confirmPassword
                        ? 'border-rose-400'
                        : 'border-slate-200 focus-within:border-[#1D6FF2] dark:border-slate-700'
                    )}
                  >
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      placeholder="Parolni tasdiqlang"
                      className="w-full bg-transparent text-[13.5px] font-semibold text-[#08123A] outline-none dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="text-slate-400 hover:text-[#002D96] dark:hover:text-sky-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}

                {mode === 'signup' && confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] font-semibold text-rose-500">
                    Parollar bir-biriga mos kelmadi
                  </p>
                )}

                {/* TELEFON ORQALI RO'YXATDAN O'TISHDA: KOD QABUL QILISH USULINI TANLASH */}
                {mode === 'signup' && method === 'phone' && (
                  <div className="pt-1">
                    <label className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Tasdiqlash kodini qabul qilish usuli:
                    </label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setPhoneOtpChannel('telegram')}
                        className={cn(
                          'flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all',
                          phoneOtpChannel === 'telegram'
                            ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96] ring-2 ring-[#1D6FF2]/20 dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        )}
                      >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#00A9FF]/15 text-[#0077CC] dark:text-sky-400">
                          <Send className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[11.5px] font-extrabold">
                            Telegram orqali kod olish
                          </p>
                          <p className="truncate text-[10px] font-semibold text-[#1D6FF2] dark:text-sky-400">
                            @imtiyokod_bot
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhoneOtpChannel('sms')}
                        className={cn(
                          'flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all',
                          phoneOtpChannel === 'sms'
                            ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96] ring-2 ring-[#1D6FF2]/20 dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        )}
                      >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[11.5px] font-extrabold">
                            SMS orqali kod olish
                          </p>
                          <p className="truncate text-[10px] text-slate-400">Telefon raqamga SMS</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* EMAIL SIGNUP UCHUN MAJBURIY CHECKBOX ROZILIK (PUBLIC ROUTES YANGI OYNADA) */}
                {mode === 'signup' && method === 'email' && (
                  <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={emailTermsAccepted}
                      onChange={(e) => setEmailTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#1D6FF2]"
                    />
                    <span>
                      Tizimga kirish orqali siz IMTIYOning{' '}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-extrabold text-[#1D6FF2] hover:underline dark:text-sky-400"
                      >
                        Foydalanish shartlari
                      </a>{' '}
                      va{' '}
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-extrabold text-[#1D6FF2] hover:underline dark:text-sky-400"
                      >
                        Maxfiylik siyosatiga
                      </a>{' '}
                      rozilik bildirasiz
                    </span>
                  </label>
                )}

                {/* TELEFON SIGNUP UCHUN PASSIV ESLATMA */}
                {mode === 'signup' && method === 'phone' && (
                  <p className="pt-1 text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Ro‘yxatdan o‘tish tugmasini bosish orqali siz IMTIYOning{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-extrabold text-[#1D6FF2] hover:underline dark:text-sky-400"
                    >
                      Foydalanish shartlari
                    </a>{' '}
                    va{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-extrabold text-[#1D6FF2] hover:underline dark:text-sky-400"
                    >
                      Maxfiylik siyosatiga
                    </a>{' '}
                    rozilik bildirasiz.
                  </p>
                )}

                {mode === 'signin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        resetMessages();
                        setForgotStep('input');
                        setStep('forgot');
                      }}
                      className="text-[11.5px] font-semibold text-[#1D6FF2] hover:underline dark:text-sky-400"
                    >
                      Parolni unutdingizmi?
                    </button>
                  </div>
                )}

                {error && <p className="text-[11.5px] font-semibold text-rose-500">{error}</p>}

                <Button
                  type="submit"
                  disabled={busy || (mode === 'signup' && !isSignupFormReady)}
                  className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busy
                    ? 'Kutilmoqda...'
                    : mode === 'signup'
                      ? 'Ro‘yxatdan o‘tish'
                      : 'Kirish'}
                </Button>
              </form>

              {/* UIVERSE #1 (satyamchaudharydev) — REGISTER <-> LOGIN ANIMATED SWITCH */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {mode === 'signup' ? 'Akkauntingiz bormi?' : 'Hali ro‘yxatdan o‘tmadingizmi?'}
                </span>
                <button
                  type="button"
                  onClick={() => switchAuthMode(mode === 'signup' ? 'signin' : 'signup')}
                  className="imtiyo-auth-switch"
                >
                  <p data-text={mode === 'signup' ? 'Kirish' : 'Ro‘yxatdan o‘tish'}>
                    {mode === 'signup' ? 'Kirish' : 'Ro‘yxatdan o‘tish'}
                  </p>
                  <ArrowRight />
                </button>
              </div>
            </>
          )}

          {/* 2. OTP TASDIQLASH OYNASI */}
          {step === 'otp' && (
            <div className="space-y-3.5 text-center">
              <p className="text-[15px] font-extrabold text-[#08123A] dark:text-white">
                Tasdiqlash kodini kiriting
              </p>

              {method === 'email' ? (
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  <strong>{email}</strong> manziliga 6 xonali tasdiqlash kodi yuborildi
                </p>
              ) : phoneOtpChannel === 'telegram' ? (
                <div className="space-y-2.5 rounded-2xl border border-[#00A9FF]/30 bg-[#00A9FF]/[0.06] p-3.5 text-left dark:border-sky-500/30 dark:bg-sky-500/10">
                  <p className="text-[12px] font-semibold leading-relaxed text-[#08123A] dark:text-slate-200">
                    1. Quyidagi tugma orqali <strong>@{tgBotUsername}</strong> botiga o‘ting va{' '}
                    <strong>«Start»</strong> bosing.
                    <br />
                    2. Bot ichidagi <strong>«📱 Telefon raqamni yuborish»</strong> tugmasini bosing.
                    <br />
                    3. Raqamingiz <strong>+998 {formatUzPhone(phone)}</strong> bilan bir xil bo‘lsa,
                    bot sizga 6 xonali kodni beradi!
                  </p>
                  <a
                    href={tgDeepLink || `https://t.me/${tgBotUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0088CC] text-[12.5px] font-extrabold text-white shadow-sm transition-transform hover:scale-[1.01]"
                  >
                    <Send className="h-4 w-4" />
                    @{tgBotUsername} botga o‘tish va kod olish
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {tgCodeDelivered && (
                    <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Raqamingiz tasdiqlandi! Kod Telegram botingizga yuborildi.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
                  SMS provayder hozirda ulanish jarayonida. Iltimos,{' '}
                  <button
                    type="button"
                    onClick={async () => {
                      setPhoneOtpChannel('telegram');
                      const tgSession = await api.initTelegramOtpSession(phone, true);
                      setTgDeepLink(tgSession.deepLink);
                      setTgBotUsername(tgSession.botUsername);
                    }}
                    className="font-extrabold text-[#002D96] underline dark:text-sky-300"
                  >
                    Telegram bot (@imtiyokod_bot)
                  </button>{' '}
                  orqali kod oling.
                </div>
              )}

              <input
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoFocus
                placeholder="000000"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-center text-[22px] font-extrabold tracking-[0.35em] text-[#002D96] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300"
              />

              {error && <p className="text-[11.5px] font-semibold text-rose-500">{error}</p>}
              {info && (
                <p className="text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {info}
                </p>
              )}

              <Button
                onClick={handleVerifyCode}
                disabled={enteredCode.length < 6 || busy}
                className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                {busy ? 'Tekshirilmoqda...' : 'Kodni tasdiqlash'}
              </Button>

              <div className="flex items-center justify-between pt-2 text-[12px]">
                <span className="text-slate-500 dark:text-slate-400">
                  {timer > 0 ? (
                    <>
                      Qayta yuborish:{' '}
                      <strong className="text-[#002D96] dark:text-sky-400">{timer}s</strong>
                    </>
                  ) : (
                    'Kod muddati tugadi'
                  )}
                </span>
                <button
                  type="button"
                  disabled={!canResend}
                  onClick={sendRealOtp}
                  className={cn(
                    'flex items-center gap-1 font-bold transition-colors',
                    canResend
                      ? 'text-[#1D6FF2] hover:underline dark:text-sky-400'
                      : 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Kodni qayta yuborish
                </button>
              </div>
            </div>
          )}

          {/* 3. DETAILS (ANKETA — KURS 1-6 MAYDONI BILAN) */}
          {step === 'details' && (
            <form onSubmit={handleSaveDetails} className="space-y-3">
              <div className="flex flex-col items-center pb-1">
                <label className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#1D6FF2]/40 bg-slate-50 dark:bg-slate-800">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-[#002D96] dark:group-hover:text-sky-300">
                      <Camera className="h-5 w-5" />
                      <span className="mt-0.5 text-[9.5px] font-bold">Rasm</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <span className="mt-1 text-[10.5px] text-slate-400">Profil rasmi (ixtiyoriy)</span>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <User className="h-4 w-4 text-slate-400" />
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ismingiz"
                  className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <User className="h-4 w-4 text-slate-400" />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Familiyangiz"
                  className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <select
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setUniversity('');
                    setCustomInstitution('');
                  }}
                  className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                >
                  <option value="">Viloyatingizni tanlang</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <UniversitySelect
                universities={filteredSortedUniversities}
                value={university}
                onChange={(val) => {
                  setUniversity(val);
                  if (val !== 'Boshqa') setCustomInstitution('');
                }}
                placeholder={
                  region ? 'Ta’lim muassasangizni qidiring yoki tanlang' : 'Avval viloyatingizni tanlang'
                }
                otherLabel="Boshqa"
              />

              {university === 'Boshqa' && (
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#002D96] dark:text-sky-300">
                    Ta’lim muassasangiz
                  </label>
                  <div className="flex items-center gap-2.5 rounded-2xl border border-[#1D6FF2]/40 bg-[#1D6FF2]/[0.04] px-3.5 py-2.5 dark:bg-sky-500/10">
                    <Building2 className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
                    <input
                      value={customInstitution}
                      onChange={(e) => setCustomInstitution(e.target.value)}
                      placeholder="Ta’lim muassasangiz"
                      className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* KURS MAYDONI (1 - 6 DROPDOWN) */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" />
                <select
                  required
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                >
                  <option value="">Kursingizni tanlang (1–6)</option>
                  {COURSE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}-kurs
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Tug‘ilgan sana (Kun / Oy / Yil)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[12.5px] font-semibold text-[#08123A] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Kun</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[12.5px] font-semibold text-[#08123A] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Oy</option>
                    <option value="01">Yanvar</option>
                    <option value="02">Fevral</option>
                    <option value="03">Mart</option>
                    <option value="04">Aprel</option>
                    <option value="05">May</option>
                    <option value="06">Iyun</option>
                    <option value="07">Iyul</option>
                    <option value="08">Avgust</option>
                    <option value="09">Sentabr</option>
                    <option value="10">Oktabr</option>
                    <option value="11">Noyabr</option>
                    <option value="12">Dekabr</option>
                  </select>

                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[12.5px] font-semibold text-[#08123A] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Yil</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={cn(
                    'rounded-xl border py-2 text-[12.5px] font-bold transition-colors',
                    gender === 'male'
                      ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  O‘g‘il bola
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={cn(
                    'rounded-xl border py-2 text-[12.5px] font-bold transition-colors',
                    gender === 'female'
                      ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  Qiz bola
                </button>
              </div>

              <div
                className={cn(
                  'flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 dark:border-slate-700',
                  method === 'phone'
                    ? 'border-slate-200 bg-slate-100 dark:bg-slate-800/60'
                    : 'border-slate-200 bg-white dark:bg-slate-800'
                )}
              >
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-[13px] font-bold text-[#002D96] dark:text-sky-400">
                  +998
                </span>
                <input
                  value={method === 'phone' ? formatUzPhone(phone) : extraPhone}
                  readOnly={method === 'phone'}
                  onChange={(e) => setExtraPhone(formatUzPhone(e.target.value))}
                  inputMode="numeric"
                  placeholder="99 999 99 99"
                  className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                />
              </div>

              {error && <p className="text-[11.5px] font-semibold text-rose-500">{error}</p>}

              <Button
                type="submit"
                disabled={busy}
                className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-md"
              >
                {busy ? 'Saqlanmoqda...' : 'Ro‘yxatdan o‘tishni yakunlash'}
              </Button>
            </form>
          )}

          {/* 4. PAROLNI TIKLASH */}
          {step === 'forgot' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('email');
                    setForgotStep('input');
                    resetMessages();
                  }}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-[12px] font-bold',
                    method === 'email'
                      ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('phone');
                    setForgotStep('input');
                    resetMessages();
                  }}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-[12px] font-bold',
                    method === 'phone'
                      ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Telefon raqam
                </button>
              </div>

              {forgotStep === 'input' ? (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  {method === 'email' ? (
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full bg-transparent text-[13.5px] font-semibold text-[#08123A] outline-none dark:text-white"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                      <span className="text-[13.5px] font-bold text-[#002D96] dark:text-sky-400">
                        +998
                      </span>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                        inputMode="numeric"
                        placeholder="99 999 99 99"
                        className="w-full bg-transparent text-[13.5px] font-semibold text-[#08123A] outline-none dark:text-white"
                      />
                    </div>
                  )}

                  {error && <p className="text-[11.5px] font-semibold text-rose-500">{error}</p>}
                  {info && (
                    <p className="text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {info}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={busy}
                    className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white"
                  >
                    {busy ? 'Yuborilmoqda...' : 'Tasdiqlash kodini olish'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleCompletePasswordReset} className="space-y-3">
                  {method === 'phone' && tgDeepLink && (
                    <a
                      href={tgDeepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0088CC] text-[12px] font-extrabold text-white"
                    >
                      <Send className="h-3.5 w-3.5" />
                      @{tgBotUsername} botdan kodni olish
                    </a>
                  )}

                  <input
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    placeholder="6 xonali kod"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 text-center text-[18px] font-extrabold tracking-[0.3em] text-[#002D96] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300"
                  />

                  <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                    <Lock className="h-4 w-4 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      placeholder="Yangi parol (min. 6 ta belgi)"
                      className="w-full bg-transparent text-[13.5px] font-semibold text-[#08123A] outline-none dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="text-slate-400 hover:text-[#002D96] dark:hover:text-sky-300"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {error && <p className="text-[11.5px] font-semibold text-rose-500">{error}</p>}
                  {info && (
                    <p className="text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {info}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={busy}
                    className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white"
                  >
                    {busy ? 'Saqlanmoqda...' : 'Yangi parolni saqlash'}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}