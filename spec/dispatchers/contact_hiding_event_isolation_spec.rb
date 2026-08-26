require 'rails_helper'

# Behaviour-level guard for the hidden-contact feature: dispatching a real event for a hidden
# subject must not reach the account through ANY side channel, while the contact-facing side
# (widget broadcasts, CSAT) keeps working and visible subjects keep firing everything.
describe 'contact hiding event isolation' do # rubocop:disable RSpec/DescribeClass
  let!(:account) { create(:account) }
  let!(:administrator) { create(:user, account: account, role: :administrator) }
  let!(:agent) { create(:user, account: account, role: :agent) }
  let!(:inbox) { create(:inbox, account: account) }
  let!(:hidden_contact) { create(:contact, account: account, hidden: true) }
  let!(:hidden_contact_inbox) { create(:contact_inbox, contact: hidden_contact, inbox: inbox) }
  let!(:hidden_conversation) do
    create(:conversation, account: account, inbox: inbox, contact: hidden_contact,
                          contact_inbox: hidden_contact_inbox, assignee: agent)
  end
  let!(:hidden_message) do
    create(:message, account: account, inbox: inbox, conversation: hidden_conversation, message_type: :incoming)
  end
  let!(:visible_contact) { create(:contact, account: account) }
  let!(:visible_contact_inbox) { create(:contact_inbox, contact: visible_contact, inbox: inbox) }
  let!(:visible_conversation) do
    create(:conversation, account: account, inbox: inbox, contact: visible_contact,
                          contact_inbox: visible_contact_inbox, assignee: agent)
  end
  let!(:visible_message) do
    create(:message, account: account, inbox: inbox, conversation: visible_conversation, message_type: :incoming)
  end

  before do
    create(:inbox_member, inbox: inbox, user: agent)
    create(:agent_bot_inbox, inbox: inbox, agent_bot: create(:agent_bot, account: account, outgoing_url: 'https://bot.test'))
    create(:webhook, account: account, inbox: inbox, url: 'https://webhook.test')
    create(:integrations_hook, account: account)
    create(:automation_rule, account: account, event_name: 'conversation_updated',
                             conditions: [{ 'values' => ['open'], 'attribute_key' => 'status',
                                            'query_operator' => nil, 'filter_operator' => 'equal_to' }],
                             actions: [{ 'action_name' => 'add_label', 'action_params' => ['support'] }])
    allow(AutomationRules::ConditionsFilterService).to receive(:new)
      .and_return(instance_double(AutomationRules::ConditionsFilterService, perform: false))
    Current.user = nil
    Current.account = nil
  end

  # Runs the sync listeners inline and the async ones through their EventDispatcherJob, while
  # leaving every downstream job (webhooks, hooks, broadcasts) sitting in the queue for inspection.
  def dispatch(event_name, data)
    clear_enqueued_jobs
    clear_performed_jobs
    perform_enqueued_jobs(only: EventDispatcherJob) do
      Rails.configuration.dispatcher.dispatch(event_name, Time.zone.now, data)
    end
  end

  def enqueued_job_classes
    enqueued_jobs.map { |job| job[:job] }
  end

  def broadcast_tokens
    enqueued_jobs.select { |job| job[:job] == ActionCableBroadcastJob }.flat_map { |job| job[:args].first }
  end

  # The only broadcast that may survive for a hidden subject is the contact-facing widget channel,
  # which is keyed by the contact inbox token. Contacts themselves have no pubsub token.
  def contact_side_tokens
    [hidden_contact_inbox.pubsub_token]
  end

  def payload_for(event_name, conversation:, message:, contact:)
    case event_name
    when 'message.created', 'message.updated' then { message: message }
    when 'contact.created' then { contact: contact }
    when 'contact.updated' then { contact: contact, changed_attributes: { name: %w[old new] } }
    when 'assignee.changed' then { conversation: conversation, notifiable_assignee_change: true }
    when 'conversation.updated', 'conversation.status_changed'
      { conversation: conversation, changed_attributes: { status: %w[open resolved] } }
    else { conversation: conversation }
    end
  end

  %w[conversation.created conversation.updated conversation.status_changed conversation.resolved
     message.created message.updated assignee.changed contact.created contact.updated].each do |event_name|
    it "leaks nothing to the account when #{event_name} fires for a hidden subject" do
      notifications = Notification.count
      reporting_events = ReportingEvent.count
      payload = payload_for(event_name, conversation: hidden_conversation, message: hidden_message, contact: hidden_contact)

      dispatch(event_name, payload)

      expect(enqueued_job_classes).not_to include(WebhookJob)
      expect(enqueued_job_classes).not_to include(AgentBots::WebhookJob)
      expect(enqueued_job_classes).not_to include(HookJob)
      expect(Notification.count).to eq(notifications)
      expect(ReportingEvent.count).to eq(reporting_events)
      expect(broadcast_tokens - contact_side_tokens).to be_empty
    end
  end

  it 'does not evaluate automation rules for a hidden conversation' do
    dispatch('conversation.updated', conversation: hidden_conversation, changed_attributes: { status: %w[open resolved] })

    expect(AutomationRules::ConditionsFilterService).not_to have_received(:new)
  end

  it 'still broadcasts to the hidden contact so the widget keeps working' do
    dispatch('message.created', message: hidden_message)

    expect(broadcast_tokens).to eq([hidden_contact_inbox.pubsub_token])
  end

  it 'still runs the contact-facing CSAT survey for a hidden conversation' do
    csat_inbox = create(:inbox, account: account, csat_survey_enabled: true)
    resolved_hidden_conversation = create(
      :conversation, account: account, inbox: csat_inbox, contact: hidden_contact, status: :resolved,
                     contact_inbox: create(:contact_inbox, contact: hidden_contact, inbox: csat_inbox)
    )
    allow(CsatSurveyService).to receive(:new).and_return(instance_double(CsatSurveyService, perform: true))

    dispatch('conversation.status_changed', conversation: resolved_hidden_conversation,
                                            changed_attributes: { status: %w[open resolved] })

    expect(CsatSurveyService).to have_received(:new).with(conversation: resolved_hidden_conversation)
  end

  it 'still delivers account webhooks for a visible conversation' do
    dispatch('conversation.created', conversation: visible_conversation)

    expect(enqueued_job_classes).to include(WebhookJob)
  end

  it 'still delivers agent bot webhooks and integration hooks for a visible message' do
    dispatch('message.created', message: visible_message)

    expect(enqueued_job_classes).to include(AgentBots::WebhookJob)
    expect(enqueued_job_classes).to include(HookJob)
  end

  it 'still notifies the assignee of a visible conversation' do
    expect { dispatch('assignee.changed', conversation: visible_conversation, notifiable_assignee_change: true) }
      .to change(Notification, :count).by(1)
  end

  it 'still records reporting events for a visible conversation' do
    expect { dispatch('conversation.resolved', conversation: visible_conversation) }
      .to change(ReportingEvent, :count)
  end

  it 'still broadcasts a visible conversation to agents and admins' do
    dispatch('message.created', message: visible_message)

    expect(broadcast_tokens).to include(agent.pubsub_token, administrator.pubsub_token)
  end

  it 'still evaluates automation rules for a visible conversation' do
    dispatch('conversation.updated', conversation: visible_conversation, changed_attributes: { status: %w[open resolved] })

    expect(AutomationRules::ConditionsFilterService).to have_received(:new)
  end
end
