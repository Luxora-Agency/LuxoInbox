class MessengerScreenshot::ContactPresenter
  def initialize(contact)
    @contact = contact
  end

  # Exposes exactly the fields MessengerTemplates::Variables can substitute, so a template
  # exported from a conversation resolves the same tokens the editor offered.
  def as_json
    {
      name: @contact.name.to_s, first_name: first_name, last_name: last_name,
      email: @contact.email.to_s, phone: phone, phone_number: phone,
      identifier: @contact.identifier.to_s, country_code: @contact.country_code.to_s,
      city: additional_attribute('city'), company_name: additional_attribute('company_name'),
      custom_attribute: @contact.custom_attributes.to_h, avatar_data: avatar_data
    }
  end

  private

  def phone
    @contact.phone_number.to_s
  end

  def first_name
    @contact.name.to_s.split.first.to_s
  end

  def last_name
    return @contact.last_name.to_s if @contact.last_name.present?

    parts = @contact.name.to_s.split
    parts.length > 1 ? parts[1..].join(' ') : ''
  end

  def additional_attribute(key)
    @contact.additional_attributes.to_h[key].to_s
  end

  def avatar_data
    avatar = @contact.avatar
    return unless avatar.attached? && avatar.byte_size <= 2.megabytes && %w[image/png image/jpeg image/webp].include?(avatar.content_type)

    "data:#{avatar.content_type};base64,#{Base64.strict_encode64(avatar.download)}"
  end
end
