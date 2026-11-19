import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function SettingsTile({ icon: Icon, title, hint, children, className }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex min-h-[112px] flex-col justify-between gap-3 rounded-[24px] border border-white/70 bg-white/75 p-4 text-left shadow-[0_18px_40px_-30px_rgba(0,45,150,0.7)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white',
          className
        )}
      >
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#002D96] to-[#1D6FF2] text-white shadow-[0_10px_22px_-12px_rgba(0,45,150,0.9)]">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-extrabold leading-tight text-[#08123A]">
            {title}
          </span>
          <span className="mt-0.5 block truncate text-[10.5px] font-medium text-slate-500">{hint}</span>
        </span>
      </button>

      <DialogContent className="max-w-md overflow-hidden rounded-[26px] border-white/70 bg-white/90 backdrop-blur-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-[16px] font-extrabold text-[#08123A]">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 max-h-[65vh] overflow-y-auto pr-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}