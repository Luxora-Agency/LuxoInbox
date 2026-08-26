require 'rails_helper'

describe Evolution::IncomingMessageService do
  let(:account) { create(:account) }
  let(:channel_api) { create(:channel_api, account: account) }
  let(:inbox) { channel_api.inbox }
  let!(:policy) { create(:account_contact_hiding_policy, account: account, visible_per_cycle: 1, hidden_per_cycle: 1) }

  def params_for(remote_jid:, message_id:, from_me: false, content: 'Hello')
    {
      event: 'messages.upsert',
      instance: 'evolution-instance',
      data: {
        key: { remoteJid: remote_jid, fromMe: from_me, id: message_id },
        pushName: 'John Doe',
        message: { conversation: content }
      }
    }.with_indifferent_access
  end

  describe '#perform' do
    it 'creates the contact through the builder with a normalized source_id' do
      described_class.new(inbox: inbox, params: params_for(remote_jid: '5511999999999@s.whatsapp.net', message_id: 'MSG1')).perform

      contact_inbox = inbox.contact_inboxes.last
      expect(contact_inbox.source_id).to eq('+5511999999999')
      expect(contact_inbox.contact.phone_number).to eq('+5511999999999')
      expect(contact_inbox.contact.name).to eq('John Doe')
    end

    it 'applies the hiding cycle to inbound contacts' do
      described_class.new(inbox: inbox, params: params_for(remote_jid: '5511999999991@s.whatsapp.net', message_id: 'MSG1')).perform
      described_class.new(inbox: inbox, params: params_for(remote_jid: '5511999999992@s.whatsapp.net', message_id: 'MSG2')).perform

      first, second = account.contacts.order(:id).to_a
      expect(first.hidden).to be(false)
      expect(second.hidden).to be(true)
      expect(second.conversations.first.hidden).to be(true)
    end

    it 'never hides a contact created from an outgoing echo and does not consume a slot' do
      described_class.new(
        inbox: inbox,
        params: params_for(remote_jid: '5511999999993@s.whatsapp.net', message_id: 'MSG3', from_me: true)
      ).perform

      expect(account.contacts.last.hidden).to be(false)
      expect(policy.reload.inbound_contact_count).to eq(0)
    end

    it 'reuses the open conversation and the contact inbox for a second inbound message' do
      described_class.new(inbox: inbox, params: params_for(remote_jid: '5511999999994@s.whatsapp.net', message_id: 'MSG4')).perform
      described_class.new(inbox: inbox, params: params_for(remote_jid: '5511999999994@s.whatsapp.net', message_id: 'MSG5')).perform

      expect(inbox.contact_inboxes.count).to eq(1)
      expect(inbox.conversations.count).to eq(1)
      expect(inbox.conversations.first.messages.count).to eq(2)
    end
  end
end
