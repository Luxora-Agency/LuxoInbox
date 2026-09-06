class Api::V1::Accounts::Conversations::MessengerTemplateContextsController < Api::V1::Accounts::Conversations::BaseController
  def show
    authorize :messenger_simulator, :show?
    response.headers['Cache-Control'] = 'no-store'
    template = Current.account.messenger_templates.find(template_id)
    contact = @conversation.contact
    token = context_token(template, contact)
    if authorize_only?
      return render json: { error: 'Template context changed' }, status: :conflict unless params[:context_token] == token

      return head :no_content
    end

    render json: {
      template: template.as_json(only: [:id, :title, :definition, :updated_at]),
      contact: MessengerScreenshot::ContactPresenter.new(contact).as_json,
      context_token: token
    }
  end

  private

  def template_id
    value = params[:template_id]
    raise ActionController::ParameterMissing, :template_id unless value.is_a?(String) && value.match?(/\A[1-9]\d{0,17}\z/)

    value
  end

  def authorize_only?
    value = params[:authorize_only]
    raise ActionController::ParameterMissing, :authorize_only unless value.nil? || %w[true false].include?(value)
    return false unless value == 'true'

    token = params[:context_token]
    raise ActionController::ParameterMissing, :context_token unless token.is_a?(String) && token.match?(/\A[0-9a-f]{64}\z/)

    true
  end

  def context_token(template, contact)
    # Unrelated messages must not invalidate a template-only export.
    Digest::SHA256.hexdigest([
      Current.account.id, @conversation.id, template.cache_key_with_version,
      contact.name, contact.phone_number, contact.avatar.attachment&.blob_id
    ].to_json)
  end
end
