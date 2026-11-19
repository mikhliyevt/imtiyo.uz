import { Link } from 'react-router-dom';
import AppShell from '@/components/AppShell';

export default function PageNotFound() {
  return (
    <AppShell breadcrumbs={[{ label: 'Sahifa topilmadi' }]}>
      <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center py-12 text-center">
        <p className="text-7xl font-black text-slate-200 dark:text-slate-800">404</p>
        <h1 className="mt-3 text-2xl font-extrabold text-[#08123A] dark:text-white">
          Sahifa topilmadi
        </h1>
        <p className="mt-2 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
          Kechirasiz, siz izlayotgan sahifa mavjud emas yoki o‘chirilgan bo‘lishi mumkin.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-6 text-[13px] font-extrabold text-white shadow-md transition-transform hover:scale-[1.02]"
        >
          Bosh sahifaga o‘tish
        </Link>
      </div>
    </AppShell>
  );
}
