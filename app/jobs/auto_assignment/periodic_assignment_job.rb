class AutoAssignment::PeriodicAssignmentJob < ApplicationJob
  queue_as :scheduled_jobs

  def perform
    Account.find_in_batches do |accounts|
      accounts.each do |account|
        next unless account.feature_enabled?('assignment_v2')

        # A disabled policy pauses its inboxes, so they never reach the assignment queue.
        eligible_inboxes = account.inboxes.joins(:assignment_policy).where(assignment_policies: { enabled: true })

        eligible_inboxes.find_in_batches do |inboxes|
          inboxes.each do |inbox|
            next unless inbox.auto_assignment_v2_enabled?

            AutoAssignment::AssignmentJob.enqueue_for_inbox(inbox.id)
          end
        end
      end
    end
  end
end
