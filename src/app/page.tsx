'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type SensorData = {
  bpm: number
  bpm_avg: number
  ds18b20_temp: number
  dht11_temp: number
  humidity: number
  timestamp: string
}


export default function HealthDashboard() {
  const [data, setData] = useState<SensorData>()
  const [history, setHistory] = useState<SensorData[]>([])
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [showConfig, setShowConfig] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('https://healthmonitoring-production.up.railway.app/sensor/data')
        setData(res.data)
      } catch (err) {
        console.error('Failed to fetch current sensor data', err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('https://healthmonitoring-production.up.railway.app/sensor/history')
        setHistory(res.data.reverse())
      } catch (err) {
        console.error('Failed to fetch history', err)
      }
    }

    fetchHistory()
  }, [])

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('https://healthmonitoring-production.up.railway.app/sensor/configure', { ssid, password })
      setMessage('✅ Sensor configured successfully')
    } catch (err) {
      console.error('Configuration failed', err)
      setMessage('❌ Configuration failed')
    }
  }

  const showAlert = () => {
    if (!data) return null
    if (data.bpm < 60 || data.bpm > 100) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>⚠️ Abnormal Heart Rate</AlertTitle>
          <AlertDescription>
            Current BPM is <b>{data.bpm}</b>. Please consult a doctor if this persists.
          </AlertDescription>
        </Alert>
      )
    }
    return (
      <Alert className="mb-4">
        <AlertTitle>✅ Heart Rate Normal</AlertTitle>
        <AlertDescription>
          BPM is <b>{data.bpm}</b>. No issues detected.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-center flex-grow">🩺 Health Monitoring Dashboard</h1>
        <Button className="ml-4" onClick={() => setShowConfig(!showConfig)}>Configure</Button>
      </div>

      {showConfig && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔧 Configure Sensor Wi-Fi</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleConfigSubmit}>
              <div>
                <Label htmlFor="ssid">SSID</Label>
                <Input id="ssid" value={ssid} onChange={(e) => setSsid(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit">Submit</Button>
            </form>
            {message && <p className="mt-4 text-sm font-medium text-green-600">{message}</p>}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="current">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="current">Live Data</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {showAlert()}
          <Card>
            <CardHeader>
              <CardTitle>📡 Live Sensor Data</CardTitle>
            </CardHeader>
            {data && 'bpm' in data ? (
              <CardContent className="grid gap-4 p-6">
                <div className="text-xl">❤️ Heart Rate: <b>{data.bpm ?? '--'} bpm</b></div>
                <div className="text-xl">📊 Avg BPM: <b>{data.bpm_avg ?? '--'} bpm</b></div>
                <div className="text-xl">🌡️ Body Temp: <b>{data.ds18b20_temp ?? '--'} °C</b></div>
                <div className="text-xl">🏠 Room Temp: <b>{data.dht11_temp ?? '--'} °C</b></div>
                <div className="text-xl">💧 Humidity: <b>{data.humidity ?? '--'}%</b></div>
                <div className="text-sm text-gray-500">Updated: {data.timestamp?.slice(0, 19).replace('T', ' ')}</div>
              </CardContent>
            ) : (
              <div className="p-6 text-red-500 font-medium"><b>⚠️ Data Invalid or Not Loaded</b></div>
            )}

          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📈 BPM Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.map(item => ({
                    bpm: item.bpm,
                    timestamp: item.timestamp?.slice(11, 19),
                  }))}>
                    <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                    <YAxis domain={[40, 160]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="bpm" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🕑 Historical Readings</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 border rounded-lg p-4">
                  <ul className="space-y-2 text-sm">
                    {history.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span>❤️ {item.bpm} bpm</span>
                        <span>🌡️ {item.ds18b20_temp} °C</span>
                        <span>{item.timestamp?.slice(11, 19)}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}