class Api::V1::Accounts::EvolutionController < Api::V1::Accounts::BaseController
  before_action :check_authorization

  def create_instance
    response = evolution_client.create_instance(
      instance_name: params[:instance_name],
      webhook_url: webhook_url
    )
    render json: response
  rescue StandardError => e
    # If instance already exists, try to connect and return the QR code
    if e.message.to_s.match?(/already|exist|conflict/i)
      connect_existing_instance
    else
      Rails.logger.error("Evolution create_instance failed: #{e.message}")
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def connect
    response = evolution_client.get_qr_code(params[:instance_name])
    render json: response
  rescue StandardError => e
    Rails.logger.error("Evolution connect failed for #{params[:instance_name]}: #{e.message}")
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def connection_state
    response = evolution_client.connection_state(params[:instance_name])
    render json: response
  rescue StandardError => e
    Rails.logger.error("Evolution connection_state failed for #{params[:instance_name]}: #{e.message}")
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def delete_instance
    response = evolution_client.delete_instance(params[:instance_name])
    render json: response
  rescue StandardError => e
    Rails.logger.error("Evolution delete_instance failed for #{params[:instance_name]}: #{e.message}")
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def connect_existing_instance
    response = evolution_client.get_qr_code(params[:instance_name])
    render json: response
  rescue StandardError => e
    Rails.logger.error("Evolution connect after create conflict failed: #{e.message}")
    render json: { error: e.message }, status: :unprocessable_entity
  end

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
