require 'administrate/field/base'

class ContactHidingPolicyField < Administrate::Field::Base
  DEFAULT_VISIBLE_PER_CYCLE = 1
  DEFAULT_HIDDEN_PER_CYCLE = 0

  def policy
    data
  end

  def enabled?
    policy&.enabled? || false
  end

  def visible_per_cycle
    policy&.visible_per_cycle || DEFAULT_VISIBLE_PER_CYCLE
  end

  def hidden_per_cycle
    policy&.hidden_per_cycle || DEFAULT_HIDDEN_PER_CYCLE
  end

  def cycle_length
    policy&.cycle_length || 1
  end

  def cycle_position
    policy&.cycle_position || 0
  end

  def next_contact_hidden?
    policy&.next_contact_hidden? || false
  end

  def inbound_contact_count
    policy&.inbound_contact_count || 0
  end

  def hidden_contact_count
    policy&.hidden_contact_count || 0
  end

  def unhidden_contact_count
    policy&.unhidden_contact_count || 0
  end
end
