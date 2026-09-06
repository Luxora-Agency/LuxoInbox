class MessengerTemplatePolicy < MessengerSimulatorPolicy
  def index?
    show?
  end

  def create?
    show? && account_user.administrator?
  end

  def update?
    create?
  end

  def destroy?
    create?
  end
end
