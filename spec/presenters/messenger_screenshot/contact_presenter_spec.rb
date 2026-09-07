require 'rails_helper'

RSpec.describe MessengerScreenshot::ContactPresenter do
  let(:contact) { create(:contact) }

  it 'exposes every standard field the variable registry can substitute' do
    contact.update!(name: 'Taylor Reed', email: 'taylor@example.com', phone_number: '+15551234567', identifier: 'CU-10482',
                    custom_attributes: { 'plan' => 'gold' },
                    additional_attributes: { 'city' => 'Austin', 'company_name' => 'Acme Inc.', 'country' => 'US' })
    expect(described_class.new(contact).as_json).to eq(
      name: 'Taylor Reed', first_name: 'Taylor', last_name: 'Reed', email: 'taylor@example.com',
      phone: '+15551234567', phone_number: '+15551234567', identifier: 'CU-10482', country_code: 'US',
      city: 'Austin', company_name: 'Acme Inc.', custom_attribute: { 'plan' => 'gold' }, avatar_data: nil
    )
  end

  it 'covers the whole standard contact registry and blanks missing fields' do
    contact.update!(name: 'Taylor')
    payload = described_class.new(contact).as_json
    expect(MessengerTemplates::Variables::STANDARD_CONTACT_KEYS.map(&:to_sym) - payload.keys).to be_empty
    expect(payload.values_at(:last_name, :email, :phone, :phone_number, :identifier, :city, :company_name, :country_code).uniq).to eq([''])
  end

  it 'prefers the stored last name over the one derived from the full name' do
    contact.update!(name: 'Taylor Reed', last_name: 'Del Valle')
    expect(described_class.new(contact).as_json).to include(first_name: 'Taylor', last_name: 'Del Valle')
  end

  it 'embeds a supported avatar with the existing raster limits' do
    contact.avatar.attach(io: Rails.root.join('spec/assets/avatar.png').open, filename: 'avatar.png', content_type: 'image/png')
    payload = described_class.new(contact).as_json
    expect(payload[:avatar_data]).to start_with('data:image/png;base64,')
  end

  it 'omits unsupported or oversized avatars' do
    contact.avatar.attach(io: Rails.root.join('spec/assets/avatar.png').open, filename: 'avatar.png', content_type: 'image/png')
    contact.avatar.blob.update!(byte_size: 2.megabytes + 1)
    expect(described_class.new(contact).as_json[:avatar_data]).to be_nil
    contact.avatar.blob.update!(byte_size: 10, content_type: 'image/svg+xml')
    expect(described_class.new(contact).as_json[:avatar_data]).to be_nil
  end
end
