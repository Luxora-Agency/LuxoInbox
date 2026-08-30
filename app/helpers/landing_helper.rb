module LandingHelper
  # Inlined glyphs: the lucide marks the standalone site used (mail, chevron-right, menu, x/close)
  # plus the two brand marks lucide dropped upstream. Sized from landing.css.
  ICONS = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' \
          'stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/>' \
          '<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 ' \
       '11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 ' \
       '4.126H5.117L17.083 19.77Z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02' \
            'c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 ' \
            '2.81 1.3 3.5.99.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 ' \
            '1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 ' \
            '4.61-2.8 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12 12 0 0 0 12 .5Z"/></svg>',
    chevron_right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' \
                   'stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' \
          'stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' \
           'stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
  }.freeze

  SOCIAL_LINKS = [
    { label: 'Escríbenos por correo', href: 'mailto:hola@luxoinbox.com', icon: :mail },
    { label: 'LuxoInbox en X', href: 'https://x.com', icon: :x },
    { label: 'LuxoInbox en GitHub', href: 'https://github.com', icon: :github }
  ].freeze

  def landing_icon(name)
    # The SVG markup is a developer-authored constant, never user input.
    # rubocop:disable Rails/OutputSafety
    ICONS.fetch(name).html_safe
    # rubocop:enable Rails/OutputSafety
  end

  def landing_social_links
    SOCIAL_LINKS
  end

  def format_cop(price_in_cents)
    "$ #{(price_in_cents / 100).to_s.reverse.scan(/\d{1,3}/).join('.').reverse} COP"
  end
end
