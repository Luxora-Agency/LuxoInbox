class Api::V1::Accounts::EvolutionController < Api::V1::Accounts::BaseController
  before_action :check_authorization

  def create_instance
    response = evolution_client.create_instance(
      instance_name: params[:instance_name],
      webhook_url: webhook_url
    )
    render json: response
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def connect
    response = evolution_client.get_qr_code(params[:instance_name])
    render json: response
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def connection_state
    response = evolution_client.connection_state(params[:instance_name])
    render json: response
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def delete_instance
    response = evolution_client.delete_instance(params[:instance_name])
    render json: response
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def evolution_client
    @evolution_client ||= Evolution::ApiClient.new
  end

  def webhook_url
    "#{ENV.fetch('FRONTEND_URL', request.base_url)}/webhooks/evolution/#{Current.account.id}"
  end

  def check_authorization
    authorize :inbox, :create?
  end
end
