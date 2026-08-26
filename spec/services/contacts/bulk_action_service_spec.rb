require 'rails_helper'

RSpec.describe Contacts::BulkActionService do
  subject(:service) { described_class.new(account: account, user: user, params: params) }

  let(:account) { create(:account) }
  let(:user) { create(:user, account: account) }
  let(:first_contact) { create(:contact, account: account) }
  let(:second_contact) { create(:contact, account: account) }
  let(:hidden_contact) { create(:contact, account: account, hidden: true) }

  describe '#perform' do
    context 'when delete action is requested via action_name' do
      let(:params) { { ids: [first_contact.id, second_contact.id], action_name: 'delete' } }

      it 'delegates to the bulk delete service' do
        bulk_delete_service = instance_double(Contacts::BulkDeleteService, perform: true)

        expect(Contacts::BulkDeleteService).to receive(:new)
          .with(account: account, contact_ids: match_array([first_contact.id, second_contact.id]))
          .and_return(bulk_delete_service)

        service.perform
      end
    end

    context 'when labels are provided' do
      let(:params) { { ids: [first_contact.id, second_contact.id], labels: { add: %w[vip support] }, extra: 'ignored' } }

      it 'delegates to the bulk assign labels service with permitted params' do
        bulk_assign_service = instance_double(Contacts::BulkAssignLabelsService, perform: true)

        expect(Contacts::BulkAssignLabelsService).to receive(:new)
          .with(account: account, contact_ids: match_array([first_contact.id, second_contact.id]), labels: %w[vip support])
          .and_return(bulk_assign_service)

        service.perform
      end
    end

    context 'when labels are removed' do
      let(:params) { { ids: [first_contact.id, second_contact.id], labels: { remove: %w[vip] }, extra: 'ignored' } }

      it 'delegates to the bulk remove labels service with permitted params' do
        bulk_remove_service = instance_double(Contacts::BulkRemoveLabelsService, perform: true)

        expect(Contacts::BulkRemoveLabelsService).to receive(:new)
          .with(account: account, contact_ids: match_array([first_contact.id, second_contact.id]), labels: %w[vip])
          .and_return(bulk_remove_service)

        service.perform
      end
    end

    context 'when hidden or foreign contact ids are supplied' do
      let(:foreign_contact) { create(:contact, account: create(:account)) }
      let(:params) { { ids: [first_contact.id, hidden_contact.id, foreign_contact.id], action_name: 'delete' } }

      it 'passes only the visible contacts of the account' do
        bulk_delete_service = instance_double(Contacts::BulkDeleteService, perform: true)

        expect(Contacts::BulkDeleteService).to receive(:new)
          .with(account: account, contact_ids: [first_contact.id])
          .and_return(bulk_delete_service)

        service.perform
      end
    end
  end
end
