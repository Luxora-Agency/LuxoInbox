class ContactHiding::DecisionService
  # Slot the row is about to consume is (OLD inbound_contact_count % cycle_length).
  # In an UPDATE, the SET expressions read OLD values while RETURNING reads NEW
  # values, so both sides below describe the same slot.
  ADVANCE_SQL = <<~SQL.squish.freeze
    UPDATE account_contact_hiding_policies
       SET inbound_contact_count = inbound_contact_count + 1,
           hidden_contact_count = hidden_contact_count
             + CASE WHEN (inbound_contact_count % (visible_per_cycle + hidden_per_cycle))
                         >= visible_per_cycle THEN 1 ELSE 0 END,
           updated_at = NOW()
     WHERE account_id = :account_id
       AND enabled = TRUE
    RETURNING ((inbound_contact_count - 1) % (visible_per_cycle + hidden_per_cycle)) AS slot,
              visible_per_cycle
  SQL

  pattr_initialize [:account!]

  # Consumes the next slot in the account's V/H cycle and returns whether this
  # contact must be created hidden. MUST run inside the same transaction as the
  # contact INSERT so a rolled-back insert also releases the slot.
  def hide_next_contact?
    sql = ActiveRecord::Base.sanitize_sql_array([ADVANCE_SQL, { account_id: account.id }])
    # The advance is an UPDATE ... RETURNING. Run it through exec_query inside an
    # uncached block so ActiveRecord's query cache can never serve a stale slot or
    # skip re-executing the counter increment. The SQL is unchanged, so the slot
    # each caller consumes stays deterministic.
    row = AccountContactHidingPolicy.uncached do
      AccountContactHidingPolicy.connection.exec_query(sql, 'ContactHiding Advance').first
    end
    return false if row.blank?

    row['slot'].to_i >= row['visible_per_cycle'].to_i
  end
end
