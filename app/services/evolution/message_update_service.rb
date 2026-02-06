class Evolution::MessageUpdateService
  pattr_initialize [:inbox!, :params!]

  def perform
    return unless update_data

    process_status_update
  end

  private

  def update_data
    @update_data ||= params[:data] || params
  end

  def message_id
    update_data.dig(:key, :id) || update_data[:id]
  end

  def process_status_update
    return unless message_id

    message = find_message
    return unless message

    status = update_data[:status] || update_data.dig(:update, :status)
    update_message_status(message, status) if status
  end

  def find_message
    inbox.messages.find_by(source_id: message_id)
  end

  def update_message_status(message, status)
    case status.to_s.downcase
    when 'sent', 'server_ack'
      message.update(status: :sent)
    when 'delivered', 'delivery_ack'
      message.update(status: :delivered)
    when 'read'
      message.update(status: :read)
    when 'failed', 'error'
      message.update(status: :failed)
    end
  end
end
