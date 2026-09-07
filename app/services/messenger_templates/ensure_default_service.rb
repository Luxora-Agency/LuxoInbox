# Lazy seeding: the library creates the account's default script the first time it is
# listed, so both new and existing accounts get it without a data migration and without
# touching the Account lifecycle.
class MessengerTemplates::EnsureDefaultService
  def self.restore!(account)
    new(account).restore!
  end

  def initialize(account)
    @account = account
  end

  def perform
    default_record || create_default
  rescue ActiveRecord::RecordNotUnique
    # Two first visits raced each other: the row the partial unique index kept is the one.
    default_record
  end

  # Puts the canonical script back: recreated when it was deleted, reset when it was edited.
  def restore!
    record = default_record
    return create_default unless record

    record.update!(title: MessengerTemplates::DefaultTemplate.title, definition: MessengerTemplates::DefaultTemplate.definition)
    record
  end

  private

  attr_reader :account

  def default_record
    account.messenger_templates.find_by(is_default: true)
  end

  # A savepoint of its own, so a losing race raises without aborting the caller's transaction.
  def create_default
    MessengerTemplate.transaction(requires_new: true) do
      account.messenger_templates.create!(title: MessengerTemplates::DefaultTemplate.title,
                                          definition: MessengerTemplates::DefaultTemplate.definition, is_default: true)
    end
  end
end
