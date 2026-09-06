require 'rails_helper'

RSpec.describe 'Messenger templates API', type: :request do
  let(:account) { create(:account) }
  let(:admin) { create(:user, account: account, role: :administrator) }
  let(:agent) { create(:user, account: account, role: :agent) }
  let(:template) { create(:messenger_template, account: account) }
  let(:path) { "/api/v1/accounts/#{account.id}/messenger_templates" }
  let(:attributes) { attributes_for(:messenger_template) }

  before { account.enable_features!('messenger_simulator') }

  it 'lets administrators create, update, duplicate and delete scripts' do
    post path, params: { messenger_template: attributes }, headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:created)
    id = response.parsed_body['id']
    patch "#{path}/#{id}", params: { messenger_template: { title: 'Updated' } }, headers: admin.create_new_auth_token, as: :json
    expect(response.parsed_body['title']).to eq('Updated')
    post path, params: { messenger_template: attributes }, headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:created)
    expect(account.messenger_templates.count).to eq(2)
    delete "#{path}/#{id}", headers: admin.create_new_auth_token
    expect(response).to have_http_status(:no_content)
    expect(account.messenger_templates.count).to eq(1)
  end

  it 'lets agents read only their account library' do
    other_template = create(:messenger_template)
    template
    get path, headers: agent.create_new_auth_token
    expect(response.parsed_body.pluck('id')).to eq([template.id])
    expect(response.headers['Cache-Control']).to include('no-store')
    get "#{path}/#{other_template.id}", headers: agent.create_new_auth_token
    expect(response).to have_http_status(:not_found)
  end

  it 'denies agent writes' do
    headers = agent.create_new_auth_token
    post path, params: { messenger_template: attributes }, headers: headers, as: :json
    expect(response).to have_http_status(:unauthorized)
    patch "#{path}/#{template.id}", params: { messenger_template: { title: 'Changed' } }, headers: headers, as: :json
    expect(response).to have_http_status(:unauthorized)
    delete "#{path}/#{template.id}", headers: headers
    expect(response).to have_http_status(:unauthorized)
    expect(template.reload.title).to eq('Welcome script')
  end

  it 'denies disabled features and nonmembers' do
    account.disable_features!('messenger_simulator')
    get path, headers: admin.create_new_auth_token
    expect(response).to have_http_status(:unauthorized)
    account.enable_features!('messenger_simulator')
    get path, headers: create(:user).create_new_auth_token
    expect(response).to have_http_status(:unauthorized)
  end

  it 'rejects invalid definitions and ignores account reassignment' do
    post path, params: { messenger_template: attributes.merge(definition: { messages: [] }) },
               headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    other_account = create(:account)
    post path, params: { messenger_template: attributes.merge(account_id: other_account.id) },
               headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:created)
    expect(MessengerTemplate.find(response.parsed_body['id']).account_id).to eq(account.id)
  end

  it 'rejects malformed definition updates without changing the saved script' do
    [nil, [], 'invalid'].each do |definition|
      patch "#{path}/#{template.id}", params: { messenger_template: { definition: definition } },
                                      headers: admin.create_new_auth_token, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(template.reload.definition['version']).to eq(1)
    end
  end

  it 'denies unauthenticated access and cross-account administrator writes' do
    get path
    expect(response).to have_http_status(:unauthorized)
    foreign_template = create(:messenger_template)
    patch "#{path}/#{foreign_template.id}", params: { messenger_template: { title: 'Changed' } },
                                            headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:not_found)
    delete "#{path}/#{foreign_template.id}", headers: admin.create_new_auth_token
    expect(response).to have_http_status(:not_found)
    expect(foreign_template.reload.title).to eq('Welcome script')
  end

  it 'rejects non-object envelopes and non-string titles' do
    ['invalid', [attributes], { title: [] }, { title: { value: 'Invalid' } }, { title: 12 }].each do |input|
      patch "#{path}/#{template.id}", params: { messenger_template: input }, headers: admin.create_new_auth_token, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(template.reload.title).to eq('Welcome script')
    end
  end
end
