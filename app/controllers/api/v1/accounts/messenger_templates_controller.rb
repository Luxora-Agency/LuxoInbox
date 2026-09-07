class Api::V1::Accounts::MessengerTemplatesController < Api::V1::Accounts::BaseController
  before_action :authorize_templates
  before_action :fetch_template, only: [:show, :update, :destroy]

  def index
    render json: Current.account.messenger_templates.order(:title, :id).map { |template| template_payload(template) }
  end

  # Static allowlist shared with the dashboard so the variable picker never drifts
  # from the validation. Account custom attributes are merged client side.
  def variables
    render json: MessengerTemplates::Variables.catalog
  end

  def show
    render json: template_payload(@template)
  end

  def create
    template = Current.account.messenger_templates.create!(template_params)
    render json: template_payload(template), status: :created
  end

  def update
    @template.update!(template_params)
    render json: template_payload(@template)
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

    attributes = input.permit(:title).to_h
    # Preserve malformed JSON types so model validation rejects them on updates too.
    attributes[:definition] = input[:definition].as_json if input.key?(:definition)
    attributes
  end

  def template_payload(template)
    template.as_json(only: [:id, :title, :definition, :updated_at])
  end
end
