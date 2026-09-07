# Lazy seeding: the library creates the account's default script the first time it is
# listed, so both new and existing accounts get it without a data migration and without
# touching the Account lifecycle.
class MessengerTemplates::EnsureDefaultService
  # Marks the account whose default was already seeded, so deleting the row sticks
  # instead of being undone by the next listing.
  SEEDED_KEY = 'messenger_default_seeded'.freeze

  def self.restore!(account)
    new(account).restore!
  end

  def initialize(account)
    @account = account
  end

  def perform
    return default_record if seeded?

    record = default_record || create_default
    mark_seeded
    record
  rescue ActiveRecord::RecordNotUnique
    # Two first visits raced each other: the row the partial unique index kept is the one.
    mark_seeded
    default_record
  rescue ActiveRecord::RecordInvalid
    # Another script of the account already holds the canonical title. Listing the library
    # must not fail for that, and staying unseeded lets the next visit retry once it frees up.
    nil
  end

  # Puts the canonical script back: recreated when it was deleted, reset when it was edited.
  # A title held by another script raises here on purpose, so the admin is told to free it.
  def restore!
    record = default_record
    if record
      record.update!(title: canonical_title, definition: MessengerTemplates::DefaultTemplate.definition)
    else
      record = create_default
    end
    mark_seeded
    record
  rescue ActiveRecord::RecordNotUnique
    # A concurrent restore claimed the row first; the one the index kept is the default.
    mark_seeded
    default_record
  end

  private

  attr_reader :account

  def canonical_title
    MessengerTemplates::DefaultTemplate.title(account.locale)
  end

  def default_record
    account.messenger_templates.find_by(is_default: true)
  end

  # A savepoint of its own, so a losing race raises without aborting the caller's transaction.
  def create_default
    MessengerTemplate.transaction(requires_new: true) do
      account.messenger_templates.create!(title: canonical_title,
                                          definition: MessengerTemplates::DefaultTemplate.definition, is_default: true)
    end
  end

  def seeded?
    account.internal_attributes[SEEDED_KEY].present?
  end

  # Written outside the Account lifecycle: no validations, no callbacks and no `updated_at`
  # churn just because somebody listed the library.
  def mark_seeded
    return if seeded?

    # rubocop:disable Rails/SkipsModelValidations
    account.update_column(:internal_attributes, account.internal_attributes.merge(SEEDED_KEY => true))
    # rubocop:enable Rails/SkipsModelValidations
  end
end
