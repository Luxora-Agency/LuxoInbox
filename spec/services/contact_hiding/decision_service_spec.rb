require 'rails_helper'

describe ContactHiding::DecisionService do
  let(:account) { create(:account) }

  def decisions(count)
    Array.new(count) { described_class.new(account: account).hide_next_contact? }
  end

  describe '#hide_next_contact?' do
    it 'returns false and creates no policy row when the account has none' do
      expect(described_class.new(account: account).hide_next_contact?).to be(false)
      expect(AccountContactHidingPolicy.where(account_id: account.id)).to be_empty
    end

    it 'returns false and does not advance the counter when the policy is disabled' do
      policy = create(:account_contact_hiding_policy, account: account, enabled: false)

      expect(described_class.new(account: account).hide_next_contact?).to be(false)
      expect(policy.reload.inbound_contact_count).to eq(0)
    end

    it 'alternates on a 1:1 cycle' do
      create(:account_contact_hiding_policy, account: account, visible_per_cycle: 1, hidden_per_cycle: 1)

      expect(decisions(6)).to eq([false, true, false, true, false, true])
    end

    it 'hides one in every six on a 5:1 cycle' do
      create(:account_contact_hiding_policy, account: account, visible_per_cycle: 5, hidden_per_cycle: 1)

      expect(decisions(12)).to eq([false, false, false, false, false, true,
                                   false, false, false, false, false, true])
    end

    it 'hides every contact when visible_per_cycle is zero' do
      create(:account_contact_hiding_policy, account: account, visible_per_cycle: 0, hidden_per_cycle: 1)

      expect(decisions(3)).to eq([true, true, true])
    end

    it 'hides no contact when hidden_per_cycle is zero' do
      create(:account_contact_hiding_policy, account: account, visible_per_cycle: 1, hidden_per_cycle: 0)

      expect(decisions(3)).to eq([false, false, false])
    end

    it 'keeps the inbound and hidden counters in sync' do
      policy = create(:account_contact_hiding_policy, account: account, visible_per_cycle: 5, hidden_per_cycle: 1)

      decisions(6)

      expect(policy.reload.inbound_contact_count).to eq(6)
      expect(policy.hidden_contact_count).to eq(1)
    end

    it 'keeps the running counter when the cycle values change' do
      policy = create(:account_contact_hiding_policy, account: account, visible_per_cycle: 5, hidden_per_cycle: 1)
      decisions(3)

      policy.update!(visible_per_cycle: 1, hidden_per_cycle: 1)

      # counter is at 3, new cycle length is 2 => slots 3, 4, 5 => hidden, visible, hidden
      expect(decisions(3)).to eq([true, false, true])
      expect(policy.reload.inbound_contact_count).to eq(6)
    end
  end
end
