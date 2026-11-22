import { Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function ContactPage() {
  const { settings, t } = useStore();
  const whatsappUrl = `https://wa.me/${(settings.contact_whatsapp || '').replace(/[^0-9]/g, '')}`;

  return (
    <main className="min-h-screen bg-[#060B17] pt-32 pb-24">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8">
        <div className="max-w-2xl pb-12 border-b border-[#D4AF6E]/15">
          <p className="text-xs tracking-[0.24em] uppercase text-[#D4AF6E]">
            {t.contact.eyebrow}
          </p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-medium text-[#F7F4EE]">
            {t.contact.title}
          </h1>
          <p className="mt-4 text-base text-[#F7F4EE]/70 leading-relaxed">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl liquid-glass space-y-6">
            <h2 className="font-serif text-2xl text-[#F7F4EE]">{t.contact.directLine}</h2>

            <div className="space-y-5 text-sm">
              {settings.contact_phone && (
                <div className="flex items-start gap-3.5">
                  <Phone className="w-5 h-5 text-[#D4AF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#F7F4EE]/55">
                      {t.contact.phone}
                    </p>
                    <a
                      href={`tel:${settings.contact_phone.replace(/\s+/g, '')}`}
                      dir="ltr"
                      className="text-base font-medium text-[#F7F4EE] hover:text-[#E8CFA0] inline-block"
                    >
                      {settings.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {settings.contact_email && (
                <div className="flex items-start gap-3.5">
                  <Mail className="w-5 h-5 text-[#D4AF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#F7F4EE]/55">
                      {t.contact.email}
                    </p>
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="text-base font-medium text-[#F7F4EE] hover:text-[#E8CFA0]"
                    >
                      {settings.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {settings.contact_address && (
                <div className="flex items-start gap-3.5">
                  <MapPin className="w-5 h-5 text-[#D4AF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#F7F4EE]/55">
                      {t.contact.salon}
                    </p>
                    <p className="text-base text-[#F7F4EE]">{settings.contact_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 rounded-2xl liquid-glass-card flex flex-col justify-between space-y-8">
            <div className="space-y-3">
              <h2 className="font-serif text-2xl text-[#F7F4EE]">
                {t.contact.socialTitle}
              </h2>
              <p className="text-sm text-[#F7F4EE]/65 leading-relaxed">
                {t.contact.socialSub}
              </p>
            </div>

            <div className="space-y-3">
              {settings.contact_whatsapp && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold rounded-lg btn-gold-luxury"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t.contact.whatsappBtn}</span>
                </a>
              )}

              <div className="grid grid-cols-2 gap-3">
                {settings.social_instagram && (
                  <a
                    href={settings.social_instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium rounded-lg liquid-glass-subtle text-[#F7F4EE] hover:border-[#D4AF6E] hover:text-[#E8CFA0] transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-[#D4AF6E]" />
                    <span>Instagram</span>
                  </a>
                )}
                {settings.social_facebook && (
                  <a
                    href={settings.social_facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium rounded-lg liquid-glass-subtle text-[#F7F4EE] hover:border-[#D4AF6E] hover:text-[#E8CFA0] transition-colors"
                  >
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
