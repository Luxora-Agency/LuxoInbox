class MessengerScreenshot::ContactPresenter
  def initialize(contact)
    @contact = contact
  end

  def as_json
    { name: @contact.name, phone: @contact.phone_number, avatar_data: avatar_data }
  end

  private

  def avatar_data
    avatar = @contact.avatar
    return unless avatar.attached? && avatar.byte_size <= 2.megabytes && %w[image/png image/jpeg image/webp].include?(avatar.content_type)

    "data:#{avatar.content_type};base64,#{Base64.strict_encode64(avatar.download)}"
  end
end
