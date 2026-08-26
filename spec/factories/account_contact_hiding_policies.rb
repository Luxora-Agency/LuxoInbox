FactoryBot.define do
  factory :account_contact_hiding_policy do
    account
    enabled { true }
    visible_per_cycle { 1 }
    hidden_per_cycle { 1 }
  end
end
