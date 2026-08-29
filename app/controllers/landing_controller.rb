class LandingController < ActionController::Base
  include SwitchLocale
  include PortalHomeData

  CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P'.freeze

  HERO_VIDEO = "#{CDN}/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4".freeze
  ABOUT_VIDEO = "#{CDN}/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4".freeze
  CTA_VIDEO = "#{CDN}/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4".freeze

  CURRENCY = 'COP'.freeze

  # The price of every plan lives here and only here: the browser posts a plan id,
  # never an amount, so a tampered client cannot buy a plan for one peso.
  PLANS = [
    {
      id: 'emprendedor', name: 'EMPRENDEDOR', agents: 3, price_in_cents: 8_990_000,
      video: "#{CDN}/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4"
    },
    {
      id: 'crecimiento', name: 'CRECIMIENTO', agents: 10, price_in_cents: 18_990_000,
      video: "#{CDN}/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4"
    },
    {
      id: 'empresarial', name: 'EMPRESARIAL', agents: 25, price_in_cents: 38_990_000,
      video: "#{CDN}/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4"
    }
  ].freeze

  # The marketing page is public and stateless. It carries no session-bound form, so the
  # Wompi session endpoint is posted to by an anonymous visitor without a CSRF token.
  skip_forgery_protection

  layout false

  # A help center portal on its own domain answers at "/" too. Root used to be
  # DashboardController#index, which rendered the portal there; the marketing
  # page only owns "/" on the installation's own domain.
  around_action :switch_locale, only: [:index]
  before_action :render_help_center_if_custom_domain, only: [:index]

  def index
    @plans = PLANS
    # Wompi's public key is safe to ship to the browser; landing.js uses its prefix to pick
    # the sandbox or production API when resolving the transaction Wompi redirects back with.
    @wompi_public_key = ENV.fetch('WOMPI_PUBLIC_KEY', '')
  end

  def wompi_session
    plan = PLANS.find { |candidate| candidate[:id] == params[:plan_id] }
    return render json: { error: 'Plan no encontrado' }, status: :not_found if plan.nil?

    public_key = ENV.fetch('WOMPI_PUBLIC_KEY', '').presence
    integrity_secret = ENV.fetch('WOMPI_INTEGRITY_SECRET', '').presence
    return render json: { error: 'Wompi no está configurado' }, status: :service_unavailable if integrity_secret.nil? || public_key.nil?

    reference = "LUXOINBOX-#{plan[:id]}-#{Time.now.to_i}-#{SecureRandom.hex(3)}"
    amount_in_cents = plan[:price_in_cents]

    render json: {
      public_key: public_key,
      reference: reference,
      amount_in_cents: amount_in_cents,
      currency: CURRENCY,
      signature: Digest::SHA256.hexdigest("#{reference}#{amount_in_cents}#{CURRENCY}#{integrity_secret}"),
      redirect_url: root_url
    }
  end

  private

  def render_help_center_if_custom_domain
    return if request.host == URI.parse(ENV.fetch('FRONTEND_URL', '')).host

    @portal = Portal.find_by(custom_domain: request.host)
    return if @portal.nil?

    @locale = @portal.default_locale
    request.variant = :documentation if @portal.layout == 'documentation'
    load_home_data
    render 'public/api/v1/portals/show', layout: 'portal', portal: @portal
  end
end
