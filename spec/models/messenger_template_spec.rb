require 'rails_helper'

RSpec.describe MessengerTemplate do
  subject(:template) { build(:messenger_template) }

  let(:definition_error) { ->(key, **options) { I18n.t("errors.messenger_template.definition.#{key}", **options) } }

  it 'removes scripts before deleting their account' do
    template.save!
    template.account.destroy!
    expect(described_class.exists?(template.id)).to be(false)
  end

  it 'requires a title of at most 100 characters' do
    ['', 'a' * 101].each do |title|
      template.title = title
      expect(template).not_to be_valid
    end
  end

  it 'rejects a title already taken in the same account, ignoring case' do
    template.save!
    duplicate = build(:messenger_template, account: template.account, title: 'welcome SCRIPT')
    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:title]).to include(I18n.t('errors.messenger_template.title.taken'))
  end

  it 'allows the same title in another account and when renaming the same script' do
    template.save!
    expect(build(:messenger_template, account: create(:account), title: template.title)).to be_valid
    template.title = 'Welcome Script'
    expect(template).to be_valid
  end

  it 'keeps at most one default template per account' do
    seeded = create(:messenger_template, :default, account: template.account)
    expect(seeded).to be_valid
    rival = build(:messenger_template, :default, account: template.account, title: 'Another default')
    expect(rival).not_to be_valid
    expect(rival.errors[:is_default]).to include(I18n.t('errors.messenger_template.is_default.taken'))
    expect(build(:messenger_template, :default, account: create(:account))).to be_valid
  end

  it 'lets the database reject a second default when validation is skipped' do
    create(:messenger_template, :default, account: template.account)
    rival = build(:messenger_template, :default, account: template.account, title: 'Another default')
    expect { rival.save!(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
  end

  it 'accepts every registry variable, spaced tokens and custom attributes' do
    texts = ['{{contact.name}}: {{contact.phone}}', '{{ contact.name }}', '{{contact.email}} at {{contact.company_name}}',
             '{{contact.first_name}} {{contact.last_name}} {{contact.identifier}}',
             '{{contact.city}} {{contact.country_code}} {{contact.phone_number}}',
             '{{contact.custom_attribute.plan}} {{contact.custom_attribute.fecha-alta}}',
             '{{agent.name}} {{agent.first_name}} {{agent.last_name}} {{agent.email}}']
    texts.each do |text|
      template.definition['messages'][0]['text'] = text
      expect(template).to be_valid
    end
  end

  it 'accepts manual tokens the agent fills in at export time' do
    template.definition['messages'][0]['text'] = 'Te espero el {{manual.fecha_cita}} a las {{ manual.hora }}'
    expect(template).to be_valid
  end

  it 'rejects manual tokens the dashboard could not have produced' do
    ['Hi {{manual.Fecha}}', 'Hi {{manual.Bad Slug}}', 'Hi {{manual.}}'].each do |text|
      template.definition['messages'][0]['text'] = text
      expect(template).not_to be_valid
    end
  end

  it 'names the offending token when a variable is outside the registry' do
    template.definition['messages'][0]['text'] = 'Hi {{contact.nickname}}'
    expect(template).not_to be_valid
    expect(template.errors[:definition]).to include(definition_error.call('unknown_variable', token: '{{contact.nickname}}'))
  end

  it 'rejects expressions, bare tokens and unmatched braces' do
    ['{{contact.name | upcase}}', '{{broken', '{% assign x = 1 %}', '{{name}}', '{{contact.custom_attribute.bad key}}'].each do |text|
      template.definition['messages'][0]['text'] = text
      expect(template).not_to be_valid
    end
  end

  it 'rejects variables in the business name and in a message time' do
    template.definition['business_name'] = '{{contact.nickname}}'
    expect(template).not_to be_valid
    template.definition['business_name'] = 'Support'
    template.definition['messages'][0]['time'] = '{{agent.role}}'
    expect(template).not_to be_valid
  end

  it 'rejects malformed definitions and extra personalized fields' do
    [nil, [], {}, template.definition.merge('contact_id' => 1), template.definition.merge('version' => 2)].each do |definition|
      template.definition = definition
      expect(template).not_to be_valid
      expect(template.errors[:definition]).to include(definition_error.call('invalid'))
    end
  end

  it 'reports the specific problem for each invalid part of the definition' do
    original = template.definition.deep_dup
    message = original['messages'].first
    cases = [
      [{ 'avatar' => 'https://example.com/avatar.png' }, definition_error.call('invalid_avatar')],
      [{ 'business_name' => '' }, definition_error.call('business_name_blank')],
      [{ 'business_name' => 'a' * 61 }, definition_error.call('business_name_too_long', limit: 60)],
      [{ 'messages' => [] }, definition_error.call('messages_missing')],
      [{ 'messages' => [message] * 31 }, definition_error.call('messages_limit', limit: 30)],
      [{ 'messages' => [{ 'sender' => 'system', 'text' => 'Hello', 'time' => '' }] },
       definition_error.call('invalid_sender', position: 1)],
      [{ 'messages' => [{ 'sender' => 'incoming', 'text' => '', 'time' => '' }] },
       definition_error.call('message_blank', position: 1)],
      [{ 'messages' => [{ 'sender' => 'incoming', 'text' => 'a' * 501, 'time' => '' }] },
       definition_error.call('message_too_long', position: 1, limit: 500)],
      [{ 'messages' => [{ 'sender' => 'incoming', 'text' => 'Hello', 'time' => 'a' * 31 }] },
       definition_error.call('invalid_time', position: 1)],
      [{ 'messages' => [{ 'sender' => 'incoming', 'text' => 'Hello', 'time' => '', 'contact_id' => 1 }] },
       definition_error.call('message_invalid', position: 1)]
    ]
    cases.each do |change, expected|
      template.definition = original.merge(change)
      expect(template).not_to be_valid
      expect(template.errors[:definition]).to include(expected)
    end
  end
end
