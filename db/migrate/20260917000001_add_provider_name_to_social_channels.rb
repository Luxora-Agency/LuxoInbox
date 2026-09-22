# Renumbered from upstream's 20260831000000: that version is already recorded in this fork's
# databases by 20260831000000_change_web_widget_default_color_to_orbis_navy, so keeping the
# upstream timestamp would make Rails treat this migration as already run and never add the columns.
class AddProviderNameToSocialChannels < ActiveRecord::Migration[7.1]
  def change
    add_column :channel_instagram, :provider_name, :string
    add_column :channel_tiktok, :provider_name, :string
    add_column :channel_facebook_pages, :provider_name, :string
  end
end
