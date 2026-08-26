class BaseListener
  include Singleton

  def extract_conversation_and_account(event)
    conversation = event.data[:conversation]
    [conversation, conversation.account]
  end

  def extract_notification_and_account(event)
    notification = event.data[:notification]
    notification_finder = NotificationFinder.new(notification.user, notification.account)
    unread_count = notification_finder.unread_count
    count = notification_finder.count
    [notification, notification.account, unread_count, count]
  end

  def extract_message_and_account(event)
    message = event.data[:message]
    [message, message.account]
  end

  def extract_contact_and_account(event)
    contact = event.data[:contact]
    [contact, contact.account]
  end

  def extract_inbox_and_account(event)
    inbox = event.data[:inbox]
    [inbox, inbox.account]
  end

  def extract_changed_attributes(event)
    changed_attributes = event.data[:changed_attributes]

    return if changed_attributes.blank?

    changed_attributes.map { |k, v| { k => { previous_value: v[0], current_value: v[1] } } }
  end

  def hidden_subject?(event)
    hidden_conversation?(event.data) || hidden_contact?(event.data)
  end

  private

  def hidden_conversation?(data)
    conversation = data[:conversation] || data[:message]&.conversation
    conversation&.hidden? || false
  end

  def hidden_contact?(data)
    contact = data[:contact] || data[:contact_inbox]&.contact
    contact&.hidden? || false
  end
end
