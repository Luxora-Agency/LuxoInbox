require 'rails_helper'

RSpec.describe MessengerTemplates::Variables do
  describe '.extract_keys' do
    it 'captures namespaced tokens with or without inner spaces' do
      text = 'Hi {{contact.first_name}}, {{ agent.name }} here about {{contact.custom_attribute.plan}}'
      expect(described_class.extract_keys(text)).to eq(%w[contact.first_name agent.name contact.custom_attribute.plan])
    end

    it 'tolerates the same unicode spacing the dashboard mirror accepts' do
      expect(described_class.extract_keys("{{\u00A0contact.name\u00A0}}")).to eq(%w[contact.name])
      expect(described_class.extract_keys("{{\uFEFFagent.name\uFEFF}}")).to eq(%w[agent.name])
    end

    it 'ignores expressions, bare words and unmatched braces' do
      ['{{name}}', '{{contact.name | upcase}}', '{% assign x = 1 %}', '{{broken', 'contact.name'].each do |text|
        expect(described_class.extract_keys(text)).to be_empty
      end
    end
  end

  describe '.allowed?' do
    it 'accepts the standard contact, agent and custom attribute namespaces' do
      keys = described_class::STANDARD_CONTACT_KEYS.map { |key| "contact.#{key}" } +
             described_class::AGENT_KEYS.map { |key| "agent.#{key}" } +
             ['contact.custom_attribute.plan', 'contact.custom_attribute.fecha-alta', 'contact.custom_attribute.nivel.2']
      expect(keys.reject { |key| described_class.allowed?(key) }).to be_empty
    end

    it 'rejects unknown fields, empty custom attribute keys and other namespaces' do
      keys = ['contact.nickname', 'contact.custom_attribute', 'contact.custom_attribute.', 'agent.role',
              'conversation.id', 'contact.custom_attribute.bad key', '', 'contact.']
      expect(keys.select { |key| described_class.allowed?(key) }).to be_empty
    end
  end

  describe '.catalog' do
    it 'exposes one grouped, sampled entry per static key and no custom attributes' do
      catalog = described_class.catalog
      expect(catalog.length).to eq(described_class::STANDARD_CONTACT_KEYS.length + described_class::AGENT_KEYS.length)
      expect(catalog.map { |entry| entry.keys.sort }.uniq).to eq([%i[group key label_key sample sample_key]])
      expect(catalog.pluck(:group).uniq).to eq(%w[contact agent])
      expect(catalog.select { |entry| entry[:sample].blank? }).to be_empty
      expect(catalog.find { |entry| entry[:key] == 'contact.first_name' }[:label_key])
        .to eq('MESSENGER_TEMPLATES.VARIABLES.LABELS.CONTACT_FIRST_NAME')
      expect(catalog.find { |entry| entry[:key] == 'contact.first_name' }[:sample_key])
        .to eq('MESSENGER_TEMPLATES.VARIABLES.SAMPLES.CONTACT_FIRST_NAME')
      expect(catalog.pluck(:key)).not_to include('contact.custom_attribute')
    end
  end
end
