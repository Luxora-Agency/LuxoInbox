require 'rails_helper'

RSpec.describe 'Super Admin hidden contacts', type: :request do
  let!(:super_admin) { create(:super_admin) }
  let!(:account) { create(:account) }
  let!(:policy) { create(:account_contact_hiding_policy, account: account, visible_per_cycle: 1, hidden_per_cycle: 1) }
  let!(:hidden_contact) { create(:contact, account: account, name: 'Hidden Person', hidden: true) }
  let!(:visible_contact) { create(:contact, account: account, name: 'Visible Person') }
  let!(:hidden_conversation) { create(:conversation, account: account, contact: hidden_contact) }

  describe 'GET /super_admin/accounts/{account_id}/hidden_contacts' do
    context 'when it is an unauthenticated user' do
      it 'returns unauthorized' do
        get "/super_admin/accounts/#{account.id}/hidden_contacts"

        expect(response).to have_http_status(:redirect)
      end
    end

    context 'when it is an authenticated user' do
      it 'lists only the hidden contacts of the account' do
        sign_in(super_admin, scope: :super_admin)

        get "/super_admin/accounts/#{account.id}/hidden_contacts"

        expect(response).to have_http_status(:success)
        expect(response.body).to include('Hidden Person')
        expect(response.body).not_to include('Visible Person')
        expect(response.body).to include("##{hidden_conversation.display_id}")
      end

      it 'renders the empty state when nothing is hidden' do
        hidden_conversation.destroy!
        hidden_contact.destroy!
        sign_in(super_admin, scope: :super_admin)

        get "/super_admin/accounts/#{account.id}/hidden_contacts"

        expect(response).to have_http_status(:success)
        expect(response.body).to include('No hidden contacts for this account.')
      end
    end
  end

  describe 'POST /super_admin/accounts/{account_id}/hidden_contacts/{id}/unhide' do
    context 'when it is an unauthenticated user' do
      it 'returns unauthorized and keeps the contact hidden' do
        post "/super_admin/accounts/#{account.id}/hidden_contacts/#{hidden_contact.id}/unhide"

        expect(response).to have_http_status(:redirect)
        expect(hidden_contact.reload.hidden).to be(true)
      end
    end

    context 'when it is an authenticated user' do
      before { sign_in(super_admin, scope: :super_admin) }

      it 'unhides the contact and all its conversations' do
        expect(hidden_conversation.reload.hidden).to be(true)

        post "/super_admin/accounts/#{account.id}/hidden_contacts/#{hidden_contact.id}/unhide"

        expect(response).to redirect_to("/super_admin/accounts/#{account.id}/hidden_contacts")
        expect(flash[:notice]).to eq("Contact ##{hidden_contact.id} is now visible to the account")
        expect(hidden_contact.reload.hidden).to be(false)
        expect(hidden_conversation.reload.hidden).to be(false)
        expect(policy.reload.unhidden_contact_count).to eq(1)
      end

      it 'does not unhide a contact belonging to another account' do
        other_contact = create(:contact, account: create(:account), hidden: true)

        post "/super_admin/accounts/#{account.id}/hidden_contacts/#{other_contact.id}/unhide"

        expect(response).to have_http_status(:not_found)
        expect(other_contact.reload.hidden).to be(true)
      end

      it 'does not unhide a contact that is already visible' do
        post "/super_admin/accounts/#{account.id}/hidden_contacts/#{visible_contact.id}/unhide"

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'super admin blindness regression' do
    before { sign_in(super_admin, scope: :super_admin) }

    it 'still lists hidden conversations in the super admin conversation viewer' do
      get "/super_admin/accounts/#{account.id}/conversations"

      expect(response).to have_http_status(:success)
      expect(response.body).to include("##{hidden_conversation.display_id}")
    end

    it 'still counts hidden conversations on the account show page' do
      get "/super_admin/accounts/#{account.id}"

      expect(response).to have_http_status(:success)
      expect(account.conversations.count).to eq(1)
    end
  end
end
