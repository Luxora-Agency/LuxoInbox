# == Schema Information
#
# Table name: account_contact_hiding_policies
#
#  id                     :bigint           not null, primary key
#  enabled                :boolean          default(FALSE), not null
#  hidden_contact_count   :bigint           default(0), not null
#  hidden_per_cycle       :integer          default(0), not null
#  inbound_contact_count  :bigint           default(0), not null
#  unhidden_contact_count :bigint           default(0), not null
#  visible_per_cycle      :integer          default(1), not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  account_id             :bigint           not null
#
# Indexes
#
#  index_account_contact_hiding_policies_on_account_id  (account_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class AccountContactHidingPolicy < ApplicationRecord
  belongs_to :account

  # Transient flag set by PolicyUpdateService when an update turns hiding on but
  # omits N or M, so the requirement is enforced as a diagnosable validation error.
  attr_accessor :enabling_without_operands

  validates :account_id, uniqueness: true
  validates :visible_per_cycle, :hidden_per_cycle,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :cycle_length_positive
  validate :operands_present_when_enabling

  def cycle_length
    visible_per_cycle + hidden_per_cycle
  end

  # 0-based index of the slot the NEXT inbound contact will consume.
  def cycle_position
    return 0 if cycle_length.zero?

    inbound_contact_count % cycle_length
  end

  def next_contact_hidden?
    cycle_position >= visible_per_cycle
  end

  private

  def cycle_length_positive
    return if (visible_per_cycle.to_i + hidden_per_cycle.to_i).positive?

    errors.add(:base, I18n.t('super_admin.contact_hiding.errors.cycle_length'))
  end

  def operands_present_when_enabling
    return unless enabling_without_operands

    errors.add(:base, I18n.t('super_admin.contact_hiding.errors.operands_required'))
  end
end
