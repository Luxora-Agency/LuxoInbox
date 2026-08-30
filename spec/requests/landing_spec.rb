require 'rails_helper'

describe 'Landing', type: :request do
  let(:public_key) { 'pub_test_landing_key' }
  let(:integrity_secret) { 'test_integrity_secret' }

  describe 'GET /' do
    it 'renders the marketing page without authentication' do
      get '/'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Todas tus conversaciones en una sola bandeja')
      expect(response.body).to include('id="collection-grid"')
      expect(response.body).to include('/landing/landing.css')
    end

    it 'is served by the landing controller' do
      expect(Rails.application.routes.recognize_path('/', method: :get)).to eq(controller: 'landing', action: 'index')
    end
  end

  describe 'POST /landing/wompi_session' do
    it 'signs the reference with the server side price' do
      with_modified_env WOMPI_PUBLIC_KEY: public_key, WOMPI_INTEGRITY_SECRET: integrity_secret do
        post '/landing/wompi_session', params: { plan_id: 'crecimiento' }

        expect(response).to have_http_status(:success)
        expect(response.parsed_body['public_key']).to eq(public_key)
        expect(response.parsed_body['currency']).to eq('COP')
        expect(response.parsed_body['amount_in_cents']).to eq(18_990_000)
        expect(response.parsed_body['reference']).to start_with('LUXOINBOX-crecimiento-')
        expect(response.parsed_body['signature']).to eq(
          Digest::SHA256.hexdigest("#{response.parsed_body['reference']}18990000COP#{integrity_secret}")
        )
      end
    end

    it 'redirects the payer back to the payment result page' do
      with_modified_env WOMPI_PUBLIC_KEY: public_key, WOMPI_INTEGRITY_SECRET: integrity_secret do
        post '/landing/wompi_session', params: { plan_id: 'crecimiento' }

        expect(response.parsed_body['redirect_url']).to eq('http://www.example.com/pago')
      end
    end

    it 'ignores an amount supplied by the client' do
      with_modified_env WOMPI_PUBLIC_KEY: public_key, WOMPI_INTEGRITY_SECRET: integrity_secret do
        post '/landing/wompi_session', params: { plan_id: 'emprendedor', amount_in_cents: 100 }

        expect(response.parsed_body['amount_in_cents']).to eq(8_990_000)
      end
    end

    it 'returns not found for an unknown plan' do
      with_modified_env WOMPI_PUBLIC_KEY: public_key, WOMPI_INTEGRITY_SECRET: integrity_secret do
        post '/landing/wompi_session', params: { plan_id: 'gratis' }

        expect(response).to have_http_status(:not_found)
      end
    end

    it 'returns service unavailable when the wompi credentials are missing' do
      with_modified_env WOMPI_PUBLIC_KEY: nil, WOMPI_INTEGRITY_SECRET: nil do
        post '/landing/wompi_session', params: { plan_id: 'emprendedor' }

        expect(response).to have_http_status(:service_unavailable)
        expect(response.parsed_body['error']).to be_present
      end
    end
  end

  describe 'GET /app' do
    it 'keeps routing to the dashboard' do
      expect(Rails.application.routes.recognize_path('/app', method: :get)).to eq(controller: 'dashboard', action: 'index')
    end
  end
end
