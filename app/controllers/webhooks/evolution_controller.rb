class Webhooks::EvolutionController < ActionController::API
  def process_payload
    Rails.logger.info("Evolution webhook received: #{params.to_unsafe_hash}")

    Webhooks::EvolutionEventsJob.perform_later(params.to_unsafe_hash.merge(account_id: params[:account_id]))
    head :ok
  rescue StandardError => e
    Rails.logger.error("Evolution webhook error: #{e.message}")
    ChatwootExceptionTracker.new(e).capture_exception
    head :ok
  end
end
