class Webhooks::EvolutionEventsJob < ApplicationJob
  queue_as :low

  def perform(params = {})
    return unless params[:account_id]

    @params = params.with_indifferent_access
    @account = Account.find_by(id: params[:account_id])
    return unless @account

    process_event
  rescue StandardError => e
    Rails.logger.error("Evolution event processing error: #{e.message}")
    ChatwootExceptionTracker.new(e).capture_exception
  end

  private

  def process_event
    event_type = @params[:event]

    case event_type
    when 'messages.upsert', 'MESSAGES_UPSERT'
      process_incoming_message
    when 'messages.update', 'MESSAGES_UPDATE'
      process_message_update
    when 'connection.update', 'CONNECTION_UPDATE'
      process_connection_update
    when 'qrcode.updated', 'QRCODE_UPDATED'
      # QR code updated, handled by frontend polling
      Rails.logger.info("Evolution QR code updated for instance: #{@params[:instance]}")
    else
      Rails.logger.info("Evolution unhandled event type: #{event_type}")
    end
  end

  def process_incoming_message
    return unless @params[:data]

    inbox = find_inbox
    return unless inbox

    Evolution::IncomingMessageService.new(inbox: inbox, params: @params).perform
  end

  def process_message_update
    return unless @params[:data]

    inbox = find_inbox
    return unless inbox

    Evolution::MessageUpdateService.new(inbox: inbox, params: @params).perform
  end

  def process_connection_update
    Rails.logger.info("Evolution connection update: #{@params[:data]}")
    # Handle connection status changes if needed
  end

  def find_inbox
    instance_name = @params[:instance] || @params.dig(:data, :instance)
    return unless instance_name

    find_inbox_by_instance(instance_name)
  end

  def find_inbox_by_instance(instance_name)
    # Inbox#channel is polymorphic, so it can only be filtered through the
    # inboxes.channel_type column — joining the association raises.
    @account.inboxes.includes(:channel).where(channel_type: 'Channel::Api').find_each do |inbox|
      return inbox if inbox.channel.additional_attributes&.dig('evolution_instance') == instance_name
    end
    nil
  end
end
