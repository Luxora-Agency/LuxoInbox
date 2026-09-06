class MessengerSimulatorPolicy < ApplicationPolicy
  def show?
    account.feature_enabled?('messenger_simulator') &&
      account_user.present? &&
      (account_user.administrator? || account_user.agent?)
  end
end
