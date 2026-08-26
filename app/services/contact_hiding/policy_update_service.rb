class ContactHiding::PolicyUpdateService
  pattr_initialize [:account!, :params!]

  def build
    policy = account.contact_hiding_policy || account.build_contact_hiding_policy
    policy.assign_attributes(attributes)
    # Surfaced as a model validation so it survives the controller's `policy.valid?`
    # re-run and renders a clear message instead of an undiagnosable 422.
    policy.enabling_without_operands = enabling_without_operands?
    policy
  end

  def perform
    build.save!
  end

  private

  # Only overwrite the keys actually provided. `to_i` on a missing key would coerce
  # it to 0, silently zeroing a stored operand on a partial update (e.g. a request
  # that only flips `enabled`). Editing N/M never resets inbound_contact_count, so
  # the cycle phase re-derives from the new cycle length instead of restarting.
  def attributes
    attrs = {}
    attrs[:enabled] = enabling? if params.key?(:enabled)
    attrs[:visible_per_cycle] = params[:visible_per_cycle].to_i if operand_provided?(:visible_per_cycle)
    attrs[:hidden_per_cycle] = params[:hidden_per_cycle].to_i if operand_provided?(:hidden_per_cycle)
    attrs
  end

  # Turning hiding on requires both operands so the admin never enables a policy
  # against defaulted or stale N/M values without saying so explicitly.
  def enabling_without_operands?
    return false unless enabling?

    !(operand_provided?(:visible_per_cycle) && operand_provided?(:hidden_per_cycle))
  end

  def enabling?
    params.key?(:enabled) && ActiveModel::Type::Boolean.new.cast(params[:enabled])
  end

  def operand_provided?(key)
    params.key?(key) && params[key].to_s.present?
  end
end
