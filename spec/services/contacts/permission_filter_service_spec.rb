require 'rails_helper'

RSpec.describe Contacts::PermissionFilterService do
  let(:account) { create(:account) }
  let(:inbox) { create(:inbox, account: account) }
  let(:admin) { create(:user, account: account, role: :administrator) }
  let(:agent) { create(:user, account: account, role: :agent) }
  let!(:visible_contact) { create(:contact, account: account, assignee: agent) }
  let!(:hidden_contact) { create(:contact, account: account, assignee: agent, hidden: true) }

  before { create(:inbox_member, user: agent, inbox: inbox) }

  describe '#perform' do
    context 'when user is an administrator' do
      it 'excludes contacts hidden from the account' do
        result = described_class.new(account.contacts, admin, account).perform

        expect(result).to include(visible_contact)
        expect(result).not_to include(hidden_contact)
      end
    end

    context 'when user is an agent' do
      it 'excludes contacts hidden from the account even when they are assigned to the agent' do
        result = described_class.new(account.contacts, agent, account).perform

        expect(result).to include(visible_contact)
        expect(result).not_to include(hidden_contact)
      end

      it 'excludes hidden contacts reachable through an accessible inbox' do
        other_hidden = create(:contact, account: account, hidden: true)
        create(:conversation, account: account, inbox: inbox, contact: other_hidden)

        result = described_class.new(account.contacts, agent, account).perform

        expect(result).not_to include(other_hidden)
      end
    end
  end
end
