import { useEffect, useState } from 'react'
import { TonConnectUIProvider, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import axios from 'axios'

function App() {
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const tg = window.Telegram.WebApp
    tg.ready()
    tg.expand()

    if (wallet?.account?.address) {
      fetchUser(wallet.account.address)
    }
  }, [wallet])

  const fetchUser = async (addr) => {
    try {
      const res = await axios.get(`/api/balance/${addr}`)
      setUser(res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        await axios.post('/api/register', { wallet: addr })
        fetchUser(addr)
      }
    }
  }

  const sendTx = async (amount, endpoint, payload = {}) => {
    setLoading(true)
    try {
      await tonConnectUI.sendTransaction({
        messages: [{
          address: 'UQBkqGcHhyjf4sRcuaeSpoWH8OKPZueOOStkd2I96c2aIF8G',
          amount: (amount * 1e9).toString()
        }],
        validUntil: Math.floor(Date.now() / 1000) + 300
      })
      await axios.post(endpoint, { wallet: wallet.account.address, ...payload })
      fetchUser(wallet.account.address)
      setToast('Успешно!')
    } catch (err) {
      setToast('Ошибка: ' + (err.message || 'Попробуй снова'))
    } finally {
      setLoading(false)
    }
  }

  const claim = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/api/claim', { wallet: wallet.account.address })
      setUser(res.data.user)
      setToast(`Начислено ${res.data.reward.toFixed(2)} GoldX`)
    } catch (err) {
      setToast('Ошибка: ' + err.response?.data?.error)
    } finally {
      setLoading(false)
    }
  }

  const openCase = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/api/open-case', { wallet: wallet.account.address })
      setUser(res.data.user)
      setToast(res.data.prize)
    } catch (err) {
      setToast('Ошибка: ' + err.response?.data?.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <TonConnectUIProvider manifestUrl={import.meta.env.VITE_MANIFEST_URL}>
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <h1>GoldX Market</h1>

        {wallet ? (
          <>
            <div style={{ margin: '20px 0' }}>
              <div>GoldX: {user?.goldX?.toFixed(2) || 0}</div>
              <div>Staked TON: {user?.stakedTON?.toFixed(2) || 0}</div>
              <div>Keys: {user?.keys || 0}</div>
            </div>

            <button disabled={loading} onClick={() => sendTx(2, '/api/buy-goldx', { amount: 1 })}>
              Купить 1 GoldX (2 TON)
            </button>

            <button disabled={loading} onClick={() => sendTx(1000, '/api/stake', { amount: 1000 })}>
              Стейк 1000 TON
            </button>

            <button disabled={loading} onClick={claim}>
              Claim Rewards
            </button>

            <button disabled={loading} onClick={() => sendTx(0.1, '/api/buy-key')}>
              Купить ключ (0.1 TON)
            </button>

            <button disabled={loading} onClick={openCase}>
              Открыть кейс (10 GoldX + 1 ключ)
            </button>
          </>
        ) : (
          <p>Подключи TON-кошелёк</p>
        )}

        {toast && <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '10px 20px', borderRadius: '10px' }}>
          {toast}
        </div>}
      </div>
    </TonConnectUIProvider>
  )
}

export default App
