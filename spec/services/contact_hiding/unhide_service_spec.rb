require 'rails_helper'

describe ContactHiding::UnhideService do
  let(:account) { create(:account) }
  let(:inbox) { create(:inbox, account: account) }
  let(:contact) { create(:contact, account: account, hidden: true) }
  let(:contact_inbox) { create(:contact_inbox, contact: contact, inbox: inbox) }
  let!(:conversation) { create(:conversation, account: account, inbox: inbox, contact: contact, contact_inbox: contact_inbox) }

  describe '#perform' do
    it 'makes the contact and its conversations visible to the account' do
      described_class.new(contact: contact).perform

      expect(contact.reload.hidden).to be(false)
      expect(conversation.reload.hidden).to be(false)
    end

    it 'increments the unhidden counter on the policy' do
      policy = create(:account_contact_hiding_policy, account: account)

      described_class.new(contact: contact).perform

      expect(policy.reload.unhidden_contact_count).to eq(1)
    end

    it 'does not dispatch a contact update event that would leak the flag' do
      expect(Rails.configuration.dispatcher).not_to receive(:dispatch).with(Events::Types::CONTACT_UPDATED, any_args)

      described_class.new(contact: contact).perform
    end

    it 'reindexes the messages of the unhidden conversations when advanced search is enabled' do
      allow(ChatwootApp).to receive(:advanced_search_allowed?).and_return(true)
      relation = double
      allow(relation).to receive(:reindex)
      allow(Message).to receive(:where).and_call_original
      allow(Message).to receive(:where).with(conversation_id: [conversation.id]).and_return(relation)

      described_class.new(contact: contact).perform

      expect(relation).to have_received(:reindex).with(mode: :async)
    end
  end
end
