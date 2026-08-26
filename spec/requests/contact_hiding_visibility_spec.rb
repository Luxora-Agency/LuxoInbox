require 'rails_helper'

# End-to-end guard for the hidden-contact feature: every account-facing read surface must behave as
# though the hidden contact, its conversation and its messages do not exist. Parameterised over both
# an agent and an administrator because administrators are blind too — only super admin can see them.
RSpec.describe 'Contact hiding visibility', type: :request do
  let(:account) { create(:account) }
  let(:inbox) { create(:inbox, account: account) }
  let(:administrator) { create(:user, account: account, role: :administrator) }
  let(:agent) { create(:user, account: account, role: :agent) }

  let!(:hidden_contact) do
    create(:contact, account: account, hidden: true, name: 'Zeta One', email: 'zeta-one@example.com')
  end
  let!(:hidden_contact_inbox) { create(:contact_inbox, contact: hidden_contact, inbox: inbox, source_id: 'zeta-one-source') }
  let!(:hidden_conversation) do
    create(:conversation, account: account, inbox: inbox, contact: hidden_contact, contact_inbox: hidden_contact_inbox)
  end
  let!(:hidden_message) do
    create(:message, account: account, inbox: inbox, conversation: hidden_conversation, content: 'Zeta secret needle')
  end

  let!(:visible_contact) do
    create(:contact, account: account, name: 'Zeta Two', email: 'zeta-two@example.com')
  end
  let!(:visible_contact_inbox) { create(:contact_inbox, contact: visible_contact, inbox: inbox, source_id: 'zeta-two-source') }
  let!(:visible_conversation) do
    create(:conversation, account: account, inbox: inbox, contact: visible_contact, contact_inbox: visible_contact_inbox)
  end
  let!(:visible_message) do
    create(:message, account: account, inbox: inbox, conversation: visible_conversation, content: 'Zeta public needle')
  end

  before { create(:inbox_member, user: agent, inbox: inbox) }

  %i[administrator agent].each do |role|
    describe "the read surfaces seen by an #{role}" do
      let(:auth_headers) { public_send(role).create_new_auth_token }

      it 'omits the hidden conversation from the conversation list rows and counts' do
        get "/api/v1/accounts/#{account.id}/conversations", headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        data = response.parsed_body['data']
        expect(data['payload'].pluck('id')).to contain_exactly(visible_conversation.display_id)
        expect(data['meta']['all_count']).to eq(1)
        expect(data['meta']['unassigned_count']).to eq(1)
        expect(response.body).not_to include('hidden')
      end

      it 'omits the hidden conversation from every assignee_type slice' do
        assignee_types = %w[all unassigned]

        assignee_types.each do |assignee_type|
          get "/api/v1/accounts/#{account.id}/conversations",
              params: { assignee_type: assignee_type }, headers: auth_headers, as: :json

          expect(response.parsed_body['data']['payload'].pluck('id')).not_to include(hidden_conversation.display_id)
          expect(response.parsed_body['data']['meta']['all_count']).to eq(1)
        end
      end

      it 'omits the hidden conversation from the meta-only counts' do
        get "/api/v1/accounts/#{account.id}/conversations/meta", headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        expect(response.parsed_body['meta']['all_count']).to eq(1)
      end

      it 'omits the hidden conversation from the filter rows and count' do
        post "/api/v1/accounts/#{account.id}/conversations/filter",
             params: { payload: [{ attribute_key: 'status', filter_operator: 'equal_to', values: ['open'], query_operator: nil }] },
             headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        expect(response.parsed_body['payload'].pluck('id')).to contain_exactly(visible_conversation.display_id)
        expect(response.parsed_body['meta']['all_count']).to eq(1)
      end

      # ConversationPolicy#show? raises RecordNotFound for a hidden conversation, so both the show
      # and the nested route render 404 — indistinguishable from an unknown display_id, leaking
      # nothing about the conversation's existence.
      it 'refuses the hidden conversation on show and on a nested route' do
        get "/api/v1/accounts/#{account.id}/conversations/#{hidden_conversation.display_id}", headers: auth_headers, as: :json
        expect(response).to have_http_status(:not_found)

        get "/api/v1/accounts/#{account.id}/conversations/#{hidden_conversation.display_id}/messages", headers: auth_headers, as: :json
        expect(response).to have_http_status(:not_found)

        get "/api/v1/accounts/#{account.id}/conversations/#{visible_conversation.display_id}", headers: auth_headers, as: :json
        expect(response).to have_http_status(:success)
      end

      it 'omits the hidden contact from the contact list rows and count' do
        get "/api/v1/accounts/#{account.id}/contacts", headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        expect(response.parsed_body['payload'].pluck('id')).to contain_exactly(visible_contact.id)
        expect(response.parsed_body['meta']['count']).to eq(1)
        expect(response.body).not_to include('hidden')
      end

      it 'omits the hidden contact from contact search' do
        get "/api/v1/accounts/#{account.id}/contacts/search", params: { q: 'Zeta' }, headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        expect(response.parsed_body['payload'].pluck('id')).to contain_exactly(visible_contact.id)
      end

      it 'omits the hidden contact from the online contact list' do
        allow(OnlineStatusTracker).to receive(:get_available_contact_ids).and_return([hidden_contact.id, visible_contact.id])

        get "/api/v1/accounts/#{account.id}/contacts/active", headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        expect(response.parsed_body['payload'].pluck('id')).to contain_exactly(visible_contact.id)
        expect(response.parsed_body['meta']['count']).to eq(1)
      end

      it 'omits the hidden contact from the filter rows and count' do
        post "/api/v1/accounts/#{account.id}/contacts/filter",
             params: { payload: [{ attribute_key: 'name', filter_operator: 'contains', values: ['Zeta'], query_operator: nil }] },
             headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        expect(response.parsed_body['payload'].pluck('id')).to contain_exactly(visible_contact.id)
        expect(response.parsed_body['meta']['count']).to eq(1)
      end

      it 'returns not found for the hidden contact and for its notes' do
        get "/api/v1/accounts/#{account.id}/contacts/#{hidden_contact.id}", headers: auth_headers, as: :json
        expect(response).to have_http_status(:not_found)

        get "/api/v1/accounts/#{account.id}/contacts/#{hidden_contact.id}/notes", headers: auth_headers, as: :json
        expect(response).to have_http_status(:not_found)

        get "/api/v1/accounts/#{account.id}/contacts/#{visible_contact.id}", headers: auth_headers, as: :json
        expect(response).to have_http_status(:success)
      end

      it 'returns not found for the hidden contact conversations and still lists the visible ones' do
        get "/api/v1/accounts/#{account.id}/contacts/#{hidden_contact.id}/conversations", headers: auth_headers, as: :json
        expect(response).to have_http_status(:not_found)

        get "/api/v1/accounts/#{account.id}/contacts/#{visible_contact.id}/conversations", headers: auth_headers, as: :json
        expect(response).to have_http_status(:success)
        expect(response.parsed_body['payload'].pluck('id')).to contain_exactly(visible_conversation.display_id)
      end

      it 'omits hidden records from the conversation and contact search tabs' do
        search_tabs = %w[conversations contacts]

        search_tabs.each do |tab|
          get "/api/v1/accounts/#{account.id}/search/#{tab}", params: { q: 'Zeta' }, headers: auth_headers, as: :json

          expect(response.body).not_to include(hidden_contact.email)
          expect(response.body).to include(visible_contact.email)
        end
      end

      it 'omits messages of the hidden conversation from the message search tab' do
        get "/api/v1/accounts/#{account.id}/search/messages", params: { q: 'Zeta' }, headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        expect(response.body).not_to include(hidden_message.content)
        expect(response.body).to include(visible_message.content)
      end

      it 'omits hidden records from the combined search across all four tabs' do
        get "/api/v1/accounts/#{account.id}/search", params: { q: 'Zeta' }, headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        payload = response.parsed_body['payload']
        expect(payload.keys).to include('conversations', 'contacts', 'messages', 'articles')
        expect(response.body).not_to include(hidden_contact.email)
        expect(response.body).not_to include(hidden_message.content)
        expect(response.body).to include(visible_contact.email)
      end

      it 'returns not found when filtering contact inboxes by the hidden source id' do
        post "/api/v1/accounts/#{account.id}/contact_inboxes/filter",
             params: { inbox_id: inbox.id, source_id: hidden_contact_inbox.source_id }, headers: auth_headers, as: :json
        expect(response).to have_http_status(:not_found)

        post "/api/v1/accounts/#{account.id}/contact_inboxes/filter",
             params: { inbox_id: inbox.id, source_id: visible_contact_inbox.source_id }, headers: auth_headers, as: :json
        expect(response).to have_http_status(:success)
      end

      it 'returns not found when merging with the hidden contact on either side' do
        post "/api/v1/accounts/#{account.id}/actions/contact_merges",
             params: { base_contact_id: hidden_contact.id, mergee_contact_id: visible_contact.id }, headers: auth_headers, as: :json
        expect(response).to have_http_status(:not_found)

        post "/api/v1/accounts/#{account.id}/actions/contact_merges",
             params: { base_contact_id: visible_contact.id, mergee_contact_id: hidden_contact.id }, headers: auth_headers, as: :json
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'the administrator-only read surfaces' do
    let(:auth_headers) { administrator.create_new_auth_token }
    let(:report_params) { { since: 1.day.ago.to_i.to_s, until: 1.day.from_now.to_i.to_s } }

    it 'leaves the hidden contact alone when a bulk delete targets it' do
      # Scoped to the bulk action job so the administrator's avatar job, enqueued when `auth_headers`
      # first builds the user inside this block, is not performed and does not reach gravatar.
      perform_enqueued_jobs(only: Contacts::BulkActionJob) do
        post "/api/v1/accounts/#{account.id}/bulk_actions",
             params: { type: 'Contact', action_name: 'delete', ids: [hidden_contact.id] }, headers: auth_headers, as: :json
      end

      expect(response).to have_http_status(:success)
      expect(Contact.exists?(hidden_contact.id)).to be(true)
    end

    it 'omits csat responses of the hidden conversation from the list and the metrics' do
      create(:csat_survey_response, account: account, conversation: hidden_conversation, contact: hidden_contact, message: hidden_message)
      create(:csat_survey_response, account: account, conversation: visible_conversation, contact: visible_contact, message: visible_message)

      get "/api/v1/accounts/#{account.id}/csat_survey_responses", headers: auth_headers, as: :json
      expect(response.parsed_body.map { |csat| csat.dig('contact', 'id') }).to contain_exactly(visible_contact.id)

      get "/api/v1/accounts/#{account.id}/csat_survey_responses/metrics", headers: auth_headers, as: :json
      expect(response.parsed_body['total_count']).to eq(1)
    end

    it 'omits applied slas of the hidden conversation from the metrics', if: ChatwootApp.enterprise? do
      create(:applied_sla, account: account, conversation: hidden_conversation)
      create(:applied_sla, account: account, conversation: visible_conversation)

      get "/api/v1/accounts/#{account.id}/applied_slas/metrics", headers: auth_headers, as: :json

      expect(response).to have_http_status(:success)
      expect(response.parsed_body['total_applied_slas']).to eq(1)
    end

    it 'omits the hidden conversation from the channel summary report' do
      get "/api/v2/accounts/#{account.id}/summary_reports/channel", params: report_params, headers: auth_headers, as: :json

      expect(response).to have_http_status(:success)
      expect(response.parsed_body.dig('Channel::WebWidget', 'total')).to eq(1)
      expect(response.parsed_body.dig('Channel::WebWidget', 'open')).to eq(1)
    end

    it 'omits the hidden conversation from the bot metrics' do
      create(:agent_bot_inbox, inbox: inbox, agent_bot: create(:agent_bot, account: account))

      get "/api/v2/accounts/#{account.id}/reports/bot_metrics", params: report_params, headers: auth_headers, as: :json

      expect(response).to have_http_status(:success)
      expect(response.parsed_body['conversation_count']).to eq(1)
    end

    it 'omits messages of the hidden conversation from the outgoing messages report' do
      create(:message, account: account, inbox: inbox, conversation: hidden_conversation, message_type: :outgoing)
      create(:message, account: account, inbox: inbox, conversation: visible_conversation, message_type: :outgoing)

      get "/api/v2/accounts/#{account.id}/reports/outgoing_messages_count",
          params: report_params.merge(group_by: 'inbox'), headers: auth_headers, as: :json

      expect(response).to have_http_status(:success)
      expect(response.parsed_body.first['outgoing_messages_count']).to eq(1)
    end

    it 'omits the hidden conversation from the drilldown payload and its counts' do
      get "/api/v2/accounts/#{account.id}/reports/drilldown",
          params: report_params.merge(metric: 'conversations_count', group_by: 'day',
                                      bucket_timestamp: Time.zone.now.beginning_of_day.to_i.to_s),
          headers: auth_headers, as: :json

      expect(response).to have_http_status(:success)
      expect(response.parsed_body.dig('meta', 'total_count')).to eq(1)
      # The drilldown record carries the contact name, never the email, so identify the rows by name.
      contact_names = response.parsed_body['payload'].map { |record| record.dig('conversation', 'contact_name') }
      expect(contact_names).to contain_exactly(visible_contact.name)
    end
  end
end
