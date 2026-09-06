require 'rails_helper'

RSpec.describe MessengerScreenshot::ContactPresenter do
  let(:contact) { create(:contact) }

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
