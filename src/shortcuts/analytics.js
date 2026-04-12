// Analytics / Chart shortcuts (ids 38–40, 52, 52)
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  {
    id: 38,
    name: 'Fuel Prices (30 Days)',
    icon: 'fuel',
    color: 'bg-orange',
    category: 'personal',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Postal Code',
        label: 'Enter French Postal Code (5 digits):',
        placeholder: '75001',
      }),
      step('set-var', { varName: 'postalCode' }),
      step('user-input', {
        title: 'Fuel Type',
        label: 'Enter Fuel Type:',
        placeholder: 'Gazole, SP95, SP98, E10, E85, GPLc',
        prefill: 'Gazole',
      }),
      step('set-var', { varName: 'fuelType' }),
      step('shell', {
        title: 'Fetching 7-Day Trend',
        command: `python3 -c "
import datetime, urllib.request, zipfile, io, xml.etree.ElementTree as ET, sys
target_cp = '{{vars.postalCode}}'
target_fuel = '{{vars.fuelType}}'.lower()
if target_fuel in ['e10', 'sp95-e10']: target_fuel = 'e10'
results = []
for i in range(7):
    d = (datetime.datetime.now() - datetime.timedelta(days=i)).strftime('%Y%m%d')
    url = f'https://donnees.roulez-eco.fr/opendata/jour/{d}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            xml_name = [f for f in z.namelist() if f.endswith('.xml')][0]
            root = ET.fromstring(z.read(xml_name))
        for pdv in root.findall('pdv'):
            if pdv.get('cp') == target_cp:
                addr = pdv.find('adresse').text if pdv.find('adresse') is not None else '?'
                city = pdv.find('ville').text if pdv.find('ville') is not None else '?'
                for p in pdv.findall('prix'):
                    if p.get('nom').lower() == target_fuel:
                        results.append(f'{city} ({addr}) | {p.get(\\'maj\\')} | {p.get(\\'valeur\\')} €')
    except Exception: continue
if not results: print('No history found for this area/fuel in the last 7 days.')
else: print('\\n'.join(results))
"`,
      }),
      step('ai-prompt', {
        title: 'Analyze Trend',
        prompt: 'Analyze the following 7-day fuel price history. \n1. Create a beautiful Markdown table showing the LATEST price for each station.\n2. Briefly summarize the price trend over the week.\n3. Mention the cheapest station found.\n\nData (Station | Date | Price):\n{{result}}',
        systemPrompt: 'You are an expert fuel market analyst. Output a clear Markdown summary with a well-formatted table. You MUST start and end every table row with a pipe character (|). Use the format: | Station | Date | Price |',
      }),
      step('show-result', { title: 'Weekly Fuel Trend', label: 'Fuel Trend at {{vars.postalCode}}' }),
    ],
  },
  {
    id: 39,
    name: 'Weekly Visitors',
    icon: 'bar-chart',
    color: 'bg-indigo',
    category: 'media',
    favorite: false,
    steps: [
      step('show-result', {
        title: 'Generate Demo Data',
        label: 'Generating demo data...',
      }),
      step('plot-chart', {
        title: 'Website Visitors (Last 7 Days)',
        chartType: 'line',
        xAxis: 'day',
        yAxis: 'count',
        data: '[{"day":"Mon","count":1200},{"day":"Tue","count":1900},{"day":"Wed","count":1500},{"day":"Thu","count":2100},{"day":"Fri","count":2400},{"day":"Sat","count":1800},{"day":"Sun","count":1300}]',
      }),
      step('show-result', { title: 'Visitor Analytics', label: 'Performance Report' }),
    ],
  },
  {
    id: 40,
    name: 'Fuel Price Chart',
    icon: 'line-chart',
    color: 'bg-green',
    category: 'ai',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Postal Code',
        label: 'Enter French Postal Code (5 digits):',
        placeholder: '75001',
      }),
      step('set-var', { varName: 'postalCode' }),
      step('user-input', {
        title: 'Fuel Type',
        label: 'Enter Fuel Type:',
        placeholder: 'Gazole, SP95, SP98, E10, E85, GPLc',
        prefill: 'Gazole',
      }),
      step('set-var', { varName: 'fuelType' }),
      step('shell', {
        title: 'Fetching price history',
        command: `python3 -c "
import datetime, urllib.request, zipfile, io, xml.etree.ElementTree as ET, sys
target_cp = '{{vars.postalCode}}'
target_fuel = '{{vars.fuelType}}'.lower()
if target_fuel in ['e10', 'sp95-e10']: target_fuel = 'e10'
results = []
for i in range(7):
    # Loop over last 7 days
    d = (datetime.datetime.now() - datetime.timedelta(days=i)).strftime('%Y%m%d')
    url = f'https://donnees.roulez-eco.fr/opendata/jour/{d}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            xml_name = [f for f in z.namelist() if f.endswith('.xml')][0]
            root = ET.fromstring(z.read(xml_name))
        for pdv in root.findall('pdv'):
            if pdv.get('cp') == target_cp:
                for p in pdv.findall('prix'):
                    if p.get('nom').lower() == target_fuel:
                        results.append(f'{p.get(\\'maj\\')[:10]} | {p.get(\\'valeur\\')}')
    except Exception: continue
if not results: print('No price data found.')
else: print('\\n'.join(results))
"`,
      }),
      step('ai-prompt', {
        title: 'Format Data for Chart',
        prompt: 'Transform the following fuel price data into a JSON array of objects with "date" and "price" keys. Average the prices if multiple stations exist for the same date. Return ONLY the JSON array.\n\nData (Date | Price):\n{{result}}',
        systemPrompt: 'You are a data transformation assistant. Output only a valid JSON array of objects like [{"date": "YYYY-MM-DD", "price": 1.75}, ...]. Sort by date ascending.',
      }),
      step('plot-chart', {
        title: '{{vars.fuelType}} Price Trend (Last 7 Days)',
        chartType: 'line',
        xAxis: 'date',
        yAxis: 'price',
        data: '{{result}}',
      }),
      step('show-result', { title: 'Price Analysis', label: 'Trend at {{vars.postalCode}}' }),
    ],
  },
  {
    id: 52,
    name: 'News Summary',
    icon: 'newspaper',
    color: 'bg-blue',
    category: 'ai',
    favorite: true,
    steps: [
      step('user-input', { title: 'Topic', label: 'Search news about:', placeholder: 'OpenAI, Ubuntu, Space...' }),
      step('google-search', { title: 'Searching...', query: 'latest news on {{result}}', numResults: 5 }),
      step('ai-prompt', {
        title: 'Summarizing...',
        prompt: 'Based on these search results, provide a 5-bullet point summary of the latest news on this topic:\n\n{{result}}',
      }),
      step('show-result', { title: 'Daily Brief', label: 'News Summary' }),
    ],
  },
]
