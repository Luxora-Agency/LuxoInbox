class Api::V1::Accounts::Conversations::MessengerScreenshotsController < Api::V1::Accounts::Conversations::BaseController
  PAGE_SIZE = 50

  def show
    authorize :messenger_simulator, :show?
    response.headers['Cache-Control'] = 'no-store'
    return head :no_content if params[:authorize_only] == 'true'

    after_id, snapshot_id = validated_cursors
    messages = message_page(after_id, snapshot_id)
    has_more = messages.length > PAGE_SIZE
    messages = messages.first(PAGE_SIZE)
    next_cursor = has_more ? messages.last.id : nil
    # Message stores content_attributes through a JSON coder; use its decoded accessor.
    messages.reject! { |message| ActiveModel::Type::Boolean.new.cast(message.deleted) }
    render json: {
      contact: after_id.zero? ? contact_payload : nil,
      messages: messages.map { |message| MessengerScreenshot::MessagePresenter.new(message).as_json },
      snapshot_max_id: snapshot_id,
      next_cursor: next_cursor
    }
  end

  private

  def validated_cursors
    after_id = cursor_value(:after, 0)
    snapshot_id = cursor_value(:snapshot_max_id, @conversation.messages.maximum(:id) || 0)
    if after_id > snapshot_id || (after_id.positive? && !params.key?(:snapshot_max_id))
      raise ActionController::BadRequest, 'Invalid screenshot cursor'
    end
    [after_id, snapshot_id].select(&:positive?).each do |id|
      raise ActionController::BadRequest, 'Invalid screenshot cursor' unless @conversation.messages.exists?(id: id)
    end
    [after_id, snapshot_id]
  end

  def message_page(after_id, snapshot_id)
    @conversation.messages.where(private: false, message_type: [:incoming, :outgoing, :template])
                 .where('id > ? AND id <= ?', after_id, snapshot_id)
                 .reorder(id: :asc).includes(:attachments).limit(PAGE_SIZE + 1).to_a
  end

  def cursor_value(key, default)
    return default unless params.key?(key)

    value = params[key].to_s
    raise ActionController::BadRequest, 'Invalid screenshot cursor' unless value.match?(/\A\d{1,18}\z/)

    value.to_i
  end

  def contact_payload
    contact = @conversation.contact
    avatar = contact.avatar
    avatar_data = nil
    if avatar.attached? && avatar.byte_size <= 2.megabytes && %w[image/png image/jpeg image/webp].include?(avatar.content_type)
      avatar_data = "data:#{avatar.content_type};base64,#{Base64.strict_encode64(avatar.download)}"
    end
    { name: contact.name, avatar_data: avatar_data }
  end
end
