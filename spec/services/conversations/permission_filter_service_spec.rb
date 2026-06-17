require 'rails_helper'

RSpec.describe Conversations::PermissionFilterService do
  let(:account) { create(:account) }
  let!(:conversation) { create(:conversation, account: account, inbox: inbox) }
  let!(:another_conversation) { create(:conversation, account: account, inbox: inbox) }
  let(:admin) { create(:user, account: account, role: :administrator) }
  let(:agent) { create(:user, account: account, role: :agent) }
  let!(:inbox) { create(:inbox, account: account, enable_auto_assignment: false) }

  # This inbox_member is used to establish the agent's access to the inbox
  before { create(:inbox_member, user: agent, inbox: inbox) }

  describe '#perform' do
    context 'when user is an administrator' do
      it 'returns all conversations' do
        result = described_class.new(
          account.conversations,
          admin,
          account
        ).perform

        expect(result).to include(conversation)
        expect(result).to include(another_conversation)
        expect(result.count).to eq(2)
      end
    end

    context 'when user is an agent' do
      it 'returns conversations assigned to them and unassigned ones, but not teammates' do
        assigned_to_agent = create(:conversation, account: account, inbox: inbox, assignee: agent)
        assigned_to_other = create(:conversation, account: account, inbox: inbox, assignee: create(:user, account: account))

        result = described_class.new(account.conversations, agent, account).perform

        expect(result).to include(conversation)
        expect(result).to include(another_conversation)
        expect(result).to include(assigned_to_agent)
        expect(result).not_to include(assigned_to_other)
        expect(result.count).to eq(3)
      end
    end
  end
end
