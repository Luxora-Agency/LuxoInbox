require 'rails_helper'

RSpec.describe 'Messenger template context API', type: :request do
  let(:account) { create(:account) }
  let(:agent) { create(:user, account: account, role: :agent) }
  let(:conversation) { create(:conversation, account: account) }
  let(:template) { create(:messenger_template, account: account) }
  let(:path) { "/api/v1/accounts/#{account.id}/conversations/#{conversation.display_id}/messenger_template_context" }
  let(:headers) { agent.create_new_auth_token }
  let(:params) { { template_id: template.id } }

  before do
    account.enable_features!('messenger_simulator')
    create(:inbox_member, inbox: conversation.inbox, user: agent)
  end

  it 'returns only the chosen script and authorized contact, without history or writes' do
    conversation.contact.update!(name: 'Taylor', phone_number: '+15551234567')
    create(:message, conversation: conversation, content: 'Not part of the script')
    expect do
      get path, params: params, headers: headers
    end.not_to(change { [conversation.reload.attributes, conversation.contact.reload.attributes, template.reload.attributes] })
    expect(response).to have_http_status(:ok)
    expect(response.headers['Cache-Control']).to include('no-store')
    expect(response.parsed_body.keys).to contain_exactly('template', 'contact', 'context_token')
    expect(response.parsed_body['contact']).to eq(
      'name' => 'Taylor', 'first_name' => 'Taylor', 'last_name' => '', 'email' => '',
      'phone' => '+15551234567', 'phone_number' => '+15551234567', 'identifier' => '',
      'country_code' => '', 'city' => '', 'company_name' => '', 'custom_attribute' => {}, 'avatar_data' => nil
    )
    expect(response.parsed_body['template']['id']).to eq(template.id)
    expect(response.body).not_to include('Not part of the script')
  end

  it 'revalidates without returning contact data or downloading avatars' do
    get path, params: params, headers: headers
    token = response.parsed_body['context_token']
    expect(MessengerScreenshot::ContactPresenter).not_to receive(:new)
    get path, params: params.merge(authorize_only: true, context_token: token), headers: headers
    expect(response).to have_http_status(:no_content)
    expect(response.body).to be_empty
  end

  it 'rejects stale contact fields and template definitions' do
    get path, params: params, headers: headers
    token = response.parsed_body['context_token']
    conversation.contact.update!(name: 'Changed')
    get path, params: params.merge(authorize_only: true, context_token: token), headers: headers
    expect(response).to have_http_status(:conflict)
    get path, params: params, headers: headers
    token = response.parsed_body['context_token']
    template.update!(title: 'Changed template')
    get path, params: params.merge(authorize_only: true, context_token: token), headers: headers
    expect(response).to have_http_status(:conflict)
  end

  it 'ignores unrelated real messages but detects phone and avatar changes' do
    get path, params: params, headers: headers
    token = response.parsed_body['context_token']
    create(:message, conversation: conversation)
    get path, params: params.merge(authorize_only: true, context_token: token), headers: headers
    expect(response).to have_http_status(:no_content)
    conversation.contact.update!(phone_number: '+15559876543')
    get path, params: params.merge(authorize_only: true, context_token: token), headers: headers
    expect(response).to have_http_status(:conflict)
    get path, params: params, headers: headers
    token = response.parsed_body['context_token']
    conversation.contact.avatar.attach(io: Rails.root.join('spec/assets/avatar.png').open, filename: 'avatar.png', content_type: 'image/png')
    get path, params: params.merge(authorize_only: true, context_token: token), headers: headers
    expect(response).to have_http_status(:conflict)
  end

  it 'invalidates the token when any other exposed contact field changes' do
    changes = [{ email: 'taylor@example.com' }, { identifier: 'CU-10482' }, { last_name: 'Reed' },
               { additional_attributes: { 'city' => 'Austin' } }, { additional_attributes: { 'company_name' => 'Acme' } },
               { custom_attributes: { 'plan' => 'gold' } }]
    changes.each do |change|
      get path, params: params, headers: headers
      conversation.contact.update!(change)
      get path, params: params.merge(authorize_only: true, context_token: response.parsed_body['context_token']), headers: headers
      expect(response).to have_http_status(:conflict)
    end
  end

  it 'denies deleted templates and revoked feature access' do
    get path, params: params, headers: headers
    check = params.merge(authorize_only: true, context_token: response.parsed_body['context_token'])
    account.disable_features!('messenger_simulator')
    get path, params: check, headers: headers
    expect(response).to have_http_status(:unauthorized)
    account.enable_features!('messenger_simulator')
    template.destroy!
    get path, params: check, headers: headers
    expect(response).to have_http_status(:not_found)
  end

  it 'rejects cross-account templates and hidden conversations' do
    get path, params: { template_id: create(:messenger_template).id }, headers: headers
    expect(response).to have_http_status(:not_found)
    conversation.update!(hidden: true)
    get path, params: params, headers: headers
    expect(response).to have_http_status(:not_found)
  end

  it 'rejects malformed identifiers and revalidation parameters' do
    [nil, ['1'], { id: 1 }, '0', '1oops'].each do |id|
      get path, params: { template_id: id }, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
    [{ authorize_only: ['true'] }, { authorize_only: true }, { authorize_only: true, context_token: ['bad'] }].each do |invalid|
      get path, params: params.merge(invalid), headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  it 'preserves the real-history contact response shape' do
    get path.sub('messenger_template_context', 'messenger_screenshot'), headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body['contact'].keys).to contain_exactly('name', 'avatar_data')
  end
end
