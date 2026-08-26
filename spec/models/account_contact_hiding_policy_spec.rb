# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AccountContactHidingPolicy do
  let(:account) { create(:account) }

  context 'with associations' do
    it { is_expected.to belong_to(:account) }
  end

  context 'with validations' do
    it 'is valid with a positive cycle length' do
      policy = build(:account_contact_hiding_policy, account: account, visible_per_cycle: 5, hidden_per_cycle: 1)

      expect(policy).to be_valid
    end

    it 'rejects a zero length cycle' do
      policy = build(:account_contact_hiding_policy, account: account, visible_per_cycle: 0, hidden_per_cycle: 0)

      expect(policy).not_to be_valid
      expect(policy.errors[:base]).to include(I18n.t('super_admin.contact_hiding.errors.cycle_length'))
    end

    it 'rejects negative cycle values' do
      policy = build(:account_contact_hiding_policy, account: account, visible_per_cycle: -1, hidden_per_cycle: 2)

      expect(policy).not_to be_valid
      expect(policy.errors[:visible_per_cycle]).to be_present
    end

    it 'allows only one policy per account' do
      create(:account_contact_hiding_policy, account: account)
      duplicate = build(:account_contact_hiding_policy, account: account)

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:account_id]).to be_present
    end

    it 'accepts a cycle that only hides' do
      policy = build(:account_contact_hiding_policy, account: account, visible_per_cycle: 0, hidden_per_cycle: 1)

      expect(policy).to be_valid
    end

    it 'accepts a cycle that never hides' do
      policy = build(:account_contact_hiding_policy, account: account, visible_per_cycle: 1, hidden_per_cycle: 0)

      expect(policy).to be_valid
    end
  end

  describe '#cycle_position' do
    it 'wraps the monotonic counter around the cycle length' do
      policy = build(:account_contact_hiding_policy, account: account, visible_per_cycle: 5, hidden_per_cycle: 1,
                                                     inbound_contact_count: 13)

      expect(policy.cycle_length).to eq(6)
      expect(policy.cycle_position).to eq(1)
    end
  end

  describe '#next_contact_hidden?' do
    it 'is false while the counter sits inside the visible slots' do
      policy = build(:account_contact_hiding_policy, account: account, visible_per_cycle: 5, hidden_per_cycle: 1,
                                                     inbound_contact_count: 4)

      expect(policy.next_contact_hidden?).to be(false)
    end

    it 'is true on the last slot of a 5:1 cycle' do
      policy = build(:account_contact_hiding_policy, account: account, visible_per_cycle: 5, hidden_per_cycle: 1,
                                                     inbound_contact_count: 5)

      expect(policy.next_contact_hidden?).to be(true)
    end
  end
end
