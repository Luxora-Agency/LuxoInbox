# The script every account starts with: a lead capture flow seeded on the first visit to
# the library and restorable from here after it is edited or deleted. The definition is
# the v1 jsonb contract, string keyed and deep frozen, so a stored record can be compared
# with it without any normalisation.
module MessengerTemplates::DefaultTemplate
  TITLE_KEY = 'messenger_templates.default.title'.freeze
  BUSINESS_NAME = 'Ana Suárez'.freeze
  # One bubble with paragraphs: the preview renders text with `whitespace-pre-wrap`.
  GREETING = [
    'Has sido recibido/a en el espacio sagrado de la Maestra Ana Suárez, quien personalmente atenderá tu consulta.',
    'Antes de comenzar, compárteme con confianza:',
    '• ¿Qué te trae hoy: amor ❤️, amarre ❤️ retorno ❤️ o recuperar ❤️ ?'
  ].join("\n\n").freeze
  ASK_PHONE = 'Ok, si deseas apartar una consulta con Ana, para resolver tu situación, déjame por favor tu numero de Whatsapp'.freeze

  DEFINITION = {
    'version' => 1,
    'business_name' => BUSINESS_NAME,
    'avatar' => 'contact',
    'messages' => [
      { 'sender' => 'outgoing', 'time' => '', 'text' => GREETING }.freeze,
      { 'sender' => 'incoming', 'time' => '', 'text' => 'Mi esposa estoy triste con ella quiero su amor' }.freeze,
      { 'sender' => 'outgoing', 'time' => '', 'text' => ASK_PHONE }.freeze,
      { 'sender' => 'incoming', 'time' => '06:00 AM', 'text' => '{{contact.phone}}' }.freeze,
      { 'sender' => 'outgoing', 'time' => '', 'text' => 'Ok, gracias ya se comunica contigo Ana' }.freeze
    ].freeze
  }.freeze

  module_function

  # Localised against the account, never the request: the row keeps one name whoever lists
  # or restores the library, so a restore can never rename it to the caller's language.
  def title(locale = I18n.locale)
    I18n.t(TITLE_KEY, locale: locale)
  end

  def definition
    DEFINITION
  end
end
