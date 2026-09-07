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

  # Restoring rewrites the account library, so it is a write like any other.
  def restore_default?
    create?
  end
end
