class Api::V1::Accounts::MessengerSimulatorController < Api::V1::Accounts::BaseController
  def show
    authorize :messenger_simulator, :show?
    response.headers['Cache-Control'] = 'no-store'
    head :no_content
  end
end
