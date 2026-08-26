require 'rails_helper'

RSpec.describe RoomChannel do
  let!(:contact_inbox) { create(:contact_inbox) }
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account: account) }

  before do
    stub_connection
  end

  it 'subscribes to a stream when pubsub_token is provided' do
    subscribe(pubsub_token: contact_inbox.pubsub_token)
    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_for(contact_inbox.pubsub_token)
  end

  it 'subscribes to a stream when pubsub_token is provided for user' do
    subscribe(user_id: user.id, pubsub_token: user.pubsub_token, account_id: account.id)
    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_for(user.pubsub_token)
    expect(subscription).to have_stream_for("account_#{account.id}")
  end

  context 'when the account has hidden contacts online' do
    let!(:visible_contact) { create(:contact, account: account) }
    let!(:hidden_contact) { create(:contact, account: account, hidden: true) }

    it 'excludes hidden contacts from the presence payload sent to the user' do
      ::OnlineStatusTracker.update_presence(account.id, 'Contact', visible_contact.id)
      ::OnlineStatusTracker.update_presence(account.id, 'Contact', hidden_contact.id)

      broadcasted_payload = nil
      allow(ActionCable.server).to receive(:broadcast) { |_token, payload| broadcasted_payload = payload }

      subscribe(user_id: user.id, pubsub_token: user.pubsub_token, account_id: account.id)

      expect(broadcasted_payload[:event]).to eq('presence.update')
      expect(broadcasted_payload[:data][:contacts].keys).to include(visible_contact.id.to_s)
      expect(broadcasted_payload[:data][:contacts].keys).not_to include(hidden_contact.id.to_s)
    end
  end
end
