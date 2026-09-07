class Api::V1::Accounts::MessengerTemplatesController < Api::V1::Accounts::BaseController
  before_action :authorize_templates
  before_action :fetch_template, only: [:show, :update, :destroy]

  def index
    # Seeding here keeps every account, new or existing, one visit away from the default
    # script without a data migration and without touching the Account lifecycle.
    MessengerTemplates::EnsureDefaultService.new(Current.account).perform
    render json: Current.account.messenger_templates.default_first.map { |template| template_payload(template) }
  end

  # Recreates the default script when it was deleted, and resets it when it was edited.
  def restore_default
    render json: template_payload(MessengerTemplates::EnsureDefaultService.restore!(Current.account))
  end

  # Static allowlist shared with the dashboard so the variable picker never drifts
  # from the validation. Account custom attributes are merged client side.
  def variables
    render json: MessengerTemplates::Variables.catalog
  end

  def show
    render json: template_payload(@template)
  end

  # `rescue_from` handlers run after the locale around_actions unwind, so a failed save
  # would name the attribute in the default language next to a message translated for
  # the account. Rescuing inside the action keeps the whole message in the request locale.
  def create
    template = Current.account.messenger_templates.create!(template_params)
    render json: template_payload(template), status: :created
  rescue ActiveRecord::RecordInvalid => e
    render_record_invalid(e)
  end

  def update
    @template.update!(template_params)
    render json: template_payload(@template)
  rescue ActiveRecord::RecordInvalid => e
    render_record_invalid(e)
  end

  def destroy
    @template.destroy!
    head :no_content
  end

  private

  def authorize_templates
    authorize :messenger_template, "#{policy_action}?"
    response.headers['Cache-Control'] = 'no-store'
  end

  # Reading the registry is a read of the library itself, so it reuses the index rule.
  def policy_action
    action_name == 'variables' ? 'index' : action_name
  end

  def fetch_template
    @template = Current.account.messenger_templates.find(params[:id])
  end

  def template_params
    input = params.require(:messenger_template)
    raise ActionController::ParameterMissing, :messenger_template unless input.is_a?(ActionController::Parameters)
    raise ActionController::ParameterMissing, :title if input.key?(:title) && !input[:title].is_a?(String)

    # `is_default` is deliberately absent: only the seeding service marks a row default.
    attributes = input.permit(:title).to_h
    # Preserve malformed JSON types so model validation rejects them on updates too.
    attributes[:definition] = input[:definition].as_json if input.key?(:definition)
    attributes
  end

  def template_payload(template)
    template.as_json(only: [:id, :title, :definition, :updated_at, :is_default])
  end
end
