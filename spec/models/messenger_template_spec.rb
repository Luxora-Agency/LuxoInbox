require 'rails_helper'

RSpec.describe MessengerTemplate do
  subject(:template) { build(:messenger_template) }

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

  it 'accepts a script with allowlisted variables' do
    template.definition['messages'][0]['text'] = '{{contact.name}}: {{contact.phone}}'
    expect(template).to be_valid
  end

  it 'rejects unknown variables and expressions' do
    ['{{contact.email}}', '{{contact.name | upcase}}', '{{broken', '{% assign x = 1 %}'].each do |text|
      template.definition['messages'][0]['text'] = text
      expect(template).not_to be_valid
    end
  end

  it 'rejects malformed definitions and extra personalized fields' do
    [nil, [], {}, template.definition.merge('contact_id' => 1), template.definition.merge('version' => 2)].each do |definition|
      template.definition = definition
      expect(template).not_to be_valid
    end
  end

  it 'rejects invalid avatar sources, messages and string lengths' do
    original = template.definition.deep_dup
    changes = [
      { 'avatar' => 'https://example.com/avatar.png' }, { 'business_name' => 'a' * 61 },
      { 'messages' => [] }, { 'messages' => [original['messages'].first] * 31 },
      { 'messages' => [{ 'sender' => 'system', 'text' => 'Hello', 'time' => '' }] },
      { 'messages' => [{ 'sender' => 'incoming', 'text' => 'a' * 501, 'time' => '' }] },
      { 'messages' => [{ 'sender' => 'incoming', 'text' => 'Hello', 'time' => 'a' * 31 }] },
      { 'messages' => [{ 'sender' => 'incoming', 'text' => 'Hello', 'time' => '', 'contact_id' => 1 }] }
    ]
    changes.each do |change|
      template.definition = original.merge(change)
      expect(template).not_to be_valid
    end
  end
end
