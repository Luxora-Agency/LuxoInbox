require 'rails_helper'

describe 'Landing pages', type: :request do
  describe 'GET /caracteristicas' do
    it 'renders the features page' do
      get '/caracteristicas'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Una bandeja. Todos tus canales.')
      expect(response.body).to include('Omnicanal')
    end
  end

  describe 'GET /precios' do
    it 'renders the pricing page from the server side plans' do
      get '/precios'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('EMPRENDEDOR')
      expect(response.body).to include('$ 89.900 COP')
      expect(response.body).to include('Preguntas frecuentes')
    end

    it 'embeds the wompi public key so the checkout works outside the home page' do
      with_modified_env WOMPI_PUBLIC_KEY: 'pub_test_precios_key' do
        get '/precios'

        expect(response.body).to include('data-wompi-public-key="pub_test_precios_key"')
      end
    end
  end

  describe 'GET /contacto' do
    it 'renders the contact page' do
      get '/contacto'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('hola@luxoinbox.com')
    end
  end

  describe 'GET /terminos' do
    it 'renders the terms page' do
      get '/terminos'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Términos y Condiciones')
    end
  end

  describe 'GET /privacidad' do
    it 'renders the privacy policy' do
      get '/privacidad'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Ley 1581 de 2012')
    end
  end

  describe 'GET /pago' do
    it 'renders the verification panel without a transaction id' do
      get '/pago'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('id="pago-result"')
      expect(response.body).to include('Verificando tu pago')
    end

    it 'renders the verification panel when wompi appends a transaction id' do
      get '/pago', params: { id: '01-1660000000-49201' }

      expect(response).to have_http_status(:success)
      expect(response.body).to include('id="pago-result"')
    end
  end

  describe 'marketing subpages on a help center custom domain' do
    let(:account) { create(:account) }
    let!(:portal) do
      create(:portal, account: account, slug: 'doc-portal', custom_domain: 'docs.example.com',
                      config: { allowed_locales: ['en'], default_locale: 'en' })
    end

    around do |example|
      with_modified_env FRONTEND_URL: 'http://www.chatwoot.test' do
        example.run
      end
    end

    it 'redirects to the portal home instead of serving marketing content' do
      host! portal.custom_domain
      get '/precios'

      expect(response).to redirect_to('/')
    end

    it 'keeps serving the subpages on the installation domain' do
      host! 'www.chatwoot.test'
      get '/precios'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Preguntas frecuentes')
    end
  end
end
