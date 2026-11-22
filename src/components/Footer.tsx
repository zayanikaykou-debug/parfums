import { Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function Footer() {
  const { settings, navigate, language, t } = useStore();

  const whatsappUrl = `https://wa.me/${(settings.contact_whatsapp || '').replace(/[^0-9]/g, '')}`;

  return (
    <footer className="bg-[#050914] border-t border-[#D4AF6E]/15 text-[#F7F4EE]/80">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#D4AF6E]/12">
          {/* Brand column */}
          <div className="md:col-span-5 space-y-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="font-serif text-2xl font-semibold tracking-[0.16em] text-[#F7F4EE] cursor-pointer"
            >
              {settings.logo_text || 'ZEPHOR PARFUMS'}
            </button>
            <p className="font-serif italic text-lg text-[#E8CFA0]">
              {language === 'ar' ? t.hero.tagline : settings.hero_tagline}
            </p>
            <p className="text-sm text-[#F7F4EE]/60 max-w-sm leading-relaxed">
              {t.footer.taglineDesc}
            </p>
          </div>

          {/* Navigation links */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#D4AF6E]">
              {t.footer.maison}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="hover:text-[#E8CFA0] transition-colors cursor-pointer"
                >
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/boutique')}
                  className="hover:text-[#E8CFA0] transition-colors cursor-pointer"
                >
                  {t.nav.boutique}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/boutique?category=collections-exclusives')}
                  className="hover:text-[#E8CFA0] transition-colors cursor-pointer"
                >
                  {t.footer.exclusiveCollections}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/boutique?category=coffrets-cadeaux')}
                  className="hover:text-[#E8CFA0] transition-colors cursor-pointer"
                >
                  {t.footer.giftSets}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/contact')}
                  className="hover:text-[#E8CFA0] transition-colors cursor-pointer"
                >
                  {t.footer.conciergeContact}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact details */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#D4AF6E]">
              {t.footer.concierge}
            </h3>
            <ul className="space-y-2.5 text-sm text-[#F7F4EE]/70">
              {settings.contact_phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#D4AF6E] shrink-0" strokeWidth={1.5} />
                  <a
                    href={`tel:${settings.contact_phone.replace(/\s+/g, '')}`}
                    dir="ltr"
                    className="hover:text-[#E8CFA0] transition-colors"
                  >
                    {settings.contact_phone}
                  </a>
                </li>
              )}
              {settings.contact_email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#D4AF6E] shrink-0" strokeWidth={1.5} />
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="hover:text-[#E8CFA0] transition-colors"
                  >
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.contact_address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D4AF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span>{settings.contact_address}</span>
                </li>
              )}
            </ul>

            <div className="flex items-center gap-3 pt-2">
              {settings.contact_whatsapp && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp Zephor Parfums"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg border border-[#D4AF6E]/25 bg-[#0B1325] hover:border-[#D4AF6E] hover:text-[#E8CFA0] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#D4AF6E]" />
                  <span>WhatsApp</span>
                </a>
              )}
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="p-2 rounded-lg border border-[#D4AF6E]/25 bg-[#0B1325] hover:border-[#D4AF6E] hover:text-[#E8CFA0] transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="px-3 py-2 text-xs rounded-lg border border-[#D4AF6E]/25 bg-[#0B1325] hover:border-[#D4AF6E] hover:text-[#E8CFA0] transition-colors"
                >
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F7F4EE]/45">
          <p>{settings.footer_copyright || '© 2026 Zephor Parfums. Tous droits réservés.'}</p>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="hover:text-[#D4AF6E] transition-colors cursor-pointer"
          >
            {t.footer.adminLink}
          </button>
        </div>
      </div>
    </footer>
  );
}
