require 'rails_helper'

describe ContactInboxWithContactBuilder do
  let(:account) { create(:account) }
  let(:inbox) { create(:inbox, account: account) }
  let(:contact) { create(:contact, email: 'xyc@example.com', phone_number: '+23423424123', account: account, identifier: '123') }
  let(:existing_contact_inbox) { create(:contact_inbox, contact: contact, inbox: inbox) }

  describe '#perform' do
    it 'doesnot create contact if it already exist with source id' do
      contact_inbox = described_class.new(
        source_id: existing_contact_inbox.source_id,
        inbox: inbox,
        contact_attributes: {
          name: 'Contact',
          phone_number: '+1234567890',
          email: 'testemail@example.com'
        }
      ).perform

      expect(contact_inbox.contact.id).to be(contact.id)
    end

    it 'creates contact if contact doesnot exist with source id' do
      contact_inbox = described_class.new(
        source_id: '123456',
        inbox: inbox,
        contact_attributes: {
          name: 'Contact',
          phone_number: '+1234567890',
          email: 'testemail@example.com',
          custom_attributes: { test: 'test' }
        }
      ).perform

      expect(contact_inbox.contact.id).not_to eq(contact.id)
      expect(contact_inbox.contact.name).to eq('Contact')
      expect(contact_inbox.contact.custom_attributes).to eq({ 'test' => 'test' })
      expect(contact_inbox.inbox_id).to eq(inbox.id)
    end

    it 'truncates long contact names before creating the contact' do
      long_name = 'a' * 300

      contact_inbox = described_class.new(
        source_id: '123456',
        inbox: inbox,
        contact_attributes: {
          name: long_name,
          email: 'testemail@example.com'
        }
      ).perform

      expect(contact_inbox.contact.name).to eq(long_name.first(ApplicationRecord::MAX_STRING_COLUMN_LENGTH))
    end

    it 'doesnot create contact if it already exist with identifier' do
      contact_inbox = described_class.new(
        source_id: '123456',
        inbox: inbox,
        contact_attributes: {
          name: 'Contact',
          identifier: contact.identifier,
          phone_number: contact.phone_number,
          email: 'testemail@example.com'
        }
      ).perform

      expect(contact_inbox.contact.id).to be(contact.id)
    end

    it 'doesnot create contact if it already exist with email' do
      contact_inbox = described_class.new(
        source_id: '123456',
        inbox: inbox,
        contact_attributes: {
          name: 'Contact',
          phone_number: '+1234567890',
          email: contact.email
        }
      ).perform

      expect(contact_inbox.contact.id).to be(contact.id)
    end

    it 'doesnot create contact when an uppercase email is passed for an already existing contact email' do
      contact_inbox = described_class.new(
        source_id: '123456',
        inbox: inbox,
        contact_attributes: {
          name: 'Contact',
          phone_number: '+1234567890',
          email: contact.email.upcase
        }
      ).perform

      expect(contact_inbox.contact.id).to be(contact.id)
    end

    it 'doesnot create contact if it already exist with phone number' do
      contact_inbox = described_class.new(
        source_id: '123456',
        inbox: inbox,
        contact_attributes: {
          name: 'Contact',
          phone_number: contact.phone_number,
          email: 'testemail@example.com'
        }
      ).perform

      expect(contact_inbox.contact.id).to be(contact.id)
    end

    it 'reuses contact if it exists with the same source_id in a Facebook inbox when creating for Instagram inbox' do
      instagram_source_id = '123456789'

      # Create a Facebook page inbox with a contact using the same source_id
      facebook_inbox = create(:inbox, channel_type: 'Channel::FacebookPage', account: account)
      facebook_contact = create(:contact, account: account)
      facebook_contact_inbox = create(:contact_inbox, contact: facebook_contact, inbox: facebook_inbox, source_id: instagram_source_id)

      # Create an Instagram inbox
      instagram_inbox = create(:inbox, channel_type: 'Channel::Instagram', account: account)

      # Try to create a contact inbox with same source_id for Instagram
      contact_inbox = described_class.new(
        source_id: instagram_source_id,
        inbox: instagram_inbox,
        contact_attributes: {
          name: 'Instagram User',
          email: 'instagram_user@example.com'
        }
      ).perform

      # Should reuse the existing contact from Facebook
      expect(contact_inbox.contact.id).to eq(facebook_contact.id)
      # Make sure the contact inbox is not the same as the Facebook contact inbox
      expect(contact_inbox.id).not_to eq(facebook_contact_inbox.id)
      expect(contact_inbox.inbox_id).to eq(instagram_inbox.id)
    end
  end

  describe '#perform with contact hiding' do
    let!(:policy) { create(:account_contact_hiding_policy, account: account, visible_per_cycle: 1, hidden_per_cycle: 1) }

    def build_contact_inbox(source_id, origin: nil)
      described_class.new(
        source_id: source_id,
        inbox: inbox,
        contact_attributes: { name: "Contact #{source_id}" },
        origin: origin
      ).perform
    end

    it 'hides every second channel inbound contact' do
      first = build_contact_inbox('inbound-1')
      second = build_contact_inbox('inbound-2')

      expect(first.contact.hidden).to be(false)
      expect(second.contact.hidden).to be(true)
    end

    it 'never hides an account initiated contact and does not consume a slot' do
      contact_inbox = build_contact_inbox('internal-1', origin: :internal)

      expect(contact_inbox.contact.hidden).to be(false)
      expect(policy.reload.inbound_contact_count).to eq(0)
    end

    it 'does not consume a slot when an existing contact is reused' do
      existing = create(:contact, account: account, phone_number: '+19999999999')
      described_class.new(
        source_id: 'returning-1',
        inbox: inbox,
        contact_attributes: { name: 'Returning', phone_number: existing.phone_number }
      ).perform

      expect(policy.reload.inbound_contact_count).to eq(0)
    end

    it 'releases the slot when the contact insert is rolled back' do
      call_count = 0
      allow_any_instance_of(Contact).to receive(:save!).and_wrap_original do |method, *args| # rubocop:disable RSpec/AnyInstance
        call_count += 1
        raise ActiveRecord::RecordNotUnique, 'duplicate key' if call_count == 1

        method.call(*args)
      end

      build_contact_inbox('retry-1')

      expect(policy.reload.inbound_contact_count).to eq(1)
    end

    it 'creates visible contacts when hiding is disabled' do
      policy.update!(enabled: false)

      contact_inbox = build_contact_inbox('inbound-3')

      expect(contact_inbox.contact.hidden).to be(false)
      expect(policy.reload.inbound_contact_count).to eq(0)
    end
  end
end
