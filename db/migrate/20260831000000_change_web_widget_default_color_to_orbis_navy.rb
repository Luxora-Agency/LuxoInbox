class ChangeWebWidgetDefaultColorToOrbisNavy < ActiveRecord::Migration[7.1]
  def change
    # New web widgets pick up the Orbis navy launcher instead of the upstream
    # blue. Inboxes created before this migration keep their stored colour.
    change_column_default :channel_web_widgets, :widget_color, from: '#1f93ff', to: '#010828'
  end
end
