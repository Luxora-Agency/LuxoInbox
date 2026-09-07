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

  # Extraction drafts a template for the editor, so only the people who may save one may ask for it.
  def extract?
    create?
  end
end
