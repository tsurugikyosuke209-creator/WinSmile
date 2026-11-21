import {useState} from 'react';
import {
  Check,
  Copy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
} from 'lucide-react';
import {sanitizeWhatsappNumber} from '../data/wilayas';
import type {StoreSettings} from '../types/store';

interface ContactSectionProps {
  settings: StoreSettings;
}

export function ContactSection({settings}: ContactSectionProps) {
  const [copiedRip, setCopiedRip] = useState(false);

  const handleCopyRip = async () => {
    try {
      await navigator.clipboard.writeText(settings.baridiMobRip);
      setCopiedRip(true);
      setTimeout(() => setCopiedRip(false), 2000);
    } catch {
      setCopiedRip(false);
    }
  };

  return (
    <section
      id="contact"
      className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 border-t border-[#E5DDD0]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-4">
          <p className="text-xs font-semibold text-[#7A5C3E]">
            الدعم وخدمة الأولياء
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#231F1B]">
            تواصل معنا مباشرة
          </h2>
          <p className="text-base text-[#5A5248] leading-relaxed">
            فريقنا في {settings.storeName} يرافقكم لاختيار الألعاب والباقات المناسبة
            لمرحلة طفلكم العمرية مع ضمان التوصيل الآمن إلى جميع ولايات الجزائر الـ 58.
          </p>

          <div className="pt-2 space-y-2.5 text-sm text-[#3D362E]">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#4A5D3F] shrink-0" aria-hidden="true" />
              <span>{settings.locationCoverage}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#4A5D3F] shrink-0" aria-hidden="true" />
              <a
                href={`mailto:${settings.email}`}
                className="hover:text-[#4A5D3F] transition-colors"
                dir="ltr"
              >
                {settings.email}
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E5DDD0] rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Direct Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <a
              href={`https://wa.me/${sanitizeWhatsappNumber(settings.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#4A5D3F] hover:bg-[#3B4B32] text-white text-sm font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>مراسلة عبر واتساب</span>
            </a>

            <a
              href={`tel:${settings.phone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#F2EDE4] hover:bg-[#E7DFD2] text-[#231F1B] text-sm font-bold transition-colors"
            >
              <Phone className="w-4 h-4 text-[#4A5D3F] shrink-0" aria-hidden="true" />
              <span dir="ltr" className="tabular-nums">
                {settings.phone}
              </span>
            </a>
          </div>

          {/* BaridiMob RIP Quick Info */}
          <div className="bg-[#FAF8F4] border border-[#E5DDD0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="block text-xs text-[#6B6257]">
                حساب بريدي موب للدفع الإلكتروني (RIP):
              </span>
              <code
                dir="ltr"
                className="block text-sm font-bold text-[#231F1B] tabular-nums"
              >
                {settings.baridiMobRip}
              </code>
            </div>
            <button
              type="button"
              onClick={handleCopyRip}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#DCD3C4] hover:bg-[#F2EDE4] text-xs font-semibold text-[#231F1B] transition-colors cursor-pointer"
            >
              {copiedRip ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2F5E3D]" aria-hidden="true" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#4A5D3F]" aria-hidden="true" />
                  <span>نسخ RIP</span>
                </>
              )}
            </button>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#F0EAE0]">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B6257]">
              <Share2 className="w-4 h-4 text-[#4A5D3F]" aria-hidden="true" />
              <span>تابعونا على شبكات التواصل:</span>
            </span>

            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3D362E] hover:text-[#4A5D3F] underline underline-offset-4"
                >
                  إنستغرام
                </a>
              )}
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3D362E] hover:text-[#4A5D3F] underline underline-offset-4"
                >
                  فيسبوك
                </a>
              )}
              {settings.tiktokUrl && (
                <a
                  href={settings.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3D362E] hover:text-[#4A5D3F] underline underline-offset-4"
                >
                  تيك توك
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
