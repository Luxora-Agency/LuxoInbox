require 'rails_helper'

RSpec.describe MessengerTemplates::EnsureDefaultService do
  let(:account) { create(:account) }

  it 'seeds the canonical script once and returns the same row on the next visit' do
    seeded = described_class.new(account).perform
    expect(seeded.is_default).to be(true)
    expect(seeded.title).to eq(MessengerTemplates::DefaultTemplate.title)
    expect(seeded.definition).to eq(MessengerTemplates::DefaultTemplate.definition)
    expect(described_class.new(account).perform.id).to eq(seeded.id)
    expect(account.messenger_templates.count).to eq(1)
  end

  it 'seeds each account its own copy' do
    described_class.new(account).perform
    other = create(:account)
    expect(described_class.new(other).perform.account_id).to eq(other.id)
    expect(MessengerTemplate.where(is_default: true).count).to eq(2)
  end

  it 'leaves the default deleted instead of resurrecting it on the next listing' do
    described_class.new(account).perform.destroy!
    expect(described_class.new(account).perform).to be_nil
    expect(account.reload.messenger_templates.count).to be_zero
  end

  it 'names the default in the account language whatever the request locale is' do
    account.update!(locale: 'es')
    spanish_title = I18n.t('messenger_templates.default.title', locale: :es)
    seeded = I18n.with_locale(:en) { described_class.new(account).perform }
    expect(seeded.title).to eq(spanish_title)
    I18n.with_locale(:en) { described_class.restore!(account) }
    expect(seeded.reload.title).to eq(spanish_title)
  end

  it 'still lists the library when another script already holds the canonical title' do
    create(:messenger_template, account: account, title: MessengerTemplates::DefaultTemplate.title.upcase)
    expect(described_class.new(account).perform).to be_nil
    expect(account.messenger_templates.where(is_default: true)).to be_empty
    expect(account.messenger_templates.count).to eq(1)
  end

  it 're-reads the winning row when a concurrent seed claimed the default first' do
    winner = create(:messenger_template, :default, account: account)
    service = described_class.new(account)
    allow(service).to receive(:create_default).and_raise(ActiveRecord::RecordNotUnique)
    allow(service).to receive(:default_record).and_return(nil, winner)
    expect(service.perform).to eq(winner)
  end

  it 're-reads the winning row when a concurrent restore recreated the default first' do
    winner = create(:messenger_template, :default, account: account)
    service = described_class.new(account)
    allow(service).to receive(:create_default).and_raise(ActiveRecord::RecordNotUnique)
    allow(service).to receive(:default_record).and_return(nil, winner)
    expect(service.restore!).to eq(winner)
  end

  it 'recreates the default after it is deleted' do
    described_class.new(account).perform.destroy!
    restored = described_class.restore!(account)
    expect(restored.is_default).to be(true)
    expect(restored.title).to eq(MessengerTemplates::DefaultTemplate.title)
    expect(account.messenger_templates.count).to eq(1)
  end

  it 'resets the title and the definition after the default is edited' do
    seeded = described_class.new(account).perform
    seeded.update!(title: 'Renamed', definition: seeded.definition.merge('business_name' => 'Other'))
    reset = described_class.restore!(account)
    expect(reset.id).to eq(seeded.id)
    expect(reset.title).to eq(MessengerTemplates::DefaultTemplate.title)
    expect(reset.definition).to eq(MessengerTemplates::DefaultTemplate.definition)
    expect(account.messenger_templates.count).to eq(1)
  end

  it 'asks the admin to free the canonical title instead of renaming another script' do
    kept = create(:messenger_template, account: account, title: MessengerTemplates::DefaultTemplate.title)
    expect { described_class.restore!(account) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(kept.reload.title).to eq(MessengerTemplates::DefaultTemplate.title)
  end

  it 'leaves the other scripts of the account untouched' do
    kept = create(:messenger_template, account: account)
    described_class.new(account).perform
    described_class.restore!(account)
    expect(account.messenger_templates.pluck(:id)).to include(kept.id)
    expect(account.messenger_templates.where(is_default: true).count).to eq(1)
  end
end
